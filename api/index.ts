// Re-implement the API entrypoint so Vercel treats it as a serverless function
// by exporting an Express application (no app.listen call). This file simply
// bootstraps the shared Express setup from the server directory.

import express from "express";
import { registerRoutes } from "../server/routes";

// Create a new Express instance that will be used by the Vercel serverless
// runtime for each invocation.
const app = express();

// Standard body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all existing API routes/middleware defined for the self-hosted
// server. We ignore the returned `http.Server` object because the Vercel
// runtime handles the request/response lifecycle for us.
// eslint-disable-next-line @typescript-eslint/no-floating-promises
registerRoutes(app);

// IMPORTANT:  Do NOT call `app.listen()` here – Vercel provides the HTTP
// server. Simply export the configured Express app.
export default app;