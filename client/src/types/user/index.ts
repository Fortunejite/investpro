export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  telegramUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export * from './user.schema';