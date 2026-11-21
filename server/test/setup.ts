import { resolve } from "node:path";

process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = resolve("server/test/querylens-test.sqlite");
process.env.FRONTEND_ORIGINS = "http://localhost:5173";
