import {
  TXN_FROM_TYPE,
  TXN_KIND,
  TXN_TO_TYPE,
  type TxnFromType,
  type TxnKind,
  type TxnToType,
} from "./transactions";

/**
 * The authoritative `fromType → toType` matrix (glossary.md). The FE owns this: it filters
 * the "To" type options once "From" is picked, and labels the resulting kind. The BE
 * re-validates on submit (invalid pair → 422), but this is the primary guard.
 *
 * Values come from the centralized enums in `./transactions` — never bare string literals,
 * so a renamed kind/type is a compile error here rather than a silent mismatch.
 *
 * Note `manualAdjustment` (wallet → same wallet) vs `internalTransfer` (wallet → different
 * wallet) share the wallet→wallet pair; they're disambiguated by id equality, not by type.
 */

export interface TxnCombination {
  fromType: TxnFromType;
  toType: TxnToType;
  kind: TxnKind;
}

export const TXN_COMBINATIONS: readonly TxnCombination[] = [
  { fromType: TXN_FROM_TYPE.External, toType: TXN_TO_TYPE.Wallet, kind: TXN_KIND.MoneyIn },
  { fromType: TXN_FROM_TYPE.Revenue, toType: TXN_TO_TYPE.Wallet, kind: TXN_KIND.RevenueRealized },
  { fromType: TXN_FROM_TYPE.Wallet, toType: TXN_TO_TYPE.Bill, kind: TXN_KIND.BillPaid },
  { fromType: TXN_FROM_TYPE.Wallet, toType: TXN_TO_TYPE.External, kind: TXN_KIND.MoneyOut },
  // wallet → wallet resolves to internalTransfer (different) or manualAdjustment (same id)
  { fromType: TXN_FROM_TYPE.Wallet, toType: TXN_TO_TYPE.Wallet, kind: TXN_KIND.InternalTransfer },
];

/** Valid "To" types for a chosen "From" type — drives dynamic filtering in the modal. */
export function toTypesFor(fromType: TxnFromType): TxnToType[] {
  return TXN_COMBINATIONS.filter((c) => c.fromType === fromType).map((c) => c.toType);
}

/** Resolve the analytical kind for a from/to pair (ids disambiguate wallet→wallet). */
export function resolveKind(
  fromType: TxnFromType,
  toType: TxnToType,
  fromId?: string | null,
  toId?: string | null,
): TxnKind | null {
  if (fromType === TXN_FROM_TYPE.Wallet && toType === TXN_TO_TYPE.Wallet) {
    return fromId && fromId === toId ? TXN_KIND.ManualAdjustment : TXN_KIND.InternalTransfer;
  }

  return TXN_COMBINATIONS.find((c) => c.fromType === fromType && c.toType === toType)?.kind ?? null;
}
