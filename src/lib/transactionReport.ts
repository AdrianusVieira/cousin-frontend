import { api } from "@/lib/api/client";
import type { Period } from "@/lib/period";
import type { Transaction, TransactionListResponse } from "@/types/api";

export const REPORT_FORMAT = { Csv: "csv", Markdown: "md" } as const;
export type ReportFormat = (typeof REPORT_FORMAT)[keyof typeof REPORT_FORMAT];

const TEXT = {
  basis:
    "Dates are purchase/movement dates, inclusive. Credit installments retain their individual statement due dates. Amounts are decimal values in the app's currency.",
  empty: "No transactions for this period.",
  external: "External",
  invalidDate: "Enter valid start and end dates.",
  invalidRange: "End date must be on or after start date.",
  net: "Net",
  no: "No",
  paginationError: "Could not retrieve the complete report. Please try again.",
  period: "Period",
  scope: "Includes all transactions in the period, regardless of table filters or selection.",
  summary:
    "Totals use the server's transaction classification and exclude internal transfers and manual adjustments.",
  title: "Transaction report",
  totalIn: "Total In",
  totalOut: "Total Out",
  transactions: "Transactions",
  yes: "Yes",
};

type Report = Pick<TransactionListResponse, "items" | "summary">;

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateReportPeriod(period: Period): string | null {
  if (!validDate(period.from) || !validDate(period.to)) return TEXT.invalidDate;
  return period.from > period.to ? TEXT.invalidRange : null;
}

/** Read every page afresh; never export only the currently loaded table rows. */
export async function fetchTransactionReport(period: Period, signal: AbortSignal): Promise<Report> {
  const error = validateReportPeriod(period);
  if (error) throw new Error(error);
  const items: Transaction[] = [];
  const cursors = new Set<string>();
  let cursor: string | null = null;
  let summary: Report["summary"] | undefined;
  do {
    signal.throwIfAborted();
    const page: TransactionListResponse = await api.get("/transactions", {
      query: { ...period, cursor, limit: 200 },
      signal,
    });
    summary ??= page.summary;
    items.push(...page.items);
    cursor = page.nextCursor;
    if (cursor && cursors.has(cursor)) throw new Error(TEXT.paginationError);
    if (cursor) cursors.add(cursor);
  } while (cursor);
  signal.throwIfAborted();
  return { items, summary };
}

function categories(transaction: Transaction): string {
  return transaction.categoryAllocations?.length
    ? transaction.categoryAllocations
        .map((item) => `${item.categoryName}: ${item.amount}`)
        .join("; ")
    : (transaction.category?.name ?? "");
}

function csvCell(value: string | number | boolean | null | undefined, numeric = false): string {
  let text = value == null ? "" : String(value);
  // Quoting alone does not prevent spreadsheet formulas in user-provided text.
  if (!numeric && /^[\s\uFEFF]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function reportCsv(report: Report): string {
  const header = [
    "id",
    "date",
    "description",
    "amount",
    "method",
    "categories",
    "from_type",
    "from_name",
    "to_type",
    "to_name",
    "kind",
    "sign",
    "installment_number",
    "installment_total",
    "term",
    "settled",
    "settled_at",
    "credit_group_id",
    "created_at",
    "updated_at",
  ];
  const rows = report.items.map((item) =>
    [
      item.id,
      item.date,
      item.description,
      item.amount,
      item.method,
      categories(item),
      item.from.type,
      item.from.name,
      item.to.type,
      item.to.name,
      item.kind,
      item.sign,
      item.installmentNumber,
      item.installmentTotal,
      item.term,
      item.settled,
      item.settledAt,
      item.creditGroupId,
      item.createdAt,
      item.updatedAt,
    ]
      .map((value, index) => csvCell(value, index === 3 || index === 11))
      .join(","),
  );
  // BOM preserves accented names when opened in common spreadsheet applications.
  return `\uFEFF${[header.map((value) => csvCell(value)).join(","), ...rows].join("\r\n")}\r\n`;
}

function markdownCell(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "&#124;")
    .replace(/([`*_[\]])/g, "\\$1")
    .replace(/\r\n|[\r\n]/g, "<br>");
}

export function reportMarkdown(report: Report, period: Period): string {
  const headers = [
    "Date",
    "Description",
    "Amount",
    "Method",
    "Categories",
    "From",
    "To",
    "Kind",
    "Installment",
    "Statement due",
    "Settled",
    "Settled on",
    "ID",
  ];
  const row = (cells: Array<string | number | null | undefined>) =>
    `| ${cells.map(markdownCell).join(" | ")} |`;
  const lines = [
    `# ${TEXT.title}`,
    "",
    `${TEXT.period}: ${period.from} – ${period.to}`,
    "",
    TEXT.basis,
    "",
    TEXT.scope,
    "",
    `- ${TEXT.transactions}: ${report.items.length}`,
    `- ${TEXT.totalIn}: ${report.summary.totalIn}`,
    `- ${TEXT.totalOut}: ${report.summary.totalOut}`,
    `- ${TEXT.net}: ${report.summary.net}`,
    "",
    TEXT.summary,
    "",
  ];
  if (!report.items.length) return [...lines, TEXT.empty, ""].join("\n");
  lines.push(row(headers), row(headers.map(() => "---")));
  for (const item of report.items) {
    lines.push(
      row([
        item.date,
        item.description,
        item.amount,
        item.method,
        categories(item),
        item.from.name ?? TEXT.external,
        item.to.name ?? TEXT.external,
        item.kind,
        item.installmentNumber == null ? "" : `${item.installmentNumber}/${item.installmentTotal}`,
        item.term,
        item.settled ? TEXT.yes : TEXT.no,
        item.settledAt,
        item.id,
      ]),
    );
  }
  return [...lines, ""].join("\n");
}

export function downloadTransactionReport(
  report: Report,
  period: Period,
  format: ReportFormat,
): void {
  const blob = new Blob(
    [format === REPORT_FORMAT.Csv ? reportCsv(report) : reportMarkdown(report, period)],
    {
      type: format === REPORT_FORMAT.Csv ? "text/csv;charset=utf-8" : "text/markdown;charset=utf-8",
    },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transactions-${period.from}-to-${period.to}.${format}`;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
