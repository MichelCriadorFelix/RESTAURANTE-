export type Role = 'admin' | 'user';

export interface User {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressReference?: string;
  lat?: number;
  lng?: number;
  role: Role;
  createdAt: number;
  emailVerified?: boolean;
  cookieConsentAt?: number;
  points?: number;
}

export interface LoyaltyReward {
  id: string;
  pointsCost: number;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  label: string;
}

export interface StepOption {
  id?: string;
  name: string;
  price?: number;
}

export interface CustomizationStep {
  title: string;
  min: number;
  max: number;
  options: StepOption[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  options?: string[]; // Legacy
  priceOption2?: number; // Legacy
  imageUrl?: string;
  customizationSteps?: CustomizationStep[];
  sortOrder?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string; // Legacy
  selectedSize?: '1 item' | '2 itens' | '1 pedaço' | '2 pedaços' | string; // Legacy
  customizationSelections?: { [stepTitle: string]: StepOption[] };
  notes?: string;
  totalPrice: number;
}

export type OrderStatus = 'pending_payment' | 'preparing' | 'delivering' | 'completed' | 'cancelled';

export type ServiceType = 'delivery' | 'pickup' | 'dine_in';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  items: CartItem[];
  total: number;
  deliveryFee?: number;
  serviceType?: ServiceType;
  tableNumber?: string;
  status: OrderStatus;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash';
  receiptUrl?: string;
  createdAt: number;
  updatedAt: number;
  address?: string;
  changeRequested?: boolean;
  changeFor?: number;
  notes?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  rewardApplied?: { id: string; label: string; discountAmount: number };
  pointsCredited?: boolean;
  pointsDebited?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  createdAt: number;
}

export interface FinanceEntry {
  id: string;
  type: 'income' | 'fixed_cost' | 'variable_cost';
  amount: number;
  description: string;
  date: number;
  createdAt: number;
}

export interface DayHours {
  isOpen: boolean;
  openTime: string; // e.g. "11:00"
  closeTime: string; // e.g. "23:00"
}

export interface CompanyInfo {
  name: string;
  phone: string;
  address: string;
  addressZip?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  lat?: number;
  lng?: number;
  pixKey: string;
  pixKeyName: string;
  logoUrl?: string;
  instagramUrl?: string;
  forceClosed?: boolean;
  openingHours?: {
    [key: string]: DayHours;
  };
  deliveryRadiusKm?: number;
  deliveryFee?: number;
  neighborhoodFees?: { name: string; fee: number }[];
  prepTimeEstimate?: string;
  deliveryTimeEstimate?: string;
  loyaltyEnabled?: boolean;
  loyaltySpendPerPoint?: number; // e.g. 10 => every R$10 spent
  loyaltyPointsPerUnit?: number; // e.g. 1 => 1 point per loyaltySpendPerPoint
  loyaltyRewards?: LoyaltyReward[];
}

