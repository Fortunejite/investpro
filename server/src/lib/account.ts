import z from 'zod';
import { prisma } from './prisma';

const createAccountSchema = z.object({
  id: z.number(),
});

export const createAccount = async (
  userId: number,
) => {
  const validatedData = createAccountSchema.parse({ id: userId });

  // Create the account in the database
  const account = await prisma.account.create({
    data: {
      id: validatedData.id,
    },
  });

  return account;
};
