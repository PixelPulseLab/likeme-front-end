import storageService from './storageService';

async function applyOnboardingTimestamp(
  source: Record<string, unknown>,
  field: 'registerCompletedAt' | 'objectivesSelectedAt' | 'privacyPolicyAcceptedAt',
  persist: (date: string | null) => Promise<void>,
): Promise<void> {
  if (!(field in source)) {
    return;
  }

  const value = source[field];
  await persist(value != null ? String(value) : null);
}

export async function setOnboardingStep(envelope: unknown): Promise<void> {
  if (envelope == null || typeof envelope !== 'object') {
    return;
  }
  const root = envelope as Record<string, unknown>;
  const data = root.data ?? root;
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return;
  }
  const d = data as Record<string, unknown>;
  const nested = d.onboarding;
  const source =
    nested != null && typeof nested === 'object' && !Array.isArray(nested) ? (nested as Record<string, unknown>) : d;

  await Promise.all([
    applyOnboardingTimestamp(source, 'registerCompletedAt', (date) => storageService.setRegisterCompletedAt(date)),
    applyOnboardingTimestamp(source, 'objectivesSelectedAt', (date) => storageService.setObjectivesSelectedAt(date)),
    applyOnboardingTimestamp(source, 'privacyPolicyAcceptedAt', (date) =>
      storageService.setPrivacyPolicyAcceptedAt(date),
    ),
  ]);
}
