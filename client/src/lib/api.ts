import axios from "axios";
import config from "./config";

export const api = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;