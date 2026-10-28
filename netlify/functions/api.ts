import serverless from "serverless-http";
import { app } from "../../server";

// Netlify invokes the same Express routes used by local development.
export const handler = serverless(app);
