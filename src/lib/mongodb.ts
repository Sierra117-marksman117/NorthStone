import mongoose from 'mongoose';
import { assertDatabaseConfig } from '@/lib/database-config';

const DEFAULT_DB_NAME = 'northstone_realty_dev';

declare global {
  var _northstoneMongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global._northstoneMongoose ?? { conn: null, promise: null };
global._northstoneMongoose = cached;

mongoose.set('strictQuery', true);

export function isMongoConfigured(): boolean {
  try {
    getValidatedDatabaseConfig();
    return true;
  } catch {
    return false;
  }
}

export function getValidatedDatabaseConfig() {
  return assertDatabaseConfig({
    uri: process.env.MONGODB_URI ?? '',
    expectedDbName: process.env.EXPECTED_DB_NAME ?? DEFAULT_DB_NAME,
  });
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.promise && mongoose.connection.readyState === 2) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  if (!cached.promise) {
    const { uri, expectedDbName } = getValidatedDatabaseConfig();
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      // minPoolSize: 0 ensures serverless instances do not hold idle connections
      minPoolSize: 0,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      // Indexes are created via explicit setup-indexes script in production
      autoIndex: process.env.NODE_ENV === 'development',
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((instance) => {
        const connectedDb = instance.connection.name;
        if (connectedDb !== expectedDbName) {
          void instance.disconnect();
          throw new Error(
            `Database name mismatch: expected "${expectedDbName}", got "${connectedDb}".`
          );
        }
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[northstone] MongoDB connected -> ${connectedDb}`);
        }
        return instance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectToDatabase;
