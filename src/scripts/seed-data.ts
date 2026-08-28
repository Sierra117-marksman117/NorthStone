import type {
  CompletionStatus,
  FurnishingStatus,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
  RentPeriod,
} from '@/types';

export const SEED_VERSION = 'phase3-v1';

export interface SeedAgentDefinition {
  slug: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  bio: string;
  avatarAlt: string;
  specializations: string[];
  languages: string[];
  experienceYears: number;
  isFeatured: boolean;
  isActive: boolean;
  isIllustrative: true;
}

export interface SeedNeighborhoodDefinition {
  slug: string;
  name: string;
  city: string;
  editorialSummary: string;
  heroAlt: string;
  lifestyleHighlights: string[];
  isPublished: true;
  isIllustrative: true;
  seo: { title: string; description: string };
}

export interface SeedPropertyDefinition {
  slug: string;
  title: string;
  headline: string;
  description: string;
  purpose: PropertyPurpose;
  propertyType: PropertyType;
  status: PropertyStatus;
  isPublished: true;
  isFeatured: boolean;
  isIllustrative: true;
  priceAmount: number;
  currency: 'INR';
  rentPeriod?: RentPeriod;
  bedrooms: number;
  bathrooms: number;
  powderRooms: number;
  builtUpAreaSqFt: number;
  carpetAreaSqFt?: number;
  plotAreaSqFt?: number;
  furnishing: FurnishingStatus;
  completionStatus: CompletionStatus;
  address: {
    line1: string;
    neighborhood: string;
    city: string;
    state: string;
    pincode: string;
  };
  amenities: string[];
  imageAlts: [string, string, string];
  floorPlans: [];
  agentSlug: string;
  neighborhoodSlug: string;
  seo: { title: string; description: string };
}

export const seedAgents: SeedAgentDefinition[] = [
  {
    slug: 'aryan-mehta',
    name: 'Aryan Mehta',
    title: 'Senior Property Advisor',
    email: 'aryan.mehta@northstone.invalid',
    phone: '+91 90000 00001',
    bio: 'Aryan advises buyers seeking architecturally distinctive homes across Mumbai’s coastal districts. His approach is calm, research-led, and focused on matching each brief with a small, considered shortlist.',
    avatarAlt: 'Illustrative portrait of advisor Aryan Mehta',
    specializations: ['Luxury Penthouses', 'Waterfront Residences'],
    languages: ['English', 'Hindi', 'Gujarati'],
    experienceYears: 12,
    isFeatured: true,
    isActive: true,
    isIllustrative: true,
  },
  {
    slug: 'priya-rajan',
    name: 'Priya Rajan',
    title: 'Residential Sales Director',
    email: 'priya.rajan@northstone.invalid',
    phone: '+91 90000 00002',
    bio: 'Priya works with design-conscious buyers and families moving between Mumbai’s established neighbourhoods. She brings a precise understanding of layout, liveability, and long-term value.',
    avatarAlt: 'Illustrative portrait of advisor Priya Rajan',
    specializations: ['Heritage Properties', 'Residential Advisory'],
    languages: ['English', 'Tamil', 'Hindi'],
    experienceYears: 9,
    isFeatured: true,
    isActive: true,
    isIllustrative: true,
  },
  {
    slug: 'vikram-nair',
    name: 'Vikram Nair',
    title: 'Luxury Leasing Specialist',
    email: 'vikram.nair@northstone.invalid',
    phone: '+91 90000 00003',
    bio: 'Vikram specialises in premium leases and carefully managed relocations. He helps clients compare furnished homes, building services, commute patterns, and lease terms without unnecessary noise.',
    avatarAlt: 'Illustrative portrait of advisor Vikram Nair',
    specializations: ['Premium Rentals', 'Relocation Advisory'],
    languages: ['English', 'Malayalam', 'Hindi'],
    experienceYears: 7,
    isFeatured: true,
    isActive: true,
    isIllustrative: true,
  },
  {
    slug: 'nisha-kapoor',
    name: 'Nisha Kapoor',
    title: 'Portfolio and Valuation Advisor',
    email: 'nisha.kapoor@northstone.invalid',
    phone: '+91 90000 00004',
    bio: 'Nisha supports private clients considering high-value purchases, portfolio changes, and indicative valuations. Her advice balances the qualities of an individual home with the wider residential market.',
    avatarAlt: 'Illustrative portrait of advisor Nisha Kapoor',
    specializations: ['Property Valuation', 'Portfolio Advisory'],
    languages: ['English', 'Hindi', 'Punjabi'],
    experienceYears: 11,
    isFeatured: true,
    isActive: true,
    isIllustrative: true,
  },
];

export const seedNeighborhoods: SeedNeighborhoodDefinition[] = [
  {
    slug: 'worli',
    name: 'Worli',
    city: 'Mumbai',
    editorialSummary: 'A waterfront district where contemporary residential towers meet long sea views, established clubs, and direct links to South and Central Mumbai. Worli suits buyers who value scale, service, and a composed urban rhythm.',
    heroAlt: 'Illustrative evening view of the Worli waterfront',
    lifestyleHighlights: ['Sea-facing promenades', 'Landmark dining', 'Central connectivity', 'Private residential clubs'],
    isPublished: true,
    isIllustrative: true,
    seo: { title: 'Properties in Worli | Northstone Realty', description: 'Explore illustrative luxury homes in Worli, Mumbai.' },
  },
  {
    slug: 'bandra-west',
    name: 'Bandra West',
    city: 'Mumbai',
    editorialSummary: 'Leafy lanes, village-scale pockets, independent restaurants, and a lively creative culture give Bandra West its unmistakable character. Homes range from discreet apartments to rare private houses.',
    heroAlt: 'Illustrative leafy residential street in Bandra West',
    lifestyleHighlights: ['Heritage streets', 'Independent cafés', 'Coastal avenues', 'Creative culture'],
    isPublished: true,
    isIllustrative: true,
    seo: { title: 'Properties in Bandra West | Northstone Realty', description: 'Explore illustrative premium homes in Bandra West, Mumbai.' },
  },
  {
    slug: 'lower-parel',
    name: 'Lower Parel',
    city: 'Mumbai',
    editorialSummary: 'A central high-rise district shaped by new architecture, strong transport links, dining, and cultural destinations. It offers full-service urban living within easy reach of the city’s business centres.',
    heroAlt: 'Illustrative architectural skyline of Lower Parel',
    lifestyleHighlights: ['High-rise living', 'Cultural venues', 'Destination dining', 'Central transit'],
    isPublished: true,
    isIllustrative: true,
    seo: { title: 'Properties in Lower Parel | Northstone Realty', description: 'Explore illustrative residences in Lower Parel, Mumbai.' },
  },
  {
    slug: 'juhu',
    name: 'Juhu',
    city: 'Mumbai',
    editorialSummary: 'Juhu combines a relaxed beachfront setting with established residential streets, generous plots, and convenient access to western Mumbai. The area is especially known for private villas and low-density homes.',
    heroAlt: 'Illustrative beachfront landscape in Juhu',
    lifestyleHighlights: ['Beachfront setting', 'Mature residential streets', 'Private gardens', 'Western suburbs access'],
    isPublished: true,
    isIllustrative: true,
    seo: { title: 'Properties in Juhu | Northstone Realty', description: 'Explore illustrative beachfront and private homes in Juhu.' },
  },
];

const commonLocation = { city: 'Mumbai', state: 'Maharashtra' } as const;

export const seedProperties: SeedPropertyDefinition[] = [
  {
    slug: 'sky-pavilion-worli',
    title: 'Sky Pavilion, Worli',
    headline: 'A sculptural triplex composed above the sea.',
    description: 'An expansive triplex pavilion conceived around light, horizon, and privacy. Double-height living spaces open to deep planted terraces, while a private lift connects quiet bedroom suites with a sea-facing entertaining level. Materials remain understated throughout: honed stone, dark timber, and warm bronze.',
    purpose: 'BUY', propertyType: 'PENTHOUSE', status: 'AVAILABLE', isPublished: true, isFeatured: true, isIllustrative: true,
    priceAmount: 250_000_000, currency: 'INR', bedrooms: 5, bathrooms: 6, powderRooms: 2, builtUpAreaSqFt: 9800, carpetAreaSqFt: 7200,
    furnishing: 'FURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Worli Sea Face', neighborhood: 'Worli', ...commonLocation, pincode: '400018' },
    amenities: ['Private lift', 'Sea-facing terrace', 'Reflecting pool', 'Resident lounge', 'Concierge', 'Four-car parking'],
    imageAlts: ['Sky Pavilion exterior at blue hour', 'Sky Pavilion double-height salon', 'Sky Pavilion private sunset terrace'],
    floorPlans: [], agentSlug: 'aryan-mehta', neighborhoodSlug: 'worli',
    seo: { title: 'Sky Pavilion, Worli | Northstone Realty', description: 'An illustrative five-bedroom triplex penthouse in Worli.' },
  },
  {
    slug: 'the-meridian-lower-parel',
    title: 'The Meridian, Lower Parel',
    headline: 'Quiet, full-floor living above the centre of the city.',
    description: 'A full-floor residence with carefully separated entertaining and private wings. Framed skyline views, tailored joinery, and a restrained natural palette create a calm counterpoint to the energy of Lower Parel below.',
    purpose: 'BUY', propertyType: 'APARTMENT', status: 'AVAILABLE', isPublished: true, isFeatured: true, isIllustrative: true,
    priceAmount: 95_000_000, currency: 'INR', bedrooms: 4, bathrooms: 5, powderRooms: 1, builtUpAreaSqFt: 4800, carpetAreaSqFt: 3500,
    furnishing: 'SEMI_FURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Senapati Bapat Marg', neighborhood: 'Lower Parel', ...commonLocation, pincode: '400013' },
    amenities: ['Private lift lobby', 'Resident lounge', 'Gymnasium', 'Temperature-controlled pool', 'Three-car parking'],
    imageAlts: ['The Meridian residential tower', 'The Meridian sunlit living room', 'The Meridian private dining room'],
    floorPlans: [], agentSlug: 'priya-rajan', neighborhoodSlug: 'lower-parel',
    seo: { title: 'The Meridian, Lower Parel | Northstone Realty', description: 'An illustrative four-bedroom full-floor Mumbai residence.' },
  },
  {
    slug: 'seaface-villa-juhu',
    title: 'Seaface Villa, Juhu',
    headline: 'A private coastal house shaped by gardens and light.',
    description: 'Set behind mature planting, this contemporary villa brings the landscape through every level. Generous living rooms open directly to the pool garden, and the upper suites are oriented toward soft coastal light and long evening views.',
    purpose: 'BUY', propertyType: 'VILLA', status: 'UNDER_OFFER', isPublished: true, isFeatured: true, isIllustrative: true,
    priceAmount: 380_000_000, currency: 'INR', bedrooms: 6, bathrooms: 7, powderRooms: 2, builtUpAreaSqFt: 12000, plotAreaSqFt: 16000,
    furnishing: 'FURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Juhu Tara Road', neighborhood: 'Juhu', ...commonLocation, pincode: '400049' },
    amenities: ['Private garden', 'Swimming pool', 'Beach access', 'Home cinema', 'Staff quarters', 'Six-car parking'],
    imageAlts: ['Seaface Villa garden exterior', 'Seaface Villa coastal living room', 'Seaface Villa pool garden at dusk'],
    floorPlans: [], agentSlug: 'aryan-mehta', neighborhoodSlug: 'juhu',
    seo: { title: 'Seaface Villa, Juhu | Northstone Realty', description: 'An illustrative six-bedroom private villa in Juhu.' },
  },
  {
    slug: 'courtyard-villa-bandra-west',
    title: 'Courtyard Villa, Bandra West',
    headline: 'A secluded city house gathered around a living courtyard.',
    description: 'A contemporary Bandra residence arranged around a tall planted court. Brick, timber screens, and warm plaster give the interiors depth, while a roof terrace and flexible studio create room for both private life and generous entertaining.',
    purpose: 'BUY', propertyType: 'VILLA', status: 'AVAILABLE', isPublished: true, isFeatured: true, isIllustrative: true,
    priceAmount: 145_000_000, currency: 'INR', bedrooms: 4, bathrooms: 5, powderRooms: 1, builtUpAreaSqFt: 6100, carpetAreaSqFt: 4700,
    furnishing: 'SEMI_FURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Pali Hill', neighborhood: 'Bandra West', ...commonLocation, pincode: '400050' },
    amenities: ['Internal courtyard', 'Roof terrace', 'Garden studio', 'Private lift', 'Covered parking'],
    imageAlts: ['Courtyard Villa street elevation', 'Courtyard Villa double-height living room', 'Courtyard Villa roof terrace'],
    floorPlans: [], agentSlug: 'priya-rajan', neighborhoodSlug: 'bandra-west',
    seo: { title: 'Courtyard Villa, Bandra West | Northstone Realty', description: 'An illustrative four-bedroom courtyard residence in Bandra West.' },
  },
  {
    slug: 'worli-atelier-residence',
    title: 'Worli Atelier Residence',
    headline: 'A furnished coastal rental with a gallery sensibility.',
    description: 'An elegant furnished residence for clients seeking an immediate, beautifully resolved Mumbai base. Art-led interiors, a sea-facing living room, and a full suite of resident services make day-to-day life exceptionally simple.',
    purpose: 'RENT', propertyType: 'APARTMENT', status: 'AVAILABLE', isPublished: true, isFeatured: true, isIllustrative: true,
    priceAmount: 450_000, currency: 'INR', rentPeriod: 'MONTH', bedrooms: 3, bathrooms: 4, powderRooms: 1, builtUpAreaSqFt: 3300, carpetAreaSqFt: 2500,
    furnishing: 'FURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Dr Annie Besant Road', neighborhood: 'Worli', ...commonLocation, pincode: '400018' },
    amenities: ['Concierge', 'Gymnasium', 'Sea view', 'Housekeeping option', 'Two-car parking'],
    imageAlts: ['Worli Atelier residential tower', 'Worli Atelier art-led living room', 'Worli Atelier sea-facing bedroom'],
    floorPlans: [], agentSlug: 'vikram-nair', neighborhoodSlug: 'worli',
    seo: { title: 'Worli Atelier Residence | Northstone Realty', description: 'An illustrative furnished three-bedroom rental in Worli.' },
  },
  {
    slug: 'crown-estate-juhu',
    title: 'Crown Estate, Juhu',
    headline: 'A rare private compound designed for many generations.',
    description: 'A substantial private estate with a main residence, guest pavilion, and mature landscaped grounds. The architecture favours long shaded volumes and inward-facing courts, creating a composed retreat within easy reach of the city.',
    purpose: 'BUY', propertyType: 'ESTATE', status: 'AVAILABLE', isPublished: true, isFeatured: false, isIllustrative: true,
    priceAmount: 650_000_000, currency: 'INR', bedrooms: 8, bathrooms: 9, powderRooms: 4, builtUpAreaSqFt: 18000, plotAreaSqFt: 25000,
    furnishing: 'FURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Gulmohar Road', neighborhood: 'Juhu', ...commonLocation, pincode: '400049' },
    amenities: ['Private grounds', 'Guest pavilion', 'Swimming pool', 'Library', 'Wellness suite', 'Eight-car parking'],
    imageAlts: ['Crown Estate garden elevation', 'Crown Estate great room', 'Crown Estate guest pavilion'],
    floorPlans: [], agentSlug: 'nisha-kapoor', neighborhoodSlug: 'juhu',
    seo: { title: 'Crown Estate, Juhu | Northstone Realty', description: 'An illustrative eight-bedroom private estate in Juhu.' },
  },
  {
    slug: 'the-townhouse-bandra-west',
    title: 'The Townhouse, Bandra West',
    headline: 'A precise urban home behind a quiet garden wall.',
    description: 'A three-bedroom townhouse balancing privacy with generous entertaining space. Its ground floor opens fully to a planted court, while the roof level provides a shaded terrace for evenings above the neighbourhood.',
    purpose: 'BUY', propertyType: 'TOWNHOUSE', status: 'RESERVED', isPublished: true, isFeatured: false, isIllustrative: true,
    priceAmount: 75_000_000, currency: 'INR', bedrooms: 3, bathrooms: 4, powderRooms: 1, builtUpAreaSqFt: 4200, carpetAreaSqFt: 3000,
    furnishing: 'UNFURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Ranwar Village', neighborhood: 'Bandra West', ...commonLocation, pincode: '400050' },
    amenities: ['Roof terrace', 'Planted court', 'Study', 'Covered parking', 'Solar hot water'],
    imageAlts: ['The Townhouse garden facade', 'The Townhouse courtyard living room', 'The Townhouse roof terrace'],
    floorPlans: [], agentSlug: 'priya-rajan', neighborhoodSlug: 'bandra-west',
    seo: { title: 'The Townhouse, Bandra West | Northstone Realty', description: 'An illustrative contemporary townhouse in Bandra West.' },
  },
  {
    slug: 'worli-seaface-pied-a-terre',
    title: 'Worli Seaface Pied-à-Terre',
    headline: 'A compact coastal residence with a beautifully edited plan.',
    description: 'A refined two-bedroom home conceived as an effortless city base. Every room is proportioned around the view, with custom storage, warm materials, and a flexible study tucked discreetly beside the living space.',
    purpose: 'BUY', propertyType: 'APARTMENT', status: 'AVAILABLE', isPublished: true, isFeatured: false, isIllustrative: true,
    priceAmount: 62_000_000, currency: 'INR', bedrooms: 2, bathrooms: 2, powderRooms: 1, builtUpAreaSqFt: 2100, carpetAreaSqFt: 1550,
    furnishing: 'SEMI_FURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Worli Sea Face', neighborhood: 'Worli', ...commonLocation, pincode: '400018' },
    amenities: ['Sea view', 'Resident lounge', 'Gymnasium', 'Covered parking', 'Concierge'],
    imageAlts: ['Worli Pied-à-Terre tower and sea', 'Worli Pied-à-Terre living space', 'Worli Pied-à-Terre primary suite'],
    floorPlans: [], agentSlug: 'aryan-mehta', neighborhoodSlug: 'worli',
    seo: { title: 'Worli Seaface Pied-à-Terre | Northstone Realty', description: 'An illustrative two-bedroom coastal apartment in Worli.' },
  },
  {
    slug: 'mansion-residences-lower-parel',
    title: 'Mansion Residences, Lower Parel',
    headline: 'House-like scale with a private garden in the sky.',
    description: 'A rare high-rise residence arranged with the scale and sequence of a private house. Formal and informal rooms open to a deep garden terrace, while the bedroom wing remains quiet and distinctly separate.',
    purpose: 'BUY', propertyType: 'MANSION', status: 'AVAILABLE', isPublished: true, isFeatured: false, isIllustrative: true,
    priceAmount: 190_000_000, currency: 'INR', bedrooms: 5, bathrooms: 6, powderRooms: 2, builtUpAreaSqFt: 8500, carpetAreaSqFt: 6200,
    furnishing: 'UNFURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Lower Parel West', neighborhood: 'Lower Parel', ...commonLocation, pincode: '400013' },
    amenities: ['Garden terrace', 'Private lift', 'Library', 'Resident club', 'Four-car parking'],
    imageAlts: ['Mansion Residences tower exterior', 'Mansion Residences formal salon', 'Mansion Residences garden terrace'],
    floorPlans: [], agentSlug: 'nisha-kapoor', neighborhoodSlug: 'lower-parel',
    seo: { title: 'Mansion Residences, Lower Parel | Northstone Realty', description: 'An illustrative five-bedroom garden residence in Lower Parel.' },
  },
  {
    slug: 'bandra-loft-residence',
    title: 'Bandra Loft Residence',
    headline: 'An expressive furnished loft for a flexible city life.',
    description: 'A high-ceilinged two-bedroom rental with a generous open living space and a quiet, tactile material palette. Furnished for immediate occupation, it offers a distinctly individual alternative to a conventional apartment.',
    purpose: 'RENT', propertyType: 'APARTMENT', status: 'AVAILABLE', isPublished: true, isFeatured: false, isIllustrative: true,
    priceAmount: 275_000, currency: 'INR', rentPeriod: 'MONTH', bedrooms: 2, bathrooms: 2, powderRooms: 1, builtUpAreaSqFt: 1900, carpetAreaSqFt: 1450,
    furnishing: 'FURNISHED', completionStatus: 'READY_TO_MOVE',
    address: { line1: 'Turner Road', neighborhood: 'Bandra West', ...commonLocation, pincode: '400050' },
    amenities: ['Double-height living', 'Resident lounge', 'Housekeeping option', 'Covered parking', 'Pet-friendly building'],
    imageAlts: ['Bandra Loft residential building', 'Bandra Loft double-height living space', 'Bandra Loft furnished bedroom'],
    floorPlans: [], agentSlug: 'vikram-nair', neighborhoodSlug: 'bandra-west',
    seo: { title: 'Bandra Loft Residence | Northstone Realty', description: 'An illustrative furnished two-bedroom loft rental in Bandra West.' },
  },
];

export const seedAssetInventory = {
  approvedSiteHeroImages: 1,
  siteHeroImagesRequired: 1,
  propertyCount: seedProperties.length,
  approvedPropertyImages: seedProperties.length * 3,
  minimumPropertyImagesRequired: seedProperties.length * 3,
  approvedAgentPortraits: seedAgents.length,
  agentPortraitsRequired: seedAgents.length,
  approvedNeighborhoodHeroes: seedNeighborhoods.length,
  neighborhoodHeroesRequired: seedNeighborhoods.length,
  approvedFloorPlans: 0,
} as const;
