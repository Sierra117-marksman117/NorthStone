/**
 * Idempotent Index Setup Script — Northstone Realty
 * Usage: npm run setup-indexes
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import { assertDatabaseConfig } from '@/lib/database-config';

// Register all Mongoose models
import '@/models/User';
import '@/models/Agent';
import '@/models/Neighborhood';
import '@/models/Property';
import '@/models/Lead';
import '@/models/PropertyVisit';
import '@/models/Favorite';
import '@/models/Notification';
import '@/models/ActivityLog';
import '@/models/RateLimitEntry';

const MONGODB_URI = process.env.MONGODB_URI;
const EXPECTED_DB_NAME = process.env.EXPECTED_DB_NAME ?? 'northstone_realty_dev';

async function main() {
  const config = assertDatabaseConfig({
    uri: MONGODB_URI ?? '',
    expectedDbName: EXPECTED_DB_NAME,
  });

  console.log('[setup-indexes] Connecting to MongoDB...');
  await mongoose.connect(config.uri, {
    bufferCommands: false,
    autoIndex: false,
    minPoolSize: 0,
    maxPoolSize: 5,
  });

  const connectedName = mongoose.connection.name;
  if (connectedName !== EXPECTED_DB_NAME) {
    console.error(
      `[setup-indexes] Database name mismatch: expected "${EXPECTED_DB_NAME}", got "${connectedName}". Aborting.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`[setup-indexes] Connected to ${connectedName}. Synchronizing indexes...`);

  const models = Object.values(mongoose.models);
  const failures: string[] = [];
  for (const model of models) {
    try {
      // createIndexes is idempotent and does not remove unrelated/manual indexes.
      await model.createIndexes();
      console.log(`[setup-indexes] OK: ${model.modelName}`);
    } catch (err) {
      console.error(`[setup-indexes] FAILED: ${model.modelName}`, err);
      failures.push(model.modelName);
    }
  }

  await mongoose.disconnect();
  if (failures.length) {
    throw new Error(
      `[setup-indexes] Index creation failed for: ${failures.join(', ')}`
    );
  }
  console.log('[setup-indexes] Index synchronization completed.');
}

main().catch((err) => {
  console.error('[setup-indexes] Fatal error:', err);
  process.exit(1);
});
