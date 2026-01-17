import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import config from './config';
import errorHandler from './middlewares/error.middleware';
import { 
  accountRoutes,
  authRoutes,
  depositRoutes,
  investmentPlanRoutes,
  investmentRoutes,
  tradeSignalRoutes,
  transactionRoutes,
  withdrawalRoutes,
 } from './routes';
import { authenticate } from './middlewares/auth.middleware';
import startJobs from './cron';

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
app.use('/account', authenticate, accountRoutes);
app.use('/auth', authRoutes);
app.use('/investment-plans', authenticate, investmentPlanRoutes);
app.use('/investments', authenticate, investmentRoutes);
app.use('/deposits', authenticate, depositRoutes);
app.use('/trading-signals', authenticate, tradeSignalRoutes);
app.use('/transactions', authenticate, transactionRoutes);
app.use('/withdrawals', authenticate, withdrawalRoutes);

app.use('/status', (req, res) => {
  res.status(200).json({ running: true });
});

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handling middleware
app.use(errorHandler);

startJobs();
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down application...");
  process.exit(0);
});