import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Pill } from "@/components/Pill";
import { formatMoney } from "@/lib/format";
import type { Money, Source } from "@/types/api";
import { useNavigate } from "react-router-dom";

import form from "@/styles/form.module.css";

import { SourceForm } from "./SourceForm";
import styles from "./Sources.module.css";
import { useSources } from "./useSources";

type SourceRow = Source & { income: Money; outcome: Money };

const LABELS = {
  income: "Income",
  loading: "Loading…",
  name: "Name",
  newSource: "New source",
  noSources: "No sources yet.",
  outcome: "Outcome",
  status: "Status",
  title: "Sources",
};

const TEXT = {
  archived: "Archived",
  openItems: "Open items",
};

const COLUMNS: Column<SourceRow>[] = [
  {
    header: LABELS.name,
    key: "name",
    render: (s) => s.name,
  },
  {
    header: LABELS.status,
    key: "status",
    render: (s) => {
      if (s.archived) return <Pill accent="outcome">{TEXT.archived}</Pill>;
      if (s.hasOpenItems) return <Pill accent="credit">{TEXT.openItems}</Pill>;

      return null;
    },
  },
  {
    align: "right",
    header: LABELS.income,
    key: "income",
    render: (s) => formatMoney(s.income),
  },
  {
    align: "right",
    header: LABELS.outcome,
    key: "outcome",
    render: (s) => formatMoney(s.outcome),
  },
];

export function Sources() {
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
    createError,
    createSource,
    openForm,
    setPeriod,
  } = useSources();

  return (
    <>
      <PageHead
        actions={
          <>
            <PeriodSelector onChange={setPeriod} value={period} />
            <button className={form.btnPrimary} onClick={openForm} type="button">
              {LABELS.newSource}
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
            emptyMessage={LABELS.noSources}
            keyExtractor={(s) => s.id}
            onRowClick={(s) => navigate(`/sources/${s.id}`)}
            rows={items}
          />
        </div>
      )}

      {formOpen && (
        <SourceForm
          isSubmitting={isSubmitting}
          onClose={closeForm}
          onSubmit={createSource}
          serverError={createError}
        />
      )}
    </>
  );
}
