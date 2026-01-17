interface requiredEnv {
  name: string;
  key: string;
  value: string | undefined;
}

const config = {
  api: {
    baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL!,
  },
  isValid: false,
};

const validateConfig = () => {
  const required: requiredEnv[] = [
    {
      name: "Backend API URL",
      key: "backendApiUrl",
      value: config.api.baseURL,
    },
  ];

  const missing = required.filter((item) => !item.value);

  if (missing.length > 0) {
    console.error("Missing required configuration:");
    missing.forEach((item) => {
      console.error(`- ${item.name} (${item.key})`);
    });
    return false;
  }

  return true;
};

config.isValid = validateConfig();

export default config;
