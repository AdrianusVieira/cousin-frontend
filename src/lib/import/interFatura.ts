import Papa from "papaparse";

export type ParsedFaturaRowStatus = "candidate" | "negativeSkip" | "parseError";

export interface ParsedFaturaRow {
  amount: string | null; // canonical decimal string, may be negative; null if parseError
  date: string | null; // ISO date; null if parseError
  description: string | null;
  errorMessage?: string;
  index: number; // position in the parsed file — stable React/wire key
  installmentNumber?: number;
  installmentTotal?: number;
  raw: Record<string, string>;
  status: ParsedFaturaRowStatus;
}

const TEXT = {
  invalidDate: "Could not parse Data as dd/mm/yyyy",
  invalidTipo: "Unrecognized Tipo value (expected 'Compra à vista' or 'Parcela N/M')",
  invalidValor: "Could not parse Valor as a Brazilian money amount",
};

/** Wraps Papa.parse's callback API in a Promise; strips a UTF-8 BOM from the header row. */
export function readInterFaturaCsv(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      complete: (results) => resolve(results.data),
      encoding: "UTF-8",
      error: (err: Error) => reject(err),
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
    });
  });
}

function parseBRDate(raw: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return `${yyyy}-${mm}-${dd}`;
}

function parseBRMoney(raw: string): string | null {
  const trimmed = raw.trim();
  const negative = trimmed.startsWith("-");
  const cleaned = trimmed
    .replace(/^-/, "")
    .replace(/R\$/gi, "")
    .replace(/[\u00A0\s]/g, "") // NBSP after "R$" plus any ordinary spaces
    .replace(/\./g, "") // thousands separator
    .replace(",", "."); // decimal separator

  if (!/^\d+\.\d{2}$/.test(cleaned)) return null;

  return negative ? `-${cleaned}` : cleaned;
}

function parseTipo(raw: string): { installmentNumber?: number; installmentTotal?: number } | null {
  const trimmed = raw.trim();
  if (/^compra\s+à\s+vista$/i.test(trimmed)) return {};

  const match = /^Parcela\s+(\d+)\/(\d+)$/i.exec(trimmed);
  if (!match) return null;

  return { installmentNumber: Number(match[1]), installmentTotal: Number(match[2]) };
}

function normalizeDescription(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function parseInterFaturaRows(rawRows: Record<string, string>[]): ParsedFaturaRow[] {
  return rawRows.map((raw, index) => {
    const date = parseBRDate(raw["Data"] ?? "");
    const amount = parseBRMoney(raw["Valor"] ?? "");
    const installment = parseTipo(raw["Tipo"] ?? "");

    if (!date) {
      return {
        amount,
        date,
        description: null,
        errorMessage: TEXT.invalidDate,
        index,
        raw,
        status: "parseError",
      };
    }
    if (!amount) {
      return {
        amount,
        date,
        description: null,
        errorMessage: TEXT.invalidValor,
        index,
        raw,
        status: "parseError",
      };
    }
    if (!installment) {
      return {
        amount,
        date,
        description: null,
        errorMessage: TEXT.invalidTipo,
        index,
        raw,
        status: "parseError",
      };
    }

    const description = normalizeDescription(raw["Lançamento"] ?? "");
    const status: ParsedFaturaRowStatus = Number(amount) < 0 ? "negativeSkip" : "candidate";

    return {
      amount,
      date,
      description,
      index,
      installmentNumber: installment.installmentNumber,
      installmentTotal: installment.installmentTotal,
      raw,
      status,
    };
  });
}
