/** Alinhado ao enum `ContactType` do backend (Prisma). */
export type ContactType = 'phone' | 'instagram' | 'whatsapp' | 'email' | 'website' | 'address' | 'billing_address';

export interface Contact {
  id?: string;
  type: ContactType;
  value: string;
  isPrincipal?: boolean;
}
