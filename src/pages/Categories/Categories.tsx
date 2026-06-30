import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Pill } from "@/components/Pill";
import { formatMoney } from "@/lib/format";
import type { Category, Money } from "@/types/api";
import { useNavigate } from "react-router-dom";

import form from "@/styles/form.module.css";

import { CategoryForm } from "./CategoryForm";
import styles from "./Categories.module.css";
import { useCategories } from "./useCategories";

type CategoryRow = Category & { income: Money; outcome: Money };

const LABELS = {
  income: "Income",
  loading: "Loading…",
  name: "Name",
  newCategory: "New category",
  noCategories: "No categories yet.",
  outcome: "Outcome",
  status: "Status",
  title: "Categories",
};

const TEXT = {
  archived: "Archived",
};

const COLUMNS: Column<CategoryRow>[] = [
  {
    header: LABELS.name,
    key: "name",
    render: (c) => c.name,
  },
  {
    header: LABELS.status,
    key: "status",
    render: (c) =>
      c.archived ? <Pill accent="outcome">{TEXT.archived}</Pill> : null,
  },
  {
    align: "right",
    header: LABELS.income,
    key: "income",
    render: (c) => formatMoney(c.income),
  },
  {
    align: "right",
    header: LABELS.outcome,
    key: "outcome",
    render: (c) => formatMoney(c.outcome),
  },
];

export function Categories() {
  const navigate = useNavigate();

  const {
    error,
    formOpen,
    isLoading,
    isSubmitting,
    items,
    period,
    periodLabel,

    closeForm,
    createCategory,
    createError,
    openForm,
    setPeriod,
  } = useCategories();

  return (
    <>
      <PageHead
        actions={
          <>
            <PeriodSelector onChange={setPeriod} value={period} />
            <button className={form.btnPrimary} onClick={openForm} type="button">
              {LABELS.newCategory}
            </button>
          </>
        }
        periodLabel={periodLabel}
        title={LABELS.title}
      />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <div className={styles.tableWrap}>
          <DataTable
            columns={COLUMNS}
            emptyMessage={LABELS.noCategories}
            keyExtractor={(c) => c.id}
            onRowClick={(c) => navigate(`/categories/${c.id}`)}
            rows={items}
          />
        </div>
      )}

      {formOpen && (
        <CategoryForm
          isSubmitting={isSubmitting}
          onClose={closeForm}
          onSubmit={createCategory}
          serverError={createError}
        />
      )}
    </>
  );
}
