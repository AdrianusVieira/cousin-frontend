import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { PageHead } from "@/components/PageHead";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { formatMoney, formatMoneyDelta } from "@/lib/format";
import type { Money, Wallet } from "@/types/api";
import { useNavigate } from "react-router-dom";

import form from "@/styles/form.module.css";

import { DivergingBars } from "./DivergingBars";
import { PatrimonyChart } from "./PatrimonyChart";
import { WalletForm } from "./WalletForm";
import styles from "./Wallets.module.css";
import { useWallets } from "./useWallets";

type WalletRow = Wallet & { vsAverageDelta: Money };

const LABELS = {
  activeWallets: "Active Wallets",
  archived: "Archived",
  balance: "Balance",
  delta: "vs 3-mo Avg",
  loading: "Loading…",
  name: "Name",
  newWallet: "New wallet",
  noWallets: "No wallets yet.",
  status: "Status",
  title: "Wallets",
  totalPatrimony: "Total Patrimony",
};

const TEXT = {
  archived: "Archived",
};

const COLUMNS: Column<WalletRow>[] = [
  {
    header: LABELS.name,
    key: "name",
    render: (w) => (
      <span className={w.archived ? styles.dimmed : undefined}>{w.name}</span>
    ),
  },
  {
    header: LABELS.delta,
    key: "delta",
    render: (w) => {
      const num = Number(w.vsAverageDelta);

      return (
        <span
          className={styles.delta}
          data-sign={num > 0 ? "+" : num < 0 ? "-" : null}
        >
          {formatMoneyDelta(w.vsAverageDelta)}
        </span>
      );
    },
  },
  {
    header: LABELS.status,
    key: "status",
    render: (w) =>
      w.archived ? <Pill accent="outcome">{TEXT.archived}</Pill> : null,
  },
  {
    align: "right",
    header: LABELS.balance,
    key: "balance",
    render: (w) => (
      <span className={w.archived ? styles.dimmed : undefined}>
        {formatMoney(w.balance)}
      </span>
    ),
  },
];

export function Wallets() {
  const navigate = useNavigate();

  const {
    activeCountValue,
    archivedCountValue,
    error,
    formOpen,
    isLoading,
    isSubmitting,
    items,
    patrimonyNote,
    patrimonyValue,
    trend,

    closeForm,
    createError,
    createWallet,
    openForm,
  } = useWallets();

  return (
    <>
      <PageHead
        actions={
          <button className={form.btnPrimary} onClick={openForm} type="button">
            {LABELS.newWallet}
          </button>
        }
        title={LABELS.title}
      />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <div className={styles.statGrid}>
            <StatCard
              accent="net"
              label={LABELS.totalPatrimony}
              note={patrimonyNote}
              value={patrimonyValue}
            />
            <StatCard accent="revenue" label={LABELS.activeWallets} value={activeCountValue} />
            <StatCard accent="outcome" label={LABELS.archived} value={archivedCountValue} />
          </div>

          <div className={styles.chartRow}>
            <PatrimonyChart data={trend} />
            <DivergingBars items={items} />
          </div>

          <div className={styles.tableWrap}>
            <DataTable
              columns={COLUMNS}
              emptyMessage={LABELS.noWallets}
              keyExtractor={(w) => w.id}
              onRowClick={(w) => navigate(`/wallets/${w.id}`)}
              rows={items}
            />
          </div>
        </>
      )}

      {formOpen && (
        <WalletForm
          isSubmitting={isSubmitting}
          onClose={closeForm}
          onSubmit={createWallet}
          serverError={createError}
        />
      )}
    </>
  );
}
