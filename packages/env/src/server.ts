import "dotenv/config";
import { z } from "zod";

const serverEnvSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1).default("vedaai"),
  REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4-nano"),
  CORS_ORIGIN: z.url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = serverEnvSchema.parse(process.env);
