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
      categories={[]}
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
        await screen.findByText(
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
      await user.click(screen.getByRole("button", { name: "Create transaction" }));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
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
});
