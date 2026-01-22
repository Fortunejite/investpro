import IORedis from "ioredis";
import config from "@/config";

// Create Redis connection with proper configuration
const createRedisConnection = () => {
  const isCloudRedis = config.redis.url.includes('rediss://') || 
                      config.redis.url.includes('amazonaws.com') ||
                      config.redis.url.includes('redislabs.com') ||
                      config.redis.url.includes('upstash.com');

  if (isCloudRedis) {
    // Cloud Redis with TLS
    return new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Local Redis without TLS
    return new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      // No TLS for local Redis
    });
  }
};

export const redisConnection = createRedisConnection();

const testRedisConnection = async () => {
  try {
    console.log(`Attempting to connect to Redis at ${config.redis.host}:${config.redis.port}...`);
    await redisConnection.connect();
    const result = await redisConnection.ping();
    console.log("✅ Connected to Redis successfully:", result);
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
    console.log("Redis configuration:", {
      host: config.redis.host,
      port: config.redis.port,
      hasPassword: !!config.redis.password,
      url: config.redis.url
    });
    process.exit(1);
  }
};

// Handle Redis connection events
redisConnection.on('connect', () => {
  console.log('🔄 Redis connecting...');
});

redisConnection.on('ready', () => {
  console.log('🚀 Redis connection ready');
});

redisConnection.on('error', (err) => {
  console.error('🔴 Redis connection error:', err);
});

redisConnection.on('close', () => {
  console.log('🔌 Redis connection closed');
});

redisConnection.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

testRedisConnection();