import { resolveKind, toTypesFor, TXN_COMBINATIONS } from "@/constants/transactionMatrix";
import { TXN_FROM_TYPE, TXN_KIND, TXN_TO_TYPE } from "@/constants/transactions";

const WALLET_A = "11111111-1111-1111-1111-111111111111";
const WALLET_B = "22222222-2222-2222-2222-222222222222";

describe("toTypesFor", () => {
  it("should offer only a wallet destination for an external source", () => {
    expect(toTypesFor(TXN_FROM_TYPE.External)).toEqual([TXN_TO_TYPE.Wallet]);
  });

  it("should offer only a wallet destination for a revenue source", () => {
    expect(toTypesFor(TXN_FROM_TYPE.Revenue)).toEqual([TXN_TO_TYPE.Wallet]);
  });

  it("should offer bill, external and wallet destinations for a wallet source", () => {
    expect(toTypesFor(TXN_FROM_TYPE.Wallet)).toEqual([
      TXN_TO_TYPE.Bill,
      TXN_TO_TYPE.External,
      TXN_TO_TYPE.Wallet,
    ]);
  });

  it("should never offer a revenue destination, since revenue is source-only", () => {
    const everyDestination = Object.values(TXN_FROM_TYPE).flatMap(toTypesFor);

    expect(everyDestination).not.toContain("revenue");
  });
});

describe("resolveKind", () => {
  it("should resolve external to wallet as money in", () => {
    expect(resolveKind(TXN_FROM_TYPE.External, TXN_TO_TYPE.Wallet)).toBe(TXN_KIND.MoneyIn);
  });

  it("should resolve revenue to wallet as a realized revenue", () => {
    expect(resolveKind(TXN_FROM_TYPE.Revenue, TXN_TO_TYPE.Wallet)).toBe(TXN_KIND.RevenueRealized);
  });

  it("should resolve wallet to bill as a paid bill", () => {
    expect(resolveKind(TXN_FROM_TYPE.Wallet, TXN_TO_TYPE.Bill)).toBe(TXN_KIND.BillPaid);
  });

  it("should resolve wallet to external as money out", () => {
    expect(resolveKind(TXN_FROM_TYPE.Wallet, TXN_TO_TYPE.External)).toBe(TXN_KIND.MoneyOut);
  });

  it("should resolve two different wallets as an internal transfer", () => {
    expect(resolveKind(TXN_FROM_TYPE.Wallet, TXN_TO_TYPE.Wallet, WALLET_A, WALLET_B)).toBe(
      TXN_KIND.InternalTransfer,
    );
  });

  it("should resolve the same wallet on both ends as a manual adjustment", () => {
    expect(resolveKind(TXN_FROM_TYPE.Wallet, TXN_TO_TYPE.Wallet, WALLET_A, WALLET_A)).toBe(
      TXN_KIND.ManualAdjustment,
    );
  });

  // The modal resolves the kind live, before the user has picked either wallet.
  it("should default a wallet-to-wallet pair with no ids to an internal transfer", () => {
    expect(resolveKind(TXN_FROM_TYPE.Wallet, TXN_TO_TYPE.Wallet)).toBe(TXN_KIND.InternalTransfer);
  });

  it("should not call two null ids equal", () => {
    expect(resolveKind(TXN_FROM_TYPE.Wallet, TXN_TO_TYPE.Wallet, null, null)).toBe(
      TXN_KIND.InternalTransfer,
    );
  });

  it("should return null for the illegal external-to-bill pair", () => {
    expect(resolveKind(TXN_FROM_TYPE.External, TXN_TO_TYPE.Bill)).toBeNull();
  });

  it("should return null for the illegal revenue-to-external pair", () => {
    expect(resolveKind(TXN_FROM_TYPE.Revenue, TXN_TO_TYPE.External)).toBeNull();
  });
});

describe("TXN_COMBINATIONS", () => {
  it("should resolve a kind for every listed combination", () => {
    const resolved = TXN_COMBINATIONS.map((c) => resolveKind(c.fromType, c.toType));

    expect(resolved).not.toContain(null);
  });

  it("should list each from/to pair exactly once", () => {
    const pairs = TXN_COMBINATIONS.map((c) => `${c.fromType}->${c.toType}`);

    expect(new Set(pairs).size).toBe(TXN_COMBINATIONS.length);
  });
});
