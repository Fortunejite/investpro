import config from "@/lib/config";

export interface Deposit {
  id: string;
  accountId: number;
  chain: typeof config.chains[number];
  perUsdRate: string;
  amount: string;
  txHash?: string;
  proofUrl?: string;
  status: typeof config.transactionStatuses[number];
  adminNote?: string;
  createdAt: Date;
}
