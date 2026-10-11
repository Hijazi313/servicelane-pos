import { defineConfig } from 'drizzle-kit';

// Generation is offline. Database access belongs to the explicit migration runner.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema.ts',
  out: './migrations',
});
