import { startInvestmentCron } from "./investment.cron";
import { startTradesCron } from "./trades.cron";

const startJobs = () => {
  startInvestmentCron();
  startTradesCron();
};

export default startJobs;