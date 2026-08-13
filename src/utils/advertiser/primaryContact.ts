import type { Contact } from '@/types/contact';
import { resolveAdvertiserContactUrl, type ResolveAdvertiserContactUrlOptions } from '@/utils/advertiser/contactUrl';

export type PrimaryContactLink = {
  contact: Contact;
  url: string;
};

function contactWithResolvableUrl(
  contact: Contact,
  options?: ResolveAdvertiserContactUrlOptions,
): PrimaryContactLink | null {
  const url = resolveAdvertiserContactUrl(contact, options);
  if (!url) {
    return null;
  }
  return { contact, url };
}

/** Canal do CTA: `isPrincipal` com URL válida; senão o primeiro contato resolvível. */
export function primaryContactLink(
  contacts: Contact[] | undefined,
  options?: ResolveAdvertiserContactUrlOptions,
): PrimaryContactLink | null {
  const list = contacts ?? [];
  const principal = list.find((contact) => contact.isPrincipal === true);
  if (principal) {
    const linked = contactWithResolvableUrl(principal, options);
    if (linked) {
      return linked;
    }
  }

  for (const contact of list) {
    const linked = contactWithResolvableUrl(contact, options);
    if (linked) {
      return linked;
    }
  }
  return null;
}
