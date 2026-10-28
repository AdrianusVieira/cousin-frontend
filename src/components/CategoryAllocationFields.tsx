import { AMOUNT_INPUT_PATTERN, moneyCents } from "@/lib/categoryAllocations";
import { formatMoney } from "@/lib/format";
import type { Category, CategoryAllocationInput } from "@/types/api";
import { FormField } from "./FormField";
import form from "@/styles/form.module.css";
import styles from "./CategoryAllocationFields.module.css";

const LABELS = {
  add: "Add category",
  amount: "Category amount",
  category: "Category",
  choose: "Choose a category",
  remove: "Remove category",
};
const TEXT = {
  empty: "No categories assigned.",
  help: "Enter the amount for each category. The amounts must add up to the transaction total.",
  over: "Over allocated",
  remaining: "Remaining",
};

export function CategoryAllocationFields({
  categories,
  compactSingleCategory = false,
  error,
  onChange,
  total,
  value,
}: {
  categories: Pick<Category, "id" | "name" | "archived">[];
  compactSingleCategory?: boolean;
  error?: string;
  onChange: (value: CategoryAllocationInput[]) => void;
  total: string;
  value: CategoryAllocationInput[];
}) {
  const showSplitFields = !compactSingleCategory || value.length > 1;
  const update = (index: number, patch: Partial<CategoryAllocationInput>) =>
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => {
    const remaining = value.filter((_, i) => i !== index);
    onChange(
      compactSingleCategory && remaining.length === 1
        ? [{ ...remaining[0], amount: total }]
        : remaining,
    );
  };
  const remaining =
    moneyCents(total) - value.reduce((sum, item) => sum + (moneyCents(item.amount) || 0), 0);
  return (
    <div className={styles.fields}>
      {showSplitFields && <p className={styles.hint}>{TEXT.help}</p>}
      {!value.length && <p className={styles.hint}>{TEXT.empty}</p>}
      {value.map((item, index) => {
        const suffix = index ? ` ${index + 1}` : "";
        return (
          <div className={showSplitFields ? styles.row : styles.singleRow} key={index}>
            <FormField label={`${LABELS.category}${suffix}`} required>
              <select
                aria-label={`${LABELS.category}${suffix}`}
                aria-required="true"
                className={form.select}
                onChange={(event) => update(index, { categoryId: event.target.value })}
                value={item.categoryId}
              >
                <option value="">{LABELS.choose}</option>
                {categories
                  .filter(
                    (cat) =>
                      (!cat.archived || cat.id === item.categoryId) &&
                      (cat.id === item.categoryId ||
                        !value.some((entry) => entry.categoryId === cat.id)),
                  )
                  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </FormField>
            {showSplitFields && (
              <>
                <FormField label={`${LABELS.amount}${suffix}`} required>
                  <input
                    aria-label={`${LABELS.amount}${suffix}`}
                    aria-required="true"
                    className={form.input}
                    inputMode="decimal"
                    onChange={(event) => {
                      if (AMOUNT_INPUT_PATTERN.test(event.target.value))
                        update(index, { amount: event.target.value });
                    }}
                    placeholder="0.00"
                    type="text"
                    value={item.amount}
                  />
                </FormField>
                <button
                  aria-label={`${LABELS.remove}${suffix}`}
                  className={form.btnSecondary}
                  onClick={() => remove(index)}
                  type="button"
                >
                  {LABELS.remove}
                </button>
              </>
            )}
          </div>
        );
      })}
      {showSplitFields && Number.isFinite(remaining) && (
        <p aria-live="polite" className={styles.hint}>
          {remaining < 0 ? TEXT.over : TEXT.remaining}:{" "}
          {formatMoney((Math.abs(remaining) / 100).toFixed(2))}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button
        className={form.btnSecondary}
        disabled={
          value.length >= 100 ||
          !categories.some(
            (cat) => !cat.archived && !value.some((entry) => entry.categoryId === cat.id),
          )
        }
        onClick={() => onChange([...value, { categoryId: "", amount: value.length ? "" : total }])}
        type="button"
      >
        {LABELS.add}
      </button>
    </div>
  );
}
