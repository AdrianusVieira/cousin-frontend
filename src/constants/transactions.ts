/**
 * Centralized transaction enums. `as const` objects are the single definition; the union
 * types are *derived* from them, so the values and types can never drift apart. Everything
 * (API types in `types/api.ts`, the from→to matrix, forms) references these instead of
 * re-declaring string-literal unions. TS `enum` is intentionally avoided — `erasableSyntaxOnly`
 * forbids it, and `as const` keeps the runtime values as plain strings.
 */

export const TXN_METHOD = {
  Credit: "credit",
  Debit: "debit",
} as const;
export type TxnMethod = (typeof TXN_METHOD)[keyof typeof TXN_METHOD];

/** Valid `from` types. Asymmetric with `to`: a Revenue can only be a source of money. */
export const TXN_FROM_TYPE = {
  External: "external",
  Revenue: "revenue",
  Wallet: "wallet",
} as const;
export type TxnFromType = (typeof TXN_FROM_TYPE)[keyof typeof TXN_FROM_TYPE];

/** Valid `to` types. Asymmetric with `from`: a Bill can only be a destination of money. */
export const TXN_TO_TYPE = {
  Bill: "bill",
  External: "external",
  Wallet: "wallet",
} as const;
export type TxnToType = (typeof TXN_TO_TYPE)[keyof typeof TXN_TO_TYPE];

/** Endpoint type as returned on `Transaction.from`/`to` — the union of from and to types. */
export const TXN_ENDPOINT_TYPE = {
  Bill: "bill",
  External: "external",
  Revenue: "revenue",
  Wallet: "wallet",
} as const;
export type TxnEndpointType = (typeof TXN_ENDPOINT_TYPE)[keyof typeof TXN_ENDPOINT_TYPE];

/** Analytical meaning, computed by the BE from the from/to combination (glossary.md). */
export const TXN_KIND = {
  BillPaid: "billPaid",
  InternalTransfer: "internalTransfer",
  ManualAdjustment: "manualAdjustment",
  MoneyIn: "moneyIn",
  MoneyOut: "moneyOut",
  RevenueRealized: "revenueRealized",
} as const;
export type TxnKind = (typeof TXN_KIND)[keyof typeof TXN_KIND];
