import config from "@/lib/config";

export interface Withdrawal {
  id: string;
  accountId: number;
  chain: typeof config.chains[number];
  perUsdRate: string;
  amount: string;
  destinationAddress?: string;
  status: typeof config.transactionStatuses[number];
  adminNote?: string;
  createdAt: Date;
}
