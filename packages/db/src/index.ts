import { env } from "@vedaai/env/server";
import mongoose from "mongoose";

export * from "./models/assignment";
export * from "./models/result";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  connectionPromise ??= mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
  });

  return connectionPromise;
}

export async function disconnectDb() {
  connectionPromise = null;
  await mongoose.disconnect();
}
