/**
 * Idempotent Phase 3 seed command for published illustrative reference records.
 * Generated media is owned by this repository and served from /public.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { assertDatabaseConfig, assertSeedEnvironment } from '@/lib/database-config';
import { Agent } from '@/models/Agent';
import { Neighborhood } from '@/models/Neighborhood';
import { Property } from '@/models/Property';
import { User } from '@/models/User';
import {
  SEED_VERSION,
  seedAgents,
  seedAssetInventory,
  seedNeighborhoods,
  seedProperties,
} from '@/scripts/seed-data';

const EXPECTED_DB_NAME =
  process.env.EXPECTED_DB_NAME ?? 'northstone_realty_dev';

function localWebpMedia(
  relativePath: string,
  dimensions: { width: number; height: number }
) {
  const normalized = relativePath.replaceAll('\\', '/');
  const absolutePath = path.join(
    process.cwd(),
    'public',
    'images',
    'generated',
    ...normalized.split('/')
  );
  const buffer = fs.readFileSync(absolutePath);
  const isWebp =
    buffer.length > 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!isWebp) {
    throw new Error('[seed] Expected generated WebP asset: ' + absolutePath);
  }

  return {
    publicId: 'local/generated/' + normalized.replace(/\.webp$/i, ''),
    secureUrl: '/images/generated/' + normalized,
    ...dimensions,
    format: 'webp' as const,
    contentHash: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

async function connectSafely(): Promise<void> {
  assertSeedEnvironment({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    allowSeed: process.env.ALLOW_SEED === 'true',
  });
  const config = assertDatabaseConfig({
    uri: process.env.MONGODB_URI ?? '',
    expectedDbName: EXPECTED_DB_NAME,
  });

  await mongoose.connect(config.uri, {
    bufferCommands: false,
    autoIndex: false,
    minPoolSize: 0,
    maxPoolSize: 5,
  });
  if (mongoose.connection.name !== config.expectedDbName) {
    throw new Error(
      `[seed] Connected database mismatch: expected "${config.expectedDbName}".`
    );
  }
}

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Northstone Administrator';

  if (!email && !password) {
    console.log('[seed] Admin credentials absent; administrator creation skipped.');
    return;
  }
  if (!email || !password) {
    throw new Error(
      '[seed] SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be supplied together.'
    );
  }
  if (password.length < 12) {
    throw new Error('[seed] SEED_ADMIN_PASSWORD must contain at least 12 characters.');
  }

  const existing = await User.findOne({ email }).select('role');
  if (existing) {
    if (existing.role !== 'ADMIN') {
      throw new Error(
        '[seed] Refusing to promote an existing non-admin account automatically.'
      );
    }
    console.log(`[seed] Admin already exists: ${email}`);
    return;
  }

  await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'ADMIN',
    isActive: true,
  });
  console.log(`[seed] Admin created: ${email}`);
}

async function seedReferenceRecords(): Promise<void> {
  for (const definition of seedAgents) {
    const { avatarAlt: _avatarAlt, ...agent } = definition;
    await Agent.updateOne(
      { slug: definition.slug },
      {
        $set: {
          ...agent,
          avatar: localWebpMedia(
            'agents/' + definition.slug + '.webp',
            { width: 1122, height: 1402 }
          ),
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  for (const definition of seedNeighborhoods) {
    const { heroAlt: _heroAlt, ...neighborhood } = definition;
    await Neighborhood.updateOne(
      { slug: definition.slug },
      {
        $set: {
          ...neighborhood,
          heroMedia: localWebpMedia(
            'neighborhoods/' + definition.slug + '.webp',
            { width: 1634, height: 963 }
          ),
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  const [agents, neighborhoods] = await Promise.all([
    Agent.find({ slug: { $in: seedAgents.map((item) => item.slug) } })
      .select('_id slug')
      .lean(),
    Neighborhood.find({
      slug: { $in: seedNeighborhoods.map((item) => item.slug) },
    })
      .select('_id slug')
      .lean(),
  ]);
  const agentIds = new Map(agents.map((item) => [item.slug, item._id]));
  const neighborhoodIds = new Map(
    neighborhoods.map((item) => [item.slug, item._id])
  );

  for (const definition of seedProperties) {
    const { agentSlug, neighborhoodSlug, imageAlts, ...property } = definition;
    const assignedAgent = agentIds.get(agentSlug);
    const neighborhoodRef = neighborhoodIds.get(neighborhoodSlug);
    if (!assignedAgent || !neighborhoodRef) {
      throw new Error(`[seed] Missing relation for property ${definition.slug}.`);
    }

    const images = imageAlts.map((alt, index) => ({
      ...localWebpMedia(
        'properties/' + definition.slug + '-' + (index + 1) + '.webp',
        { width: 1586, height: 992 }
      ),
      alt,
      order: index,
      isFeatured: index === 0,
    }));

    const seedValues = {
      ...property,
      rentPeriod: definition.rentPeriod,
      carpetAreaSqFt: definition.carpetAreaSqFt,
      plotAreaSqFt: definition.plotAreaSqFt,
      images,
      assignedAgent,
      neighborhoodRef,
    };
    const existing = await Property.findOne({ slug: definition.slug });
    if (existing) {
      existing.set(seedValues);
      await existing.save();
    } else {
      await Property.create(seedValues);
    }
  }
}

async function removeLegacyUnapprovedMedia(): Promise<void> {
  const agentSlugs = seedAgents.map((item) => item.slug);
  const neighborhoodSlugs = seedNeighborhoods.map((item) => item.slug);
  const propertySlugs = seedProperties.map((item) => item.slug);
  const unapprovedHost = /^https:\/\/images\.unsplash\.com\//i;

  await Promise.all([
    Agent.updateMany(
      { slug: { $in: agentSlugs }, 'avatar.secureUrl': unapprovedHost },
      { $unset: { avatar: 1 }, $set: { isFeatured: false } }
    ),
    Neighborhood.updateMany(
      { slug: { $in: neighborhoodSlugs }, 'heroMedia.secureUrl': unapprovedHost },
      { $unset: { heroMedia: 1 }, $set: { isPublished: false } }
    ),
    Property.updateMany(
      {
        slug: { $in: propertySlugs },
        $or: [
          { 'images.secureUrl': unapprovedHost },
          { 'floorPlans.secureUrl': unapprovedHost },
        ],
      },
      {
        $pull: {
          images: { secureUrl: unapprovedHost },
          floorPlans: { secureUrl: unapprovedHost },
        },
        $set: { isPublished: false, isFeatured: false },
      }
    ),
  ]);
}

async function main(): Promise<void> {
  try {
    await connectSafely();
    await seedAdmin();
    await seedReferenceRecords();
    await removeLegacyUnapprovedMedia();

    console.log(`[seed] Completed ${SEED_VERSION}.`);
    console.log(
      `[seed] Published illustrative reference data: ${seedProperties.length} properties, ${seedAgents.length} advisors, ${seedNeighborhoods.length} neighborhoods.`
    );
    console.log(
      `[seed] Owned generated assets: ${seedAssetInventory.approvedSiteHeroImages} site hero, ${seedAssetInventory.approvedPropertyImages} property images, ${seedAssetInventory.approvedAgentPortraits} advisor portraits, ${seedAssetInventory.approvedNeighborhoodHeroes} neighborhood heroes.`
    );
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('[seed] Failed:', error);
  process.exitCode = 1;
});
