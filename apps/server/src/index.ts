import { env } from "@vedaai/env/server";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { startAssignmentGenerationWorker } from "./jobs/assignment-generation";
import { assignmentsRouter } from "./routes/assignments";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  },
});

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

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

httpServer.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
