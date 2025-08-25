export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  workingHours: string;
}

export interface SocialLinks {
  telegram: string;
  facebook: string;
  instagram: string;
}

export type Language = 'ru' | 'sk' | 'en';
export type Theme = 'light' | 'dark';