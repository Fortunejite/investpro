export interface Transaction {
  id: string;
  createdAt: Date;
  type: "deposit" | "withdrawal" | "investment" | "profit_payout";
  amount: string;
  txHash: string | null;
  accountId: number;
  actionId: string;
  destinationAddress: string | null;
}
