import assert from 'node:assert/strict';
import {
  createPreviewSeed,
  getPreviewMetrics,
  hasPreviewVisitConflict,
} from '@/lib/preview-data';
import {
  BUY_MINIMUM_PRICE,
  RENT_MINIMUM_PRICE,
  validatePropertyPriceFilters,
} from '@/lib/property-filter-validation';
import { PREVIEW_STORAGE_KEY } from '@/types/preview';

let passed = 0;

function test(name: string, assertion: () => void) {
  assertion();
  passed += 1;
  console.log(`✓ ${name}`);
}

const seed = createPreviewSeed();

test('preview store uses the versioned NORTHSTONE namespace', () => {
  assert.equal(PREVIEW_STORAGE_KEY, 'northstone_preview_v1');
  assert.equal(seed.version, 1);
});

test('preview seed contains one central cross-experience dataset', () => {
  assert.equal(seed.properties.length, 10);
  assert.ok(seed.agents.length > 0);
  assert.ok(seed.leads.length > 0);
  assert.ok(seed.visits.length > 0);
});

test('preview metrics are derived from their underlying records', () => {
  const metrics = getPreviewMetrics(seed);
  assert.equal(
    metrics.publishedProperties,
    seed.properties.filter((property) => property.published).length
  );
  assert.equal(
    metrics.newEnquiries,
    seed.leads.filter((lead) => lead.status === 'NEW').length
  );
  assert.equal(metrics.savedProperties, seed.savedPropertyIds.length);
});

test('occupied canonical visit slots report a conflict', () => {
  const occupied = seed.visits.find((visit) => visit.status === 'CONFIRMED');
  assert.ok(occupied);
  assert.equal(
    hasPreviewVisitConflict(seed.visits, occupied.date, occupied.timeSlot),
    true
  );
  assert.equal(
    hasPreviewVisitConflict(
      seed.visits,
      occupied.date,
      occupied.timeSlot,
      occupied.id
    ),
    false
  );
});

test('blank property prices remain valid', () => {
  assert.deepEqual(
    validatePropertyPriceFilters({ purpose: '', minPrice: '', maxPrice: '' }),
    {}
  );
});

test('exact rent and purchase price floors are valid', () => {
  assert.deepEqual(
    validatePropertyPriceFilters({
      purpose: 'RENT',
      minPrice: String(RENT_MINIMUM_PRICE),
      maxPrice: '',
    }),
    {}
  );
  assert.deepEqual(
    validatePropertyPriceFilters({
      purpose: 'BUY',
      minPrice: String(BUY_MINIMUM_PRICE),
      maxPrice: '',
    }),
    {}
  );
});

test('₹4,999 rent and ₹14,99,999 purchase are rejected', () => {
  assert.ok(
    validatePropertyPriceFilters({
      purpose: 'RENT',
      minPrice: '4999',
      maxPrice: '',
    }).minPrice
  );
  assert.ok(
    validatePropertyPriceFilters({
      purpose: 'BUY',
      minPrice: '1499999',
      maxPrice: '',
    }).minPrice
  );
});

test('maximum price must be strictly greater than minimum price', () => {
  assert.ok(
    validatePropertyPriceFilters({
      purpose: 'RENT',
      minPrice: '5000',
      maxPrice: '5000',
    }).maxPrice
  );
  assert.deepEqual(
    validatePropertyPriceFilters({
      purpose: 'RENT',
      minPrice: '5000',
      maxPrice: '5001',
    }),
    {}
  );
});

test('price filters require an explicit Buy or Rent choice', () => {
  const errors = validatePropertyPriceFilters({
    purpose: '',
    minPrice: '5000',
    maxPrice: '10000',
  });
  assert.ok(errors.purpose);
  assert.ok(errors.minPrice);
  assert.ok(errors.maxPrice);
});

console.log(`\n${passed} preview assertions passed.`);
