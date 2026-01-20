import config from "@/lib/config";

export interface Transaction {
  id: string;
  createdAt: Date;
  type: typeof config.transactionTypes[number];
  amount: string;
  txHash: string | null;
  accountId: number;
  actionId: string;
  destinationAddress: string | null;
}
