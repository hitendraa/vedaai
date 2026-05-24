# VedaAI

AI Assessment Creator for the VedaAI full-stack engineering assignment.

## Stack

- **Frontend:** Next.js, TypeScript, TailwindCSS
- **State / Realtime:** Zustand + Socket.IO
- **Backend:** Node.js, Express, TypeScript, BullMQ
- **Database:** MongoDB Atlas with Mongoose
- **Jobs / Cache:** Redis
- **AI:** OpenAI Responses API with structured JSON output
- **Monorepo:** npm workspaces + Turborepo
- **Shared UI:** reusable components in `packages/ui`

## Getting Started

Install dependencies:

```bash
npm install
```

Create/update `apps/server/.env`:

```bash
CORS_ORIGIN=http://localhost:3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/vedaai?retryWrites=true&w=majority
MONGODB_DB_NAME=vedaai
REDIS_URL=rediss://default:<token>@<upstash-host>:6379
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-nano
```

If Node cannot resolve the Atlas SRV record on your machine, use the direct Atlas seedlist URI from the MongoDB driver connection settings instead:

```bash
MONGODB_URI=mongodb://<username>:<password>@<shard-0>:27017,<shard-1>:27017,<shard-2>:27017/vedaai?tls=true&replicaSet=<replica-set>&authSource=admin&retryWrites=true&w=majority
```

Create/update `apps/web/.env`:

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

Run the app:

```bash
npm run dev
```

Web app: `http://localhost:3001`

API: `http://localhost:3000`

## Assignment Flow

1. Teacher creates an assignment from the web UI.
2. API validates fields and file uploads.
3. Assignment is stored in MongoDB.
4. BullMQ adds a generation job in Redis.
5. Worker sends prompt + uploaded files to OpenAI.
6. Structured question paper is saved to MongoDB.
7. Socket.IO notifies the frontend when status changes.

## Upload Rules

- Allowed formats: PDF, DOCX, TXT, MD, JPG, PNG, WEBP
- Maximum files per assignment: 5
- Maximum file size: 10MB each

## Project Structure

```txt
vedaai/
  apps/
    web/       # Next.js frontend
    server/    # Express API, uploads, BullMQ worker, Socket.IO
  packages/
    db/        # MongoDB connection and Mongoose models
    env/       # Shared environment validation
    ui/        # Shared UI components
    config/    # Shared TypeScript config
```

## Available Scripts

- `npm run dev`: Start all applications in development mode
- `npm run build`: Build all applications
- `npm run dev:web`: Start only the web application
- `npm run dev:server`: Start only the server
- `npm run check-types`: Check TypeScript types across packages/apps
