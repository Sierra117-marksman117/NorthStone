const DATABASE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const MONGODB_URI_PATTERN =
  /^(mongodb(?:\+srv)?):\/\/([^/?#\s]+)(\/[^?#\s]*)?(\?[^#\s]*)?$/;

export interface DatabaseConfig {
  uri: string;
  expectedDbName: string;
}

interface ParsedMongoConnectionString {
  databaseName: string | null;
  withDatabaseName: (databaseName: string) => string;
}

function parseMongoConnectionString(
  uri: string
): ParsedMongoConnectionString {
  const scheme = uri.match(/^([A-Za-z][A-Za-z0-9+.-]*):\/\//)?.[1];
  if (!scheme) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection URI.');
  }
  if (scheme !== 'mongodb' && scheme !== 'mongodb+srv') {
    throw new Error('MONGODB_URI must use the mongodb:// or mongodb+srv:// protocol.');
  }

  const match = uri.match(MONGODB_URI_PATTERN);
  if (!match) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection URI.');
  }
  const path = match[3] ?? '';
  let databaseName: string;
  try {
    databaseName = decodeURIComponent(path.replace(/^\//, '')).trim();
  } catch {
    throw new Error('MONGODB_URI must be a valid MongoDB connection URI.');
  }

  return {
    databaseName: databaseName || null,
    withDatabaseName(databaseNameValue: string) {
      const queryIndex = uri.indexOf('?');
      const base = queryIndex >= 0 ? uri.slice(0, queryIndex) : uri;
      const query = queryIndex >= 0 ? uri.slice(queryIndex) : '';
      return `${base.replace(/\/$/, '')}/${databaseNameValue}${query}`;
    },
  };
}

export function getDatabaseNameFromMongoUri(uri: string): string | null {
  return parseMongoConnectionString(uri).databaseName;
}

export function assertDatabaseConfig({
  uri,
  expectedDbName,
}: DatabaseConfig): DatabaseConfig {
  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Configure it in .env.local.');
  }

  if (!expectedDbName || !DATABASE_NAME_PATTERN.test(expectedDbName)) {
    throw new Error('EXPECTED_DB_NAME must be an explicit valid database name.');
  }

  const uriDbName = getDatabaseNameFromMongoUri(uri);

  // Some Atlas connection strings are supplied without a path. Keep the
  // credential-bearing value untouched on disk and add the allowlisted
  // development database to the in-memory URI used by Mongoose.
  if (!uriDbName) {
    const parsed = parseMongoConnectionString(uri);
    return { uri: parsed.withDatabaseName(expectedDbName), expectedDbName };
  }

  if (uriDbName !== expectedDbName) {
    throw new Error(
      `Database name mismatch: expected "${expectedDbName}", URI targets "${uriDbName}".`
    );
  }

  return { uri, expectedDbName };
}

export function assertSeedEnvironment({
  nodeEnv,
  allowSeed,
}: {
  nodeEnv: string;
  allowSeed: boolean;
}): void {
  if (nodeEnv === 'production' && !allowSeed) {
    throw new Error(
      'Refusing to seed in production. Set ALLOW_SEED=true only after explicit review.'
    );
  }
}
