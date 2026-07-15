import { isProtocolStepAutoCompleted } from '@/utils/course/protocolStepAutoCompleted';

describe('isProtocolStepAutoCompleted', () => {
  const now = new Date('2026-07-15T15:00:00.000Z');

  it('marca concluído quando updatedAt é anterior à data atual', () => {
    expect(isProtocolStepAutoCompleted('2026-07-14T12:00:00.000Z', now)).toBe(true);
  });

  it('mantém desmarcado quando updatedAt é igual à data atual', () => {
    expect(isProtocolStepAutoCompleted('2026-07-15T15:00:00.000Z', now)).toBe(false);
  });

  it('mantém desmarcado quando updatedAt é futuro', () => {
    expect(isProtocolStepAutoCompleted('2026-07-16T08:00:00.000Z', now)).toBe(false);
  });

  it('mantém desmarcado quando updatedAt é inválido ou ausente', () => {
    expect(isProtocolStepAutoCompleted(null, now)).toBe(false);
    expect(isProtocolStepAutoCompleted('', now)).toBe(false);
    expect(isProtocolStepAutoCompleted('invalid-date', now)).toBe(false);
  });
});
