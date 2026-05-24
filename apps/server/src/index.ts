import { env } from "@vedaai/env/server";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { startAssignmentGenerationWorker } from "./jobs/assignment-generation";
import { assignmentsRouter } from "./routes/assignments";

const app = express();
const httpServer = createServer(app);
const corsMethods = ["GET", "POST", "PATCH", "DELETE", "OPTIONS"];
const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

function isOriginAllowed(origin?: string) {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin.replace(/\/$/, ""));
}

const corsOrigin: cors.CorsOptions["origin"] = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS.`));
};

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: corsMethods,
  },
});

app.use(
  cors({
    origin: corsOrigin,
    methods: corsMethods,
  }),
);
app.options(/.*/, cors({ origin: corsOrigin, methods: corsMethods }));

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api/assignments", assignmentsRouter);

io.on("connection", (socket) => {
  socket.on("assignment:join", (assignmentId: string) => {
    socket.join(`assignment:${assignmentId}`);
  });
});

void startAssignmentGenerationWorker(io);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message =
      error instanceof Error ? error.message : "Internal server error.";

    if (error instanceof Error && error.name === "MulterError") {
      res.status(400).json({ error: error.message });
      return;
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Only PDF, DOCX")
    ) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (
      error instanceof Error &&
      (error.name === "MongoServerSelectionError" ||
        message.includes("querySrv") ||
        message.includes("ECONNREFUSED"))
    ) {
      console.error(`Service unavailable: ${message}`);
      res.status(503).json({
        error:
          "Database or Redis is unavailable. Check MongoDB Atlas/network and Redis.",
      });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  },
);

const port = Number(process.env.PORT || 3000);

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
