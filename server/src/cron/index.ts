import { startInvestmentCron } from "./investment.cron";
import { startPositionsCron } from "./position.cron";

const startJobs = () => {
  startInvestmentCron();
  startPositionsCron();
};

export default startJobs;