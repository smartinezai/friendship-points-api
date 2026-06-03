import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/** Shared PostgreSQL connection pool used by Prisma's pg adapter. */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

/** Shared Prisma client for all database access in the API. */
export const prisma = new PrismaClient({
  adapter,
});
