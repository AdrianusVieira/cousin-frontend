import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

vi.mock("@/lib/api/client", () => ({
  api: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import { api } from "@/lib/api/client";
import { PeriodContext } from "@/providers/periodContext";
import { Transactions } from "../Transactions";

const category = { id: "category-1", name: "Food", archived: false };
const transaction = {
  id: "txn-1",
  amount: "12.34",
  date: "2026-10-22",
  description: "Lunch",
  method: "debit",
  category,
  categoryAllocations: [{ categoryId: category.id, categoryName: category.name, amount: "12.34" }],
  from: { name: "Wallet" },
  to: { name: null },
  sign: "-",
};
function makeSut(entry = "/transactions", allocations = transaction.categoryAllocations) {
  const record = {
    ...transaction,
    categoryAllocations: allocations,
    category: allocations.length === 1 ? category : null,
  };
  vi.mocked(api.get).mockImplementation(async (path) => {
    if (path.startsWith("/transactions/")) return record;
    if (path === "/transactions")
      return {
        items: [record],
        summary: { totalIn: "0.00", totalOut: "12.34", net: "-12.34" },
        nextCursor: null,
      };
    if (path === "/categories")
      return { items: [category, { id: "category-2", name: "Home", archived: false }] };
    if (path === "/wallets")
      return { items: [{ id: "wallet-1", name: "Wallet", archived: false }] };
    return {};
  });
  vi.mocked(api.patch).mockResolvedValue(record);
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[entry]}>
        <PeriodContext
          value={{ period: { from: "2026-10-01", to: "2026-10-31" }, setPeriod: vi.fn() }}
        >
          <Transactions />
        </PeriodContext>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}
beforeEach(() => vi.resetAllMocks());

describe("transaction cleanup", () => {
  it("opens an exact transaction from a dashboard link and dismisses it", async () => {
    const user = makeSut("/transactions?transaction=txn-1");
    const dialog = await screen.findByRole("dialog", { name: "Edit Transaction" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("sends search, wallet and category filters to the server together", async () => {
    const user = makeSut();
    await screen.findByRole("cell", { name: "Lunch" });
    await user.type(screen.getByRole("searchbox", { name: "Search descriptions" }), "Lunch");
    await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "uncategorized");
    await user.selectOptions(screen.getByRole("combobox", { name: "Wallet" }), "wallet-1");
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        "/transactions",
        expect.objectContaining({
          query: expect.objectContaining({
            search: "Lunch",
            category: "uncategorized",
            wallet: "wallet-1",
          }),
        }),
      ),
    );
  });
  it("clears bulk selection when filters change", async () => {
    const user = makeSut();
    await screen.findByRole("cell", { name: "Lunch" });
    await user.click(screen.getByRole("checkbox", { name: "Select transaction: Lunch" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "uncategorized");
    expect(screen.getByText("0 selected")).toBeInTheDocument();
  });
  it("changes a category without sending unrelated transaction fields", async () => {
    const user = makeSut();
    await screen.findByRole("cell", { name: "Lunch" });
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Transaction" });
    await user.selectOptions(
      await within(dialog).findByRole("combobox", { name: "Category" }),
      "category-2",
    );
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/transactions/txn-1", {
        categoryAllocations: [{ categoryId: "category-2", amount: "12.34" }],
      }),
    );
  });
  it("bulk assigns only the selected IDs", async () => {
    const user = makeSut();
    await screen.findByRole("cell", { name: "Lunch" });
    await user.click(screen.getByRole("checkbox", { name: "Select transaction: Lunch" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Assign category" }),
      "category-2",
    );
    await user.click(screen.getByRole("button", { name: "Apply category" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/transactions/categories", {
        categoryId: "category-2",
        transactionIds: ["txn-1"],
      }),
    );
  });
  it("saves unequal category amounts without changing the transaction total", async () => {
    const user = makeSut();
    await screen.findByRole("cell", { name: "Lunch" });
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = within(screen.getByRole("dialog", { name: "Edit Transaction" }));
    await dialog.findByRole("option", { name: "Home" });
    await user.click(dialog.getByRole("button", { name: "Add category" }));
    await user.selectOptions(dialog.getByRole("combobox", { name: "Category 2" }), "category-2");
    await user.clear(dialog.getByRole("textbox", { name: "Category amount" }));
    await user.type(dialog.getByRole("textbox", { name: "Category amount" }), "10.00");
    await user.type(dialog.getByRole("textbox", { name: "Category amount 2" }), "2.34");
    await user.click(dialog.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/transactions/txn-1", {
        categoryAllocations: [
          { categoryId: "category-1", amount: "10.00" },
          { categoryId: "category-2", amount: "2.34" },
        ],
      }),
    );
  });
  it("keeps custom split amounts when the total changes and requires the user to rebalance them", async () => {
    const user = makeSut("/transactions", [
      { categoryId: "category-1", categoryName: "Food", amount: "10.00" },
      { categoryId: "category-2", categoryName: "Home", amount: "2.34" },
    ]);
    await screen.findByRole("cell", { name: "Food: 10.00 · Home: 2.34" });
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = within(screen.getByRole("dialog", { name: "Edit Transaction" }));
    await user.clear(dialog.getByRole("textbox", { name: "Amount" }));
    await user.type(dialog.getByRole("textbox", { name: "Amount" }), "15.00");
    expect(dialog.getByRole("textbox", { name: "Category amount" })).toHaveValue("10.00");
    expect(dialog.getByRole("textbox", { name: "Category amount 2" })).toHaveValue("2.34");
    expect(dialog.getByText("Remaining: 2.66")).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "Save" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent("Category amounts must add up");
    expect(api.patch).not.toHaveBeenCalled();
    await user.clear(dialog.getByRole("textbox", { name: "Category amount 2" }));
    await user.type(dialog.getByRole("textbox", { name: "Category amount 2" }), "5.00");
    await user.click(dialog.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/transactions/txn-1", {
        amount: "15.00",
        categoryAllocations: [
          { categoryId: "category-1", amount: "10.00" },
          { categoryId: "category-2", amount: "5.00" },
        ],
      }),
    );
  });

  it("shows the selected category amount in filtered rows", async () => {
    makeSut("/transactions?category=category-2", [
      { categoryId: "category-1", categoryName: "Food", amount: "10.00" },
      { categoryId: "category-2", categoryName: "Home", amount: "2.34" },
    ]);
    expect(await screen.findByRole("cell", { name: "−2.34" })).toBeInTheDocument();
  });
});
