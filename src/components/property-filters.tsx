'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { validatePropertyPriceFilters } from '@/lib/property-filter-validation';
import type { PropertyPurpose, PropertyType } from '@/types';
import type { PropertySort, PublicNeighborhoodCard } from '@/types/public';

export function PropertyFilters({
  neighborhoods,
  initial,
}: {
  neighborhoods: PublicNeighborhoodCard[];
  initial: {
    purpose?: PropertyPurpose;
    neighborhood?: string;
    propertyType?: PropertyType;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: number;
    sort: PropertySort;
  };
}) {
  const [purpose, setPurpose] = useState<PropertyPurpose | ''>(
    initial.purpose ?? ''
  );
  const [minPrice, setMinPrice] = useState(
    initial.minPrice ?? ''
  );
  const [maxPrice, setMaxPrice] = useState(
    initial.maxPrice ?? ''
  );
  const purposeRef = useRef<HTMLSelectElement>(null);
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const errors = validatePropertyPriceFilters({
    purpose,
    minPrice,
    maxPrice,
  });
  const hasErrors = Object.keys(errors).length > 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    if (!hasErrors) return;
    event.preventDefault();
    if (errors.purpose) purposeRef.current?.focus();
    else if (errors.minPrice) minRef.current?.focus();
    else maxRef.current?.focus();
  }

  return (
    <form action="/properties" method="get" onSubmit={submit} noValidate>
      <div className="filter-heading"><h2>Refine</h2><Link href="/properties">Clear</Link></div>
      <label className={errors.purpose ? 'is-invalid' : ''}>
        <span>Buy or rent</span>
        <select
          ref={purposeRef}
          name="purpose"
          value={purpose}
          onChange={(event) => setPurpose(event.target.value as PropertyPurpose | '')}
          aria-invalid={Boolean(errors.purpose)}
          aria-describedby={errors.purpose ? 'purpose-price-error' : undefined}
        >
          <option value="">All</option><option value="BUY">Buy</option><option value="RENT">Rent</option>
        </select>
        {errors.purpose ? <small id="purpose-price-error" className="filter-error">{errors.purpose}</small> : null}
      </label>
      <label><span>Neighborhood</span><select name="neighborhood" defaultValue={initial.neighborhood ?? ''}><option value="">All locations</option>{neighborhoods.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
      <label><span>Property type</span><select name="propertyType" defaultValue={initial.propertyType ?? ''}><option value="">All types</option><option value="APARTMENT">Apartment</option><option value="PENTHOUSE">Penthouse</option><option value="VILLA">Villa</option><option value="ESTATE">Estate</option><option value="MANSION">Mansion residence</option><option value="TOWNHOUSE">Townhouse</option></select></label>
      <div className="filter-pair">
        <label className={errors.minPrice ? 'is-invalid' : ''}>
          <span>Minimum price</span>
          <input
            ref={minRef}
            name="minPrice"
            type="number"
            min="0"
            step="1"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="₹ minimum"
            aria-invalid={Boolean(errors.minPrice)}
            aria-describedby={errors.minPrice ? 'minimum-price-error' : undefined}
          />
          {errors.minPrice ? <small id="minimum-price-error" className="filter-error">{errors.minPrice}</small> : null}
        </label>
        <label className={errors.maxPrice ? 'is-invalid' : ''}>
          <span>Maximum price</span>
          <input
            ref={maxRef}
            name="maxPrice"
            type="number"
            min="0"
            step="1"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="₹ maximum"
            aria-invalid={Boolean(errors.maxPrice)}
            aria-describedby={errors.maxPrice ? 'maximum-price-error' : undefined}
          />
          {errors.maxPrice ? <small id="maximum-price-error" className="filter-error">{errors.maxPrice}</small> : null}
        </label>
      </div>
      <label><span>Bedrooms</span><select name="bedrooms" defaultValue={initial.bedrooms?.toString() ?? ''}><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5+</option></select></label>
      <label><span>Sort by</span><select name="sort" defaultValue={initial.sort}><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
      <button type="submit">Show properties</button>
      <p className="filter-validation-summary" aria-live="polite">
        {hasErrors ? 'Correct the highlighted price filters before searching.' : ''}
      </p>
    </form>
  );
}
