/**
 * Types mirror `api-contracts.md`. Money is always a decimal string — never a number.
 * Computed fields (added by the BE at read time) are noted; never recompute them on the FE.
 *
 * Transaction enums (method, from/to/endpoint type, kind) are defined once in
 * `@/constants/transactions` and re-exported here so `@/types/api` stays the one import for
 * API shapes. The const objects there are the source of truth; these are the derived types.
 */

import type {
  TxnEndpointType,
  TxnFromType,
  TxnKind,
  TxnMethod,
  TxnToType,
} from "@/constants/transactions";

export type { TxnEndpointType, TxnFromType, TxnKind, TxnMethod, TxnToType };

export type UUID = string;
export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string; // RFC 3339
export type Money = string; // decimal string, e.g. '1234.56'

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>; // present on 422 — field -> message
  };
}

/* ------------------------------------------------------------------ entities */

export interface Wallet {
  id: UUID;
  name: string;
  description: string | null;
  balance: Money;
  archived: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Source {
  id: UUID;
  name: string;
  description: string | null;
  archived: boolean;
  hasOpenItems: boolean; // computed
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Category {
  id: UUID;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type IntervalUnit = "day" | "week" | "month" | "year";

export interface Recurrence {
  id: UUID;
  isVariable: boolean;
  intervalUnit: IntervalUnit;
  intervalValue: number;
  recurrentDay: number; // 1–31, intended day (unclamped)
  recurrentMonth: number | null; // required when intervalUnit = 'year'
  estimatedValue: Money | null;
  active: boolean; // computed
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Bill {
  id: UUID;
  name: string;
  description: string | null;
  value: Money;
  term: ISODate;
  paid: boolean;
  sourceId: UUID;
  recurrenceId: UUID | null;
  hasLinkedTransaction: boolean; // computed
  flagged: boolean; // computed
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Revenue {
  id: UUID;
  name: string;
  description: string | null;
  value: Money;
  term: ISODate;
  received: boolean;
  sourceId: UUID;
  recurrenceId: UUID | null;
  hasLinkedTransaction: boolean; // computed
  flagged: boolean; // computed
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface TxnEndpoint {
  type: TxnEndpointType;
  id: UUID | null;
  name: string | null; // null when external
}

export interface Transaction {
  id: UUID;
  amount: Money;
  date: ISODate;
  description: string | null;
  method: TxnMethod;
  category: { id: UUID; name: string } | null;
  from: TxnEndpoint;
  to: TxnEndpoint;
  installmentNumber: number | null;
  installmentTotal: number | null;
  creditGroupId: UUID | null;
  settled: boolean;
  term: ISODate | null;
  kind: TxnKind; // computed
  sign: "+" | "-" | null; // computed; null for transfers & adjustments
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/* ---------------------------------------------------------------- responses */

export interface DashboardResponse {
  revenue: Money;
  outcome: Money;
  net: Money;
  savingsRate: number;
  savingsRateDelta: number | null;
  netDelta: Money | null;
  cashFlow: Array<{ date: ISODate; in: Money; out: Money }>;
  pendingCredit: {
    total: Money;
    perWallet: Array<{ walletId: UUID; walletName: string; total: Money }>;
  };
}

export interface TransactionListResponse {
  summary: { totalIn: Money; totalOut: Money; net: Money };
  items: Transaction[];
  nextCursor: string | null;
}

export interface CreditResponse {
  summary: { pendingCredit: Money; openStatements: number; settledInPeriod: Money };
  groups: Array<{
    walletId: UUID;
    walletName: string;
    term: ISODate;
    total: Money;
    settled: boolean;
    transactions: Transaction[];
  }>;
}

export interface BillListResponse {
  summary: { totalBilled: Money; totalPaid: Money; totalUnpaid: Money; overdue: Money };
  items: Bill[];
}

export interface BillDetailResponse {
  bill: Bill;
  instances: Bill[];
  linkedTransaction: Transaction | null;
}

export interface RevenueListResponse {
  summary: { totalExpected: Money; totalReceived: Money; totalPending: Money; overdue: Money };
  items: Revenue[];
}

export interface RevenueDetailResponse {
  revenue: Revenue;
  instances: Revenue[];
  linkedTransaction: Transaction | null;
}

export type RecurrenceListItem = Recurrence & {
  name: string;
  type: "bill" | "revenue";
  nextInstance: ISODate | null;
};

export interface RecurrenceListResponse {
  summary: { recurringOutflow: Money; activeCount: number; inactiveCount: number };
  items: RecurrenceListItem[];
}

export interface RecurrenceDetailResponse {
  recurrence: Recurrence;
  name: string;
  type: "bill" | "revenue";
  instances: Array<Bill | Revenue>;
  variance: Array<{ date: ISODate; estimated: Money; actual: Money | null }>;
}

export interface WalletListResponse {
  summary: {
    totalPatrimony: Money;
    activeCount: number;
    archivedCount: number;
    patrimonyVs3moAvg: { delta: Money; pct: number };
  };
  trend: Array<{ date: ISODate; total: Money }>;
  items: Array<Wallet & { vsAverageDelta: Money }>;
}

export interface WalletDetailResponse {
  wallet: Wallet;
  summary: { currentBalance: Money; threeMonthAverage: Money };
  balanceSeries: Array<{ date: ISODate; balance: Money }>;
}

export interface SourceListResponse {
  items: Array<Source & { income: Money; outcome: Money }>;
}

export interface SourceDetailResponse {
  source: Source;
  summary: { totalIncome: Money; totalOutcome: Money };
  bills: Bill[];
  revenues: Revenue[];
}

export interface CategoryListResponse {
  items: Array<Category & { income: Money; outcome: Money }>;
}

export interface CategoryDetailResponse {
  category: Category;
  summary: { totalIncome: Money; totalOutcome: Money };
  breakdown: Array<{ bucket: ISODate; income: Money; outcome: Money }>;
}

/* ----------------------------------------------------------- request bodies */

export interface RecurrenceInput {
  isVariable: boolean;
  intervalUnit: IntervalUnit;
  intervalValue: number;
  recurrentDay: number;
  recurrentMonth?: number; // required when intervalUnit = 'year'
}

export interface CreateBill {
  name: string;
  value: Money;
  term: ISODate;
  sourceId: UUID;
  description?: string;
  recurrence?: RecurrenceInput;
}

export type CreateRevenue = CreateBill;

export interface CreateDebitTransaction {
  method: "debit";
  amount: Money;
  date: ISODate;
  description?: string;
  categoryId?: UUID;
  fromType: TxnFromType;
  fromId?: UUID; // omit iff fromType = 'external'
  toType: TxnToType;
  toId?: UUID; // omit iff toType = 'external'
}

export interface CreateCreditTransaction {
  method: "credit";
  amount: Money;
  date: ISODate;
  description?: string;
  categoryId?: UUID;
  fromId: UUID; // wallet
  toType: TxnToType;
  toId?: UUID;
  term?: ISODate; // defaults to the 15th of current month
  installmentTotal?: number; // > 1 expands into a linked group
}

export type CreateTransaction = CreateDebitTransaction | CreateCreditTransaction;

export interface SettleRequest {
  transactionIds: UUID[];
}
