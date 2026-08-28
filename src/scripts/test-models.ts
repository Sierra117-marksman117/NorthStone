import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import { ActivityLog } from '@/models/ActivityLog';
import { Agent } from '@/models/Agent';
import { Favorite } from '@/models/Favorite';
import { Lead } from '@/models/Lead';
import { Neighborhood } from '@/models/Neighborhood';
import { Notification } from '@/models/Notification';
import { Property } from '@/models/Property';
import { PropertyVisit } from '@/models/PropertyVisit';
import { RateLimitEntry } from '@/models/RateLimitEntry';
import { User } from '@/models/User';
import {
  assertDatabaseConfig,
  assertSeedEnvironment,
  getDatabaseNameFromMongoUri,
} from '@/lib/database-config';
import {
  validateImageUpload,
  verifyImageMagicBytes,
} from '@/lib/cloudinary';
import { createRateLimitKey } from '@/lib/rate-limit';
import {
  formatInrAmount,
  hashIp,
  isValidPriceAmount,
  slugify,
} from '@/lib/utils';
import { normalizeVisitSlot } from '@/services/visit.service';
import {
  seedAgents,
  seedAssetInventory,
  seedNeighborhoods,
  seedProperties,
} from '@/scripts/seed-data';
import { ACTIVITY_ACTIONS, LEAD_STATUS_TRANSITIONS } from '@/types';

let passed = 0;
let failed = 0;

function assert(condition: unknown, testName: string): void {
  if (condition) {
    console.log(`✓ ${testName}`);
    passed += 1;
  } else {
    console.error(`✗ ${testName}`);
    failed += 1;
  }
}

function assertThrows(operation: () => unknown, testName: string): void {
  try {
    operation();
    assert(false, testName);
  } catch {
    assert(true, testName);
  }
}

function hasIndex(
  model: mongoose.Model<unknown>,
  keys: Record<string, number>,
  options: (value: Record<string, unknown>) => boolean
): boolean {
  return model.schema.indexes().some(([indexKeys, indexOptions]) => {
    const keyMatch = JSON.stringify(indexKeys) === JSON.stringify(keys);
    return keyMatch && options(indexOptions as Record<string, unknown>);
  });
}

function baseProperty(overrides: Record<string, unknown> = {}) {
  return new Property({
    title: 'Test Villa',
    slug: `test-villa-${Math.random().toString(16).slice(2)}`,
    description: 'A typed illustrative property record.',
    purpose: 'BUY',
    propertyType: 'VILLA',
    status: 'AVAILABLE',
    isPublished: false,
    priceAmount: 50_000_000,
    bedrooms: 4,
    bathrooms: 4,
    furnishing: 'FURNISHED',
    completionStatus: 'READY_TO_MOVE',
    address: {
      line1: '123 Test Street',
      neighborhood: 'Worli',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400018',
    },
    ...overrides,
  });
}

async function runTests(): Promise<void> {
  console.log('=== NORTHSTONE Phase 2 verification ===');

  const models = [
    User,
    Agent,
    Neighborhood,
    Property,
    Lead,
    PropertyVisit,
    Favorite,
    Notification,
    ActivityLog,
    RateLimitEntry,
  ];
  assert(models.every((model) => Boolean(model.modelName)), 'all ten models register');

  assert(formatInrAmount(250_000_000) === '₹25 Cr', 'crore formatting');
  assert(formatInrAmount(350_000) === '₹3.5 L', 'lakh formatting');
  assert(formatInrAmount(85_000) === '₹85,000', 'INR formatting');
  assert(slugify('Sky Pavilion Worli 4BHK') === 'sky-pavilion-worli-4bhk', 'slug formatting');

  assert(isValidPriceAmount(1), 'positive safe integer price accepted');
  assert(!isValidPriceAmount(0), 'zero price rejected');
  assert(!isValidPriceAmount(-1), 'negative price rejected');
  assert(!isValidPriceAmount(100.5), 'decimal price rejected');
  assert(!isValidPriceAmount(Number.NaN), 'NaN price rejected');
  assert(!isValidPriceAmount(Number.MAX_SAFE_INTEGER + 1), 'unsafe integer price rejected');

  assert(baseProperty().validateSync() === undefined, 'valid BUY property passes');
  const rentWithoutPeriod = baseProperty({ purpose: 'RENT', priceAmount: 200_000 });
  assert(Boolean(rentWithoutPeriod.validateSync()?.errors.rentPeriod), 'RENT requires rentPeriod');
  const buyWithPeriod = baseProperty({ rentPeriod: 'MONTH' });
  assert(Boolean(buyWithPeriod.validateSync()?.errors.rentPeriod), 'BUY rejects rentPeriod');
  const decimalPrice = baseProperty({ priceAmount: 100.5 });
  assert(Boolean(decimalPrice.validateSync()?.errors.priceAmount), 'schema rejects decimal price');

  const publishedWithoutMedia = baseProperty({ isPublished: true });
  let publicationRejected = false;
  await publishedWithoutMedia.validate().catch(() => {
    publicationRejected = true;
  });
  assert(publicationRejected, 'published property requires three approved images');

  const propertyPaths = Property.schema.paths;
  assert(!('priceDisplay' in propertyPaths), 'priceDisplay is not stored');
  assert(!('isVerified' in propertyPaths), 'unsupported verification flag is absent');
  assert(Boolean(propertyPaths.internalNotes), 'typed property internal notes exist');
  assert(Boolean(propertyPaths.statusHistory), 'typed property status history exists');
  assert(Boolean(propertyPaths.address), 'typed property address exists');
  assert(Boolean(propertyPaths.images), 'typed property images exist');
  assert(Boolean(propertyPaths.floorPlans), 'typed property floor plans exist');
  assert(Boolean(propertyPaths.seo), 'typed property SEO exists');
  assert(Boolean(Property.schema.path('images.contentHash')), 'property images store content hash');
  assert(Boolean(Property.schema.path('floorPlans.contentHash')), 'floor plans store content hash');
  assert(!('rating' in Agent.schema.paths), 'agent rating is absent');
  assert(!('licenseNumber' in Agent.schema.paths), 'public license number is absent');

  assert(
    hasIndex(
      PropertyVisit as unknown as mongoose.Model<unknown>,
      { property: 1, startAt: 1 },
      (options) =>
        options.unique === true &&
        JSON.stringify(options.partialFilterExpression) ===
          JSON.stringify({ slotActive: true })
    ),
    'property visit slot partial unique index'
  );
  assert(
    hasIndex(
      PropertyVisit as unknown as mongoose.Model<unknown>,
      { agent: 1, startAt: 1 },
      (options) =>
        options.unique === true &&
        options.sparse !== true &&
        Boolean(options.partialFilterExpression)
    ),
    'agent visit slot partial unique index excludes unassigned visits'
  );
  assert(
    hasIndex(
      PropertyVisit as unknown as mongoose.Model<unknown>,
      { idempotencyKey: 1 },
      (options) => options.unique === true
    ),
    'visit submission idempotency index'
  );
  assert(
    hasIndex(
      Lead as unknown as mongoose.Model<unknown>,
      { idempotencyKey: 1 },
      (options) => options.unique === true
    ),
    'lead submission idempotency index'
  );
  assert(
    hasIndex(
      Notification as unknown as mongoose.Model<unknown>,
      { dedupeKey: 1 },
      (options) => options.unique === true
    ),
    'notification dedupe index'
  );
  assert(
    hasIndex(
      RateLimitEntry as unknown as mongoose.Model<unknown>,
      { keyHash: 1, windowId: 1 },
      (options) => options.unique === true
    ),
    'durable rate-limit atomic window index'
  );
  assert(
    hasIndex(
      RateLimitEntry as unknown as mongoose.Model<unknown>,
      { expiresAt: 1 },
      (options) => options.expireAfterSeconds === 0
    ),
    'rate-limit TTL cleanup index'
  );
  assert(
    hasIndex(
      ActivityLog as unknown as mongoose.Model<unknown>,
      { createdAt: 1 },
      (options) => options.expireAfterSeconds === 180 * 24 * 3600
    ),
    'activity-log 180-day retention index'
  );

  const activityEnum = ActivityLog.schema.path('action').options.enum;
  assert(
    Array.isArray(activityEnum) && activityEnum.length === ACTIVITY_ACTIONS.length,
    'activity actions are runtime allowlisted'
  );
  assert(Boolean(User.schema.path('preferences.emailComms')), 'email preference exists');
  assert(Boolean(User.schema.path('preferences.inAppPropertyAlerts')), 'in-app alert preference exists');
  assert(Boolean(User.schema.path('preferences.priceChangeAlerts')), 'price alert preference exists');
  assert(Boolean(User.schema.path('preferences.visitReminders')), 'visit reminder preference exists');

  const normalized = normalizeVisitSlot(
    new Date('2026-09-01T10:35:00+05:30')
  );
  assert(
    normalized.toISOString() === '2026-09-01T04:30:00.000Z',
    'visit slots normalize to an Asia/Kolkata hour'
  );
  const visitId = new mongoose.Types.ObjectId();
  const visit = new PropertyVisit({
    property: visitId,
    visitorName: 'Guest Visitor',
    visitorEmail: 'visitor@example.com',
    startAt: normalized,
    endAt: new Date(normalized.getTime() + 60 * 60 * 1000),
    timeZone: 'Asia/Kolkata',
    slotActive: true,
    visitType: 'IN_PERSON',
    status: 'PENDING',
    idempotencyKey: 'visit-key-1234567890',
  });
  assert((await visit.validate()) === undefined, 'canonical visit passes validation');

  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);
  const fakeWebp = Buffer.from('RIFFxxxxNOPE', 'ascii');
  assert(verifyImageMagicBytes(png, 'image/png'), 'PNG magic bytes accepted');
  assert(!verifyImageMagicBytes(fakeWebp, 'image/webp'), 'invalid WebP signature rejected');
  assertThrows(
    () => validateImageUpload({ buffer: png, mimeType: 'image/svg+xml' }),
    'SVG uploads rejected'
  );

  const secret = 'test-only-secret-123456789';
  const rateKey = createRateLimitKey({
    scope: 'lead',
    identifier: '203.0.113.10',
    secret,
  });
  assert(rateKey.length === 64 && !rateKey.includes('203.0.113.10'), 'rate-limit identifier is keyed-hashed');
  const ipHash = hashIp('203.0.113.10', secret);
  assert(ipHash.length === 16 && !ipHash.includes('203.0.113.10'), 'IP is stored as a keyed truncated hash');

  assertDatabaseConfig({
    uri: 'mongodb://localhost:27017/northstone_realty_dev',
    expectedDbName: 'northstone_realty_dev',
  });
  assert(true, 'matching database URI guard accepted');
  assertThrows(
    () =>
      assertDatabaseConfig({
        uri: 'mongodb://localhost:27017/other_database',
        expectedDbName: 'northstone_realty_dev',
      }),
    'unexpected database name rejected'
  );
  const pathlessConfig = assertDatabaseConfig({
    uri: 'mongodb://localhost:27017',
    expectedDbName: 'northstone_realty_dev',
  });
  assert(
    getDatabaseNameFromMongoUri(pathlessConfig.uri) === 'northstone_realty_dev',
    'pathless URI receives the allowlisted development database in memory'
  );
  const replicaSetConfig = assertDatabaseConfig({
    uri: 'mongodb://db-1.example.test:27017,db-2.example.test:27017,db-3.example.test:27017/?replicaSet=rs0',
    expectedDbName: 'northstone_realty_dev',
  });
  assert(
    getDatabaseNameFromMongoUri(replicaSetConfig.uri) ===
      'northstone_realty_dev' &&
      replicaSetConfig.uri.includes('replicaSet=rs0'),
    'multi-host replica-set URI receives the allowlisted database'
  );
  assertThrows(
    () => assertSeedEnvironment({ nodeEnv: 'production', allowSeed: false }),
    'production seed rejected without explicit override'
  );

  const unique = (items: string[]) => new Set(items).size === items.length;
  assert(seedProperties.length >= 8 && seedProperties.length <= 12, 'seed contains 8–12 property drafts');
  assert(unique(seedProperties.map((item) => item.slug)), 'seed property slugs are unique');
  assert(unique(seedAgents.map((item) => item.email)), 'seed agent emails are unique');
  assert(unique(seedNeighborhoods.map((item) => item.slug)), 'seed neighborhood slugs are unique');
  assert(
    seedProperties.every(
      (item) =>
        item.isIllustrative &&
        item.isPublished &&
        item.imageAlts.length === 3
    ),
    'seed properties are internally illustrative, published, and define three owned images'
  );
  assert(
    !JSON.stringify({ seedAgents, seedNeighborhoods, seedProperties }).includes('http'),
    'seed data contains no hotlinked media'
  );
  assert(
    seedAssetInventory.approvedPropertyImages === seedProperties.length * 3 &&
      seedAssetInventory.minimumPropertyImagesRequired ===
        seedProperties.length * 3,
    'seed property media inventory is complete'
  );
  assert(
    seedAssetInventory.siteHeroImagesRequired === 1 &&
      seedAssetInventory.approvedSiteHeroImages === 1,
    'static site hero is inventoried'
  );
  assert(LEAD_STATUS_TRANSITIONS.NEW.includes('CONTACTED'), 'lead transition allowlist permits NEW to CONTACTED');
  assert(!LEAD_STATUS_TRANSITIONS.NEW.includes('WON'), 'lead transition allowlist blocks NEW to WON');

  console.log(`=== ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exitCode = 1;
}

runTests().catch((error) => {
  console.error('Phase 2 verification failed:', error);
  process.exitCode = 1;
});
