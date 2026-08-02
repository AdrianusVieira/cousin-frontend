import { toHistory, toPendingCredit } from "@/pages/Credit/useCredit";
import type { CreditResponse } from "@/types/api";

// The hook module reaches the API client, which boots `env` and Supabase at import time.
// Neither is needed to exercise the pure derivations below.
vi.mock("@/lib/api/client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

type Group = CreditResponse["groups"][number];

const NUBANK = "11111111-1111-1111-1111-111111111111";
const ITAU = "22222222-2222-2222-2222-222222222222";

const makeGroup = (overrides: Partial<Group> = {}): Group => ({
  settled: false,
  term: "2026-06-01",
  total: "100.00",
  transactions: [],
  walletId: NUBANK,
  walletName: "Nubank",
  ...overrides,
});

describe("toPendingCredit", () => {
  it("should return a zero total for no groups", () => {
    expect(toPendingCredit([]).total).toBe("0.00");
  });

  it("should return an empty breakdown when every group is settled", () => {
    const groups = [makeGroup({ settled: true })];

    expect(toPendingCredit(groups).perWallet).toEqual([]);
  });

  it("should exclude a settled group from the total", () => {
    const groups = [makeGroup({ settled: true, total: "500.00" }), makeGroup({ total: "100.00" })];

    expect(toPendingCredit(groups).total).toBe("100.00");
  });

  it("should count a partially settled statement in full", () => {
    const groups = [makeGroup({ settled: false, total: "250.00" })];

    expect(toPendingCredit(groups).total).toBe("250.00");
  });

  it("should sum multiple terms of the same wallet into one entry", () => {
    const groups = [
      makeGroup({ term: "2026-05-01", total: "100.00" }),
      makeGroup({ term: "2026-06-01", total: "50.50" }),
    ];

    expect(toPendingCredit(groups).perWallet).toEqual([
      { total: "150.50", walletId: NUBANK, walletName: "Nubank" },
    ]);
  });

  it("should keep wallets separate in the breakdown", () => {
    const groups = [
      makeGroup({ total: "100.00" }),
      makeGroup({ total: "40.00", walletId: ITAU, walletName: "Itau" }),
    ];

    expect(toPendingCredit(groups).perWallet).toHaveLength(2);
  });

  it("should order the breakdown by descending total", () => {
    const groups = [
      makeGroup({ total: "40.00", walletId: ITAU, walletName: "Itau" }),
      makeGroup({ total: "100.00" }),
    ];

    expect(toPendingCredit(groups).perWallet.map((w) => w.walletName)).toEqual(["Nubank", "Itau"]);
  });

  it("should sum the breakdown into the reported total", () => {
    const groups = [
      makeGroup({ total: "100.00" }),
      makeGroup({ total: "40.00", walletId: ITAU, walletName: "Itau" }),
    ];

    expect(toPendingCredit(groups).total).toBe("140.00");
  });

  it("should bucket a group with no wallet id under the external wallet", () => {
    const groups = [makeGroup({ walletId: "", walletName: "" })];

    expect(toPendingCredit(groups).perWallet).toEqual([
      { total: "100.00", walletId: "external", walletName: "External" },
    ]);
  });

  it("should round a fractional sum to two decimals", () => {
    const groups = [makeGroup({ total: "0.1" }), makeGroup({ total: "0.2" })];

    expect(toPendingCredit(groups).total).toBe("0.30");
  });
});

describe("toHistory", () => {
  it("should return no points for no groups", () => {
    expect(toHistory([]).points).toEqual([]);
  });

  it("should emit one point per term", () => {
    const groups = [
      makeGroup({ term: "2026-05-01" }),
      makeGroup({ term: "2026-06-01" }),
      makeGroup({ term: "2026-06-01", walletId: ITAU, walletName: "Itau" }),
    ];

    expect(toHistory(groups).points).toHaveLength(2);
  });

  it("should order points by ascending term", () => {
    const groups = [makeGroup({ term: "2026-06-01" }), makeGroup({ term: "2026-05-01" })];

    expect(toHistory(groups).points.map((p) => p.term)).toEqual(["2026-05-01", "2026-06-01"]);
  });

  it("should key each wallet's total by wallet id", () => {
    const groups = [makeGroup({ total: "123.45" })];

    expect(toHistory(groups).points[0]![NUBANK]).toBe(123.45);
  });

  it("should include settled statements, unlike the pending breakdown", () => {
    const groups = [makeGroup({ settled: true, total: "500.00" })];

    expect(toHistory(groups).points[0]![NUBANK]).toBe(500);
  });

  it("should fill a wallet with no statement in a term with zero", () => {
    const groups = [
      makeGroup({ term: "2026-05-01" }),
      makeGroup({ term: "2026-06-01", walletId: ITAU, walletName: "Itau" }),
    ];

    expect(toHistory(groups).points[0]![ITAU]).toBe(0);
  });

  it("should merge duplicate wallet-term rows into a single total", () => {
    const groups = [makeGroup({ total: "100.00" }), makeGroup({ total: "25.50" })];

    expect(toHistory(groups).points[0]![NUBANK]).toBe(125.5);
  });

  it("should list each wallet once across all terms", () => {
    const groups = [makeGroup({ term: "2026-05-01" }), makeGroup({ term: "2026-06-01" })];

    expect(toHistory(groups).wallets).toEqual([{ id: NUBANK, name: "Nubank" }]);
  });

  it("should order wallets alphabetically so the stack order is stable across renders", () => {
    const groups = [makeGroup(), makeGroup({ walletId: ITAU, walletName: "Itau" })];

    expect(toHistory(groups).wallets.map((w) => w.name)).toEqual(["Itau", "Nubank"]);
  });

  it("should bucket a group with no wallet id under the external wallet", () => {
    const groups = [makeGroup({ walletId: "", walletName: "" })];

    expect(toHistory(groups).wallets).toEqual([{ id: "external", name: "External" }]);
  });
});
