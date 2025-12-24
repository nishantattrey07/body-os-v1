import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create a connection pool for the Transaction Pooler
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter with the pool
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the adapter
export const prisma = new PrismaClient({ adapter });
