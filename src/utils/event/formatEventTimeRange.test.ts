import { formatEventTime, formatEventScheduleLabel, formatEventTimeRange } from '@/utils/event/formatEventTimeRange';

describe('formatEventTime', () => {
  it('retorna vazio quando valor vem vazio', () => {
    expect(formatEventTime('')).toBe('');
    expect(formatEventTime('   ')).toBe('');
  });

  it('formata data ISO para HH:mm', () => {
    expect(formatEventTime('2026-05-08T14:35:00.000Z')).toMatch(/^\d{2}:\d{2}$/);
  });

  it('mantém valor bruto quando não é date parseável', () => {
    expect(formatEventTime('14h35')).toBe('14h35');
  });
});

describe('formatEventTimeRange', () => {
  it('retorna intervalo quando há start e end', () => {
    const out = formatEventTimeRange('2026-05-08T14:00:00.000Z', '2026-05-08T15:30:00.000Z');
    expect(out).toMatch(/^\d{2}:\d{2} - \d{2}:\d{2}$/);
  });

  it('retorna só start quando end não existe', () => {
    const out = formatEventTimeRange('2026-05-08T14:00:00.000Z', '');
    expect(out).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('formatEventScheduleLabel', () => {
  it('inclui data e horário no rodapé', () => {
    const out = formatEventScheduleLabel('2026-05-08T14:00:00.000Z', '2026-05-08T15:30:00.000Z');
    expect(out).toMatch(/08\/05\/2026/);
    expect(out).toContain('·');
    expect(out).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
  });
});
