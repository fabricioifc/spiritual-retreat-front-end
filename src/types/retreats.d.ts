interface RetreatPrivacyPolicy {
  title?: string;
  body?: string;
  version?: string;
  publishedAt?: string | null;
}

interface RetreatImage {
  storageId?: string;
  storageKey?: string;
  id?: string | number;
  imageUrl?: string;
  url?: string;
  type?: string;
  order?: number;
  altText?: string;
  title?: string;
}

interface Retreat {
  id: string | number;
  name: string;
  edition: string;
  theme: string;
  shortDescription?: string;
  longDescription?: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  location?: string;
  maleSlots: number;
  femaleSlots: number;
  totalSlots?: number;
  feeFazerAmount?: number;
  feeFazerCurrency?: string;
  feeServirAmount?: number;
  feeServirCurrency?: string;
  /** @deprecated Use feeFazerAmount */
  feeFazer?: number | { amount: number; currency?: string };
  /** @deprecated Use feeServirAmount */
  feeServir?: number | { amount: number; currency?: string };
  contactEmail?: string;
  contactPhone?: string;
  status: string;
  isPubliclyVisible?: boolean;
  publishedAt?: string | null;
  westRegionPct?: number;
  otherRegionPct?: number;
  state?: string;
  stateShort?: string;
  city?: string;
  description?: string;
  capacity?: number;
  enrolled?: number;
  isActive?: boolean;
  images?: Array<string | RetreatImage>;
  instructor?: string;
  image?: string;
  contemplationClosed?: boolean;
  familiesVersion?: number;
  familiesLocked?: boolean;
  serviceSpacesVersion?: number;
  serviceLocked?: boolean;
  tentsVersion?: number;
  tentsLocked?: boolean;
  privacyPolicy?: RetreatPrivacyPolicy | null;
  requiresPrivacyPolicyAcceptance?: boolean;
  emergencyCodes?: unknown[];
  activeEmergencyCodesCount?: number;
  createdAt?: string;
  createdByUserId?: string | null;
  lastModifiedAt?: string | null;
  lastModifiedByUserId?: string | null;
}

interface RetreatLite {
  id: string;
  name: string;
  edition: string;
  startDate: string;
  //2026-03-08
  endDate: string;
}

interface RetreatPost {
  id: number;
  name: {
    value: string;
  };
  edition: string;
  theme: string;
  startDate: string;
  endDate: string;
  maleSlots: number;
  femaleSlots: number;
  registrationStart: string;
  registrationEnd: string;
  feeFazer: {
    amount: number;
    currency: string;
  };
  feeServir: {
    amount: number;
    currency: string;
  };
  westRegionPct: {
    value: number;
  };
  otherRegionPct: {
    value: number;
  };
  state?: string;
  stateShort?: string;
  city?: string;
  description?: string;
  capacity?: number;
  participationTax?: string;
  enrolled?: number;
  location?: string;
  isActive?: boolean;
  images?: Array<string | RetreatImage>;
  status: 'open' | 'closed' | 'running' | 'ended' | 'upcoming';
  instructor?: string;
  image?: string;
}

export interface Participant {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  city: string;
  state: string;
  gender?: 'male' | 'female' | 'other' | 'na';
  registrationDate: string;
  status: 'registered' | 'confirmed' | 'cancelled' | 'attended'; // Status do participante
}
