import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import config from './config';

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

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});