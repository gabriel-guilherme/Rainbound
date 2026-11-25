import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/server";

/* Endpoints do Better Auth (/api/auth/sign-in/..., /sign-up/..., /sign-out). */
export const { GET, POST } = toNextJsHandler(auth);
