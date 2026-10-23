import { formatMoney } from "@/lib/format";
import type { CategoryAllocationInput, Transaction } from "@/types/api";

const TEXT = {
  duplicate: "Choose each category only once",
  invalidAmount: "Enter an amount greater than zero with up to two decimal places",
  required: "Required",
  total: "Category amounts must add up to the transaction amount",
  uncategorized: "—",
};

export const AMOUNT_INPUT_PATTERN = /^\d*(\.\d{0,2})?$/;
export const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function moneyCents(value: string): number {
  if (!AMOUNT_PATTERN.test(value)) return NaN;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function validateCategoryAllocations(
  allocations: CategoryAllocationInput[],
  total: string,
  required = true,
): string | true {
  if (!allocations.length) return required ? TEXT.required : true;
  if (allocations.some((item) => !item.categoryId)) return TEXT.required;
  if (new Set(allocations.map((item) => item.categoryId)).size !== allocations.length)
    return TEXT.duplicate;
  if (
    allocations.some(
      (item) => !Number.isSafeInteger(moneyCents(item.amount)) || moneyCents(item.amount) <= 0,
    )
  )
    return TEXT.invalidAmount;
  return allocations.reduce((sum, item) => sum + moneyCents(item.amount), 0) === moneyCents(total)
    ? true
    : TEXT.total;
}

export function transactionAllocations(transaction: Transaction): CategoryAllocationInput[] {
  return (
    transaction.categoryAllocations?.map(({ categoryId, amount }) => ({ categoryId, amount })) ??
    (transaction.category
      ? [{ categoryId: transaction.category.id, amount: transaction.amount }]
      : [])
  );
}

export function formatTransactionCategories(transaction: Transaction): string {
  if (!transaction.categoryAllocations?.length)
    return transaction.category?.name ?? TEXT.uncategorized;
  return transaction.categoryAllocations
    .map((item) =>
      transaction.categoryAllocations.length > 1
        ? `${item.categoryName}: ${formatMoney(item.amount)}`
        : item.categoryName,
    )
    .join(" · ");
}

export function categoryAmount(transaction: Transaction, category?: string): string {
  return (
    transaction.categoryAllocations?.find((item) => item.categoryId === category)?.amount ??
    transaction.amount
  );
}
