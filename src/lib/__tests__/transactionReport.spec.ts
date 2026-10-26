import { vi } from "vitest";

vi.mock("@/lib/api/client", () => ({ api: { get: vi.fn() } }));

import { api } from "@/lib/api/client";
import {
  downloadTransactionReport,
  fetchTransactionReport,
  REPORT_FORMAT,
  reportCsv,
  reportMarkdown,
  validateReportPeriod,
} from "@/lib/transactionReport";
import type { Transaction, TransactionListResponse } from "@/types/api";

const period = { from: "2026-07-01", to: "2026-08-31" };
const summary = { totalIn: "20.00", totalOut: "12.34", net: "7.66" };
function makeTransaction(patch: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    amount: "12.34",
    date: "2026-07-01",
    description: 'Café, "lunch"\nwith friends',
    method: "credit",
    category: null,
    categoryAllocations: [
      { categoryId: "food", categoryName: "Food", amount: "10.00" },
      { categoryId: "home", categoryName: "Home", amount: "2.34" },
    ],
    from: { type: "wallet", id: "wallet-1", name: "Account" },
    to: { type: "external", id: null, name: null },
    installmentNumber: 1,
    installmentTotal: 2,
    creditGroupId: "credit-1",
    settled: true,
    settledAt: "2026-09-15",
    term: "2026-09-15",
    kind: "moneyOut",
    sign: "-",
    createdAt: "2026-07-01T12:00:00Z",
    updatedAt: "2026-07-01T12:00:00Z",
    ...patch,
  };
}
function makeReport(items = [makeTransaction()]): TransactionListResponse {
  return { items, summary, nextCursor: null };
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("transaction reports", () => {
  it("should collect all pages with the chosen dates and no table filters", async () => {
    const firstPage = Array.from({ length: 200 }, (_, index) =>
      makeTransaction({ id: `txn-${index}` }),
    );
    vi.mocked(api.get)
      .mockResolvedValueOnce({ ...makeReport(firstPage), nextCursor: "next" })
      .mockResolvedValueOnce(makeReport([makeTransaction({ id: "txn-200" })]));
    const signal = new AbortController().signal;
    const result = await fetchTransactionReport(period, signal);
    expect({
      count: result.items.length,
      summary: result.summary,
      requests: vi.mocked(api.get).mock.calls,
    }).toEqual({
      count: 201,
      summary,
      requests: [
        ["/transactions", { query: { ...period, cursor: null, limit: 200 }, signal }],
        ["/transactions", { query: { ...period, cursor: "next", limit: 200 }, signal }],
      ],
    });
  });

  it("should fail the whole export if a later page fails", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ ...makeReport(), nextCursor: "next" })
      .mockRejectedValueOnce(new Error("Unavailable"));
    await expect(fetchTransactionReport(period, new AbortController().signal)).rejects.toThrow(
      "Unavailable",
    );
  });

  it("should stop a cancelled export before requesting more pages", async () => {
    const controller = new AbortController();
    vi.mocked(api.get).mockImplementationOnce(async () => {
      controller.abort();
      return { ...makeReport(), nextCursor: "next" };
    });
    await expect(fetchTransactionReport(period, controller.signal)).rejects.toThrow();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("should fail if the API repeats a cursor instead of looping forever", async () => {
    vi.mocked(api.get).mockResolvedValue({ ...makeReport(), nextCursor: "same" });
    await expect(fetchTransactionReport(period, new AbortController().signal)).rejects.toThrow(
      "complete report",
    );
  });

  it.each([
    { from: "", to: "2026-08-31" },
    { from: "2026-02-30", to: "2026-08-31" },
    { from: "2026-02-29", to: "2026-08-31" },
    { from: "2026-08-31", to: "2026-07-01" },
  ])("should reject invalid periods: %j", (range) => {
    expect(validateReportPeriod(range)).not.toBeNull();
  });

  it.each([
    { from: "2026-08-31", to: "2026-08-31" },
    { from: "2024-02-29", to: "2026-08-31" },
  ])("should accept same-day and leap-year periods: %j", (range) => {
    expect(validateReportPeriod(range)).toBeNull();
  });

  it("should preserve CSV Unicode, quotes, line breaks, exact amounts, category splits and settlement dates", () => {
    expect(reportCsv(makeReport())).toContain(
      '"txn-1","2026-07-01","Café, ""lunch""\nwith friends","12.34","credit","Food: 10.00; Home: 2.34","wallet","Account","external","","moneyOut","-","1","2","2026-09-15","true","2026-09-15"',
    );
  });

  it.each(["=HYPERLINK(1)", "+cmd", "-cmd", "@SUM(1)", "\t =1"])(
    "should neutralize CSV formulas in text: %s",
    (description) => {
      expect(reportCsv(makeReport([makeTransaction({ description })]))).toContain(
        `"'${description}"`,
      );
    },
  );

  it("should keep negative manual adjustment amounts numeric", () => {
    expect(reportCsv(makeReport([makeTransaction({ amount: "-12.34", sign: null })]))).toContain(
      ',"-12.34",',
    );
  });

  it("should escape Markdown content without losing report totals or dates", () => {
    const content = reportMarkdown(
      makeReport([makeTransaction({ description: "A|B\n<script>*test*" })]),
      period,
    );
    expect(content).toContain("A&#124;B<br>&lt;script&gt;\\*test\\*");
    expect(content).toContain("Period: 2026-07-01 – 2026-08-31");
    expect(content).toContain("- Net: 7.66");
    expect(content).toContain("1/2 | 2026-09-15 | Yes | 2026-09-15");
  });

  it("should create valid empty reports", () => {
    expect(reportCsv(makeReport([])).split("\r\n")).toHaveLength(2);
    expect(reportMarkdown(makeReport([]), period)).toContain("No transactions for this period.");
  });

  it.each([REPORT_FORMAT.Csv, REPORT_FORMAT.Markdown])(
    "should download a dated %s file and release its object URL",
    (format) => {
      vi.useFakeTimers();
      const create = vi.fn(() => "blob:report");
      const revoke = vi.fn();
      vi.stubGlobal(
        "URL",
        class extends URL {
          static createObjectURL = create;
          static revokeObjectURL = revoke;
        },
      );
      let filename = "";
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        filename = this.download;
      });
      try {
        downloadTransactionReport(makeReport(), period, format);
        expect(filename).toBe(`transactions-2026-07-01-to-2026-08-31.${format}`);
        expect(create.mock.calls[0]?.length).toBe(1);
        vi.runAllTimers();
        expect(revoke).toHaveBeenCalledWith("blob:report");
      } finally {
        vi.unstubAllGlobals();
        vi.useRealTimers();
      }
    },
  );
});
