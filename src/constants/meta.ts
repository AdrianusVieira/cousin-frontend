/**
 * Entities that carry a "last updated" stamp. Mirrors the keys of
 * `GET /api/meta/last-updated`; the union type is derived so the two can't drift.
 */
export const META_ENTITY = {
  Bills: "bills",
  Categories: "categories",
  Recurrences: "recurrences",
  Revenues: "revenues",
  Sources: "sources",
  Transactions: "transactions",
  Wallets: "wallets",
} as const;
export type MetaEntity = (typeof META_ENTITY)[keyof typeof META_ENTITY];
