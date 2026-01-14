import z from 'zod';
import config from '@/config';
import { prisma } from './prisma';

const createWalletAccountSchema = z.object({
  chain: z.enum(config.chains),
  label: z.string().min(2).max(50).optional(),
});

export const createWalletAccount = async (
  userId: number,
  payload: z.infer<typeof createWalletAccountSchema>,
) => {
  const validatedData = createWalletAccountSchema.parse(payload);

  // Create the wallet account in the database
  const walletAccount = await prisma.walletAccount.create({
    data: {
      userId,
      chain: validatedData.chain,
      label: validatedData.label,
    },
  });

  return walletAccount;
};
