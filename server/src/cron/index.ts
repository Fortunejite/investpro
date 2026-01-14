import { startInvestmentCron } from "./investment.cron";

const startJobs = () => {
  startInvestmentCron();
};

export default startJobs;