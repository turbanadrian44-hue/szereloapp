export type ClientStatus = 'ACTIVE' | 'FINISHED';
export type SmsType = 'DIAGNOSIS' | 'FINISHED' | 'START';
export type TextureType = 'none' | 'carbon' | 'metal';

export interface ThemeConfig {
  name: string;
  bg: string;
  text: string;
  border: string;
  light: string;
  hover: string;
  ring: string;
  shadow: string;
}

export interface ClientData {
  id: string;
  name: string;
  licensePlate: string;
  phone: string;
  photos: PhotoEvidence[];
  status: ClientStatus;
  createdAt: number;
  isUrgent: boolean;
  gdprAccepted: boolean;
  estimatedCost?: number;
  laborCost?: number; 
  partsCost?: number; 
  useBreakdown?: boolean; 
}

export interface PhotoEvidence {
  id: string;
  url: string;
  cloudUrl?: string;
  source: 'CAMERA' | 'GALLERY';
  status: 'PENDING_UPLOAD' | 'UPLOADED' | 'ERROR';
}

export interface ShopSettings {
  shopName: string;
  themeColor: string;
  logoUrl?: string;
  darkMode: boolean;
  texture: TextureType;
  clientCountSinceBackup: number;
  isPro: boolean; 
}

export type ViewState = 'ONBOARDING' | 'DASHBOARD' | 'INTAKE' | 'WORKSHOP';