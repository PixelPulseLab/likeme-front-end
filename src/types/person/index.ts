import type { Contact } from '@/types/contact';

export interface PersonData {
  firstName: string;
  lastName: string;
  surname?: string;
  nationalRegistration?: string;
  birthdate?: string;
  gender?: string;
  age?: string;
  weight?: string;
  height?: string;
  insurance?: string;
  phone?: string;
}

export interface PersonResponse {
  id: string;
  firstName: string;
  lastName: string;
  surname?: string;
  nationalRegistration?: string;
  birthdate?: string;
  gender?: string;
  age?: string;
  weight?: string;
  height?: string;
  insurance?: string;
  contacts?: Array<Contact & { id?: string; deletedAt?: string | null }>;
  createdAt: string;
  updatedAt: string;
}
