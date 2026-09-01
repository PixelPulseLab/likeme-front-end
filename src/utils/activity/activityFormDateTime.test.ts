import { activityDateValueFromYmd, activityTimeValueFromAmPm } from './activityFormDateTime';

describe('activityDateValueFromYmd', () => {
  it('interpreta YYYY-MM-DD como data de calendario local', () => {
    const date = activityDateValueFromYmd('2026-08-15');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
  });

  it('usa fallback para data invalida', () => {
    const fallback = new Date(2026, 0, 2, 10, 30);
    const date = activityDateValueFromYmd('2026-13-40', fallback);

    expect(date.getTime()).toBe(fallback.getTime());
  });
});

describe('activityTimeValueFromAmPm', () => {
  it('interpreta PM maiusculo como horario da tarde', () => {
    const date = activityTimeValueFromAmPm('3:00 PM', new Date(2026, 0, 1));

    expect(date.getHours()).toBe(15);
    expect(date.getMinutes()).toBe(0);
  });

  it('interpreta 12 AM como meia-noite', () => {
    const date = activityTimeValueFromAmPm('12:30 AM', new Date(2026, 0, 1));

    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(30);
  });
});
