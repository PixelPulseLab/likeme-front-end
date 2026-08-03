import { useCallback } from 'react';
import { userService, personsService, storageService, AuthService } from '@/services';
import type { PersonWithContacts } from '@/services/user/userService';
import type { PersonResponse } from '@/types/person';
import { formatPhone } from '@/utils/formatters/inputFormatters';
import { isoToBirthdateMask } from '@/utils/formatters/personFormats';
import { logger } from '@/utils/logger';

/** Dados da pessoa no formato do formulário de registro (para preencher campos). */
export interface PersonFormData {
  fullName: string;
  birthdate: string;
  gender: string;
  weight: string;
  height: string;
  phone: string;
}

/** Converte valor de peso/altura da API (number ou string) para string do formulário (vírgula decimal). */
function toFormNumber(value: unknown): string {
  if (value === undefined || value === null) return '';
  const s = typeof value === 'number' ? String(value) : String(value).trim();
  if (s === '') return '';
  return s.replace('.', ',');
}

function phoneFromPersonContacts(person: PersonWithContacts | PersonResponse): string {
  const contacts = person.contacts;
  if (!contacts?.length) return '';
  const phoneContact = contacts.find((contact) => {
    if (contact.type !== 'phone') return false;
    const deletedAt = (contact as { deletedAt?: string | null }).deletedAt;
    return deletedAt == null;
  });
  const raw = phoneContact?.value?.trim() ?? '';
  return raw ? formatPhone(raw) : '';
}

function mapPersonToFormData(person: PersonWithContacts | PersonResponse): PersonFormData {
  const nameParts = [person.firstName, person.lastName].filter(Boolean) as string[];
  const fullName = nameParts.join(' ');

  const birthdate =
    person.birthdate != null && String(person.birthdate).trim()
      ? isoToBirthdateMask(String(person.birthdate).trim())
      : '';

  const gender =
    person.gender !== undefined && person.gender !== null && String(person.gender).trim()
      ? String(person.gender).trim()
      : '';

  const weight = toFormNumber(person.weight);
  const height = toFormNumber(person.height);
  const phone = phoneFromPersonContacts(person);

  return { fullName, birthdate, gender, weight, height, phone };
}

function emptyPersonFormData(fallbackName = ''): PersonFormData {
  return {
    fullName: fallbackName.trim(),
    birthdate: '',
    gender: '',
    weight: '',
    height: '',
    phone: '',
  };
}

/**
 * Hook do domínio person: carrega dados do perfil para preencher o formulário de registro.
 * Usa GET /api/auth/profile; quando há person.id, complementa com GET /api/persons/:id.
 */
export function useLoadPersonalData() {
  const loadPersonalData = useCallback(async (): Promise<PersonFormData | null> => {
    try {
      const token = await storageService.getToken();
      if (!token) {
        logger.warn('[useLoadPersonalData] token ausente no storage');
        return null;
      }

      const refresh = await AuthService.refreshBackendSessionFromStoredCredentials();
      if (!refresh.ok) {
        logger.warn('[useLoadPersonalData] refresh de sessão não confirmado; tentando perfil com token atual');
      }

      const response = await userService.getProfile();
      if (!response.success || !response.data) {
        logger.warn('[useLoadPersonalData] GET /api/auth/profile sem dados utilizáveis', {
          success: response.success,
        });
        return null;
      }

      const profile = response.data;
      const profilePerson = profile.person;

      if (!profilePerson) {
        return emptyPersonFormData(profile.name);
      }

      if (profilePerson.id) {
        const fullPerson = await personsService.getPerson(profilePerson.id);
        if (fullPerson) {
          return mapPersonToFormData(fullPerson);
        }
        logger.warn('[useLoadPersonalData] GET /api/persons/:id indisponível; usando person do perfil', {
          personId: profilePerson.id,
        });
      }

      return mapPersonToFormData(profilePerson);
    } catch (error) {
      logger.error('[useLoadPersonalData] falha ao carregar dados pessoais', { cause: error });
      return null;
    }
  }, []);

  return { loadPersonalData };
}
