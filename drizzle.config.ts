import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Same order as Next.js: .env first, .env.local overrides.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
