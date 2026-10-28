import serverless from "serverless-http";

// Load the Express app only after marking this execution as a Netlify Function.
// This prevents server.ts from trying to start a long-running local server inside
// the function runtime and ensures the API routes are mounted for each invocation.
let cachedHandler: ReturnType<typeof serverless> | undefined;

export const handler = async (event: any, context: any) => {
  process.env.NETLIFY = "true";
  if (!cachedHandler) {
    const { app } = await import("../../server");
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};
