import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TransactionForm } from "@/pages/Transactions/TransactionForm";
import type { Wallet } from "@/types/api";

const wallet: Wallet = {
  archived: false,
  balance: "100.00",
  createdAt: "2026-10-01T00:00:00Z",
  creditEnabled: true,
  description: null,
  id: "wallet-1",
  name: "Test wallet",
  updatedAt: "2026-10-01T00:00:00Z",
};

function makeSut(defaultMethod = "debit") {
  const onSubmit = vi.fn();
  render(
    <TransactionForm
      bills={[]}
      categories={[
        {
          id: "category-1",
          name: "Food",
          archived: false,
          description: null,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "category-2",
          name: "Household",
          archived: false,
          description: null,
          createdAt: "",
          updatedAt: "",
        },
      ]}
      defaultMethod={defaultMethod}
      isSubmitting={false}
      onClose={vi.fn()}
      onSubmit={onSubmit}
      revenues={[]}
      wallets={[wallet]}
    />,
  );

  return { onSubmit, user: userEvent.setup() };
}

function select(label: string): HTMLSelectElement {
  return screen.getByText(label, { selector: "label" }).parentElement!.querySelector("select")!;
}

describe("TransactionForm", () => {
  it("should show only a category selector and add button until another category is added", async () => {
    const { user } = makeSut();
    expect(screen.getByRole("combobox", { name: "Category" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Category amount" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove category" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Enter the amount for each category/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Remaining:/)).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Amount" }), "100");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(screen.getByRole("textbox", { name: "Category amount" })).toHaveValue("100");
    expect(screen.getByRole("textbox", { name: "Category amount 2" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Remove category" })).toBeInTheDocument();
    expect(screen.getByText(/Enter the amount for each category/)).toBeInTheDocument();
    expect(screen.getByText("Remaining: 0.00")).toBeInTheDocument();
  });

  it.each(["debit", "credit"])("should require a category for %s creation", async (method) => {
    const { onSubmit, user } = makeSut(method);
    await user.type(screen.getByRole("textbox", { name: "Amount" }), "12.34");
    await user.type(screen.getByRole("textbox", { name: "Description" }), "Lunch");
    await user.click(screen.getByRole("button", { name: "Create transaction" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it("should ignore letters and pasted non-decimal amounts", async () => {
    const { user } = makeSut();
    const amount = screen.getByRole("textbox", { name: "Amount" });
    await user.type(amount, "abc12.34");
    fireEvent.change(amount, { target: { value: "1e3" } });
    fireEvent.change(amount, { target: { value: "12.345" } });

    expect(amount).toHaveValue("12.34");
  });

  it.each(["", "0", "0.00", ".", "12."])(
    "should reject an invalid amount (%j) before submission",
    async (value) => {
      const { user } = makeSut();
      fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), {
        target: { value },
      });
      await user.type(screen.getByRole("textbox", { name: "Description" }), "Lunch");
      await user.click(screen.getByRole("button", { name: "Create transaction" }));

      expect(
        await within(screen.getByRole("textbox", { name: "Amount" }).parentElement!).findByText(
          value ? "Enter an amount greater than zero with up to two decimal places" : "Required",
        ),
      ).toBeInTheDocument();
    },
  );

  it.each(["debit", "credit"])(
    "should require a nonblank description for %s transactions",
    async (method) => {
      const { user } = makeSut(method);
      await user.type(screen.getByRole("textbox", { name: "Amount" }), "12.34");
      await user.type(screen.getByRole("textbox", { name: "Description" }), "   ");
      await user.click(screen.getByRole("button", { name: "Create transaction" }));

      expect(
        await within(
          screen.getByRole("textbox", { name: "Description" }).parentElement!,
        ).findByText("Required"),
      ).toBeInTheDocument();
    },
  );

  it.each(["debit", "credit"])(
    "should submit a valid %s transaction with its decimal string and description",
    async (method) => {
      const { onSubmit, user } = makeSut(method);
      await user.type(screen.getByRole("textbox", { name: "Amount" }), "12.34");
      await user.type(screen.getByRole("textbox", { name: "Description" }), " Lunch ");
      if (method === "debit") {
        await user.selectOptions(select("From type"), "wallet");
      }
      await user.selectOptions(select("From"), wallet.id);
      await user.selectOptions(select("To type"), "external");
      await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "category-1");
      await user.click(screen.getByRole("button", { name: "Create transaction" }));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryAllocations: [{ categoryId: "category-1", amount: "12.34" }],
            amount: "12.34",
            description: "Lunch",
            fromId: wallet.id,
            method,
            toType: "external",
          }),
        ),
      );
    },
  );
  it.each(["debit", "credit"])(
    "should submit user-entered unequal category amounts for %s",
    async (method) => {
      const { onSubmit, user } = makeSut(method);
      await user.type(screen.getByRole("textbox", { name: "Amount" }), "100.01");
      await user.type(screen.getByRole("textbox", { name: "Description" }), "Supermarket");
      if (method === "debit") await user.selectOptions(select("From type"), "wallet");
      await user.selectOptions(select("From"), wallet.id);
      await user.selectOptions(select("To type"), "external");
      await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "category-1");
      await user.click(screen.getByRole("button", { name: "Add category" }));
      expect(screen.getByRole("textbox", { name: "Category amount 2" })).toHaveValue("");
      await user.selectOptions(screen.getByRole("combobox", { name: "Category 2" }), "category-2");
      await user.clear(screen.getByRole("textbox", { name: "Category amount" }));
      await user.type(screen.getByRole("textbox", { name: "Category amount" }), "70.01");
      await user.type(screen.getByRole("textbox", { name: "Category amount 2" }), "30.00");
      expect(screen.getByText("Remaining: 0.00")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Create transaction" }));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: "100.01",
          categoryAllocations: [
            { categoryId: "category-1", amount: "70.01" },
            { categoryId: "category-2", amount: "30.00" },
          ],
        }),
      );
    },
  );

  it("should reject allocations that do not add up", async () => {
    const { onSubmit, user } = makeSut();
    await user.type(screen.getByRole("textbox", { name: "Amount" }), "100");
    await user.type(screen.getByRole("textbox", { name: "Description" }), "Supermarket");
    await user.selectOptions(select("From type"), "wallet");
    await user.selectOptions(select("From"), wallet.id);
    await user.selectOptions(select("To type"), "external");
    await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "category-1");
    await user.click(screen.getByRole("button", { name: "Add category" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Category 2" }), "category-2");
    await user.type(screen.getByRole("textbox", { name: "Category amount 2" }), "30");
    expect(screen.getByText("Over allocated: 30.00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create transaction" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Category amounts must add up");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ["Remove category", "category-2"],
    ["Remove category 2", "category-1"],
  ])(
    "should return to a single category with the full total after %s",
    async (button, categoryId) => {
      const { onSubmit, user } = makeSut();
      await user.type(screen.getByRole("textbox", { name: "Amount" }), "100");
      await user.type(screen.getByRole("textbox", { name: "Description" }), "Supermarket");
      await user.selectOptions(select("From type"), "wallet");
      await user.selectOptions(select("From"), wallet.id);
      await user.selectOptions(select("To type"), "external");
      await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "category-1");
      await user.click(screen.getByRole("button", { name: "Add category" }));
      await user.selectOptions(screen.getByRole("combobox", { name: "Category 2" }), "category-2");
      await user.clear(screen.getByRole("textbox", { name: "Category amount" }));
      await user.type(screen.getByRole("textbox", { name: "Category amount" }), "70");
      await user.type(screen.getByRole("textbox", { name: "Category amount 2" }), "30");
      await user.click(screen.getByRole("button", { name: button }));

      expect(screen.getByRole("combobox", { name: "Category" })).toHaveValue(categoryId);
      expect(screen.queryByRole("textbox", { name: "Category amount" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Remove category/ })).not.toBeInTheDocument();
      expect(screen.queryByText(/Enter the amount for each category/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Remaining:/)).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Create transaction" }));
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryAllocations: [{ categoryId, amount: "100" }] }),
      );

      await user.clear(screen.getByRole("textbox", { name: "Amount" }));
      await user.type(screen.getByRole("textbox", { name: "Amount" }), "125.50");
      await user.click(screen.getByRole("button", { name: "Create transaction" }));
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryAllocations: [{ categoryId, amount: "125.50" }] }),
      );
      await user.click(screen.getByRole("button", { name: "Add category" }));
      expect(screen.getByRole("textbox", { name: "Category amount" })).toHaveValue("125.50");
    },
  );
});
