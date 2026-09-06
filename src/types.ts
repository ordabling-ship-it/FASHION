export type GarmentCategory = 
  | 'Sukienki'
  | 'Kurtki i Płaszcze'
  | 'Koszule i Bluzki'
  | 'Bluzy i Swetry'
  | 'Spodnie i Spódnice'
  | 'Garnitury i Marynarki';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'One Size';

export type GarmentCondition = 
  | 'Nowy z metką'
  | 'Nowy bez metki'
  | 'Bardzo dobry'
  | 'Dobry';

export type ModelArchetype = 
  | 'female_studio'
  | 'female_runway'
  | 'female_street'
  | 'male_street'
  | 'male_casual'
  | 'male_editorial';

export type ReelMotionStyle = 
  | 'runway_walk'
  | 'spin_360'
  | 'slowmo_cinematic'
  | 'urban_street';

export interface ProductItem {
  id: string;
  title: string;
  description: string;
  pricePln: number;
  size: ClothingSize;
  category: GarmentCategory;
  condition: GarmentCondition;
  brand: string;
  originalGarmentPhotoUrl: string;
  tryOnPhotoUrl: string;
  reelVideoUrl: string;
  reelPosterUrl: string;
  tags: string[];
  createdAt: string;
  modelArchetype: ModelArchetype;
  motionStyle: ReelMotionStyle;
  vintedListing?: {
    id: string;
    url: string;
    status: 'synced' | 'pending' | 'failed';
    views: number;
  };
  olxListing?: {
    id: string;
    url: string;
    status: 'synced' | 'pending' | 'failed';
    views: number;
  };
}

export interface TryOnGenerationConfig {
  garmentImageUrl: string;
  title: string;
  description: string;
  pricePln: number;
  size: ClothingSize;
  category: GarmentCategory;
  condition: GarmentCondition;
  brand: string;
  modelArchetype: ModelArchetype;
  motionStyle: ReelMotionStyle;
  aiProvider: 'fal_ai' | 'replicate' | 'kling_ai' | 'auto';
}

export interface GenerationStepStatus {
  step: number;
  totalSteps: number;
  label: string;
  detail: string;
  progressPercent: number;
  completed: boolean;
}

export interface StripeCheckoutOptions {
  productId: string;
  productTitle: string;
  amountPln: number;
  paymentMethod: 'blik' | 'apple_pay' | 'card';
  blikCode?: string;
  customerEmail?: string;
  shippingAddress?: {
    name: string;
    phone: string;
    paczkomatId?: string;
    addressLine?: string;
    city?: string;
    postalCode?: string;
  };
}

export interface MarketplaceSyncStatus {
  platform: 'vinted' | 'olx';
  status: 'idle' | 'running' | 'success' | 'failed';
  itemUrl?: string;
  listingId?: string;
  logs: string[];
  durationMs?: number;
}
