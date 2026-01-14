import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import config from './config';
import errorHandler from './middlewares/errorMiddleware';
import { 
  authRoutes,
  depositRoutes,
  planRoutes,
  transactionRoutes,
  walletRoutes,
  withdrawalRoutes,
 } from './routes';
import { authenticate } from './middlewares/authMiddleware';

if (!config.isValid) {
  console.error("Invalid configuration. Exiting...");
  process.exit(1);
}

const app = express();

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);
app.use('/plans', authenticate, planRoutes);
app.use('/deposits', authenticate, depositRoutes);
app.use('/transactions', authenticate, transactionRoutes);
app.use('/withdrawals', authenticate, withdrawalRoutes);
app.use('/wallets', authenticate, walletRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handling middleware
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down application...");
  process.exit(0);
});