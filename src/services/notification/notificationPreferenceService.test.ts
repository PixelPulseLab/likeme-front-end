import {
  emptyPreferencesForm,
  preferencesFormFromRows,
  upsertPayloadsForCategory,
} from './notificationPreferenceService';

describe('notificationPreferenceService form', () => {
  it('usa defaults com categoria ligada e canal obrigatório selecionado', () => {
    const form = emptyPreferencesForm();

    expect(form.offers.enabled).toBe(true);
    expect(form.offers.channels.email).toBe(true);
    expect(form.offers.channels.whatsapp).toBe(false);
    expect(form.activities.channels.push).toBe(true);
    expect(form.activities.leadTimeMinutes).toBe(30);
    expect(form.transactions.preferredTime).toBe('no_preferred');
  });

  it('liga a categoria quando qualquer canal está ativo e mantém o obrigatório', () => {
    const form = preferencesFormFromRows([
      { category: 'offers', channel: 'email', status: 'active', preferredTime: 'morning' },
      { category: 'offers', channel: 'whatsapp', status: 'active', preferredTime: 'morning' },
      { category: 'offers', channel: 'push', status: 'inactive', preferredTime: 'morning' },
    ]);

    expect(form.offers.enabled).toBe(true);
    expect(form.offers.channels).toEqual({ email: true, whatsapp: true, push: false });
    expect(form.offers.preferredTime).toBe('morning');
  });

  it('desliga a categoria quando todos os canais estão inativos', () => {
    const form = preferencesFormFromRows([
      { category: 'activities', channel: 'push', status: 'inactive', leadTimeMinutes: 10 },
      { category: 'activities', channel: 'email', status: 'inactive', leadTimeMinutes: 10 },
    ]);

    expect(form.activities.enabled).toBe(false);
    expect(form.activities.channels.push).toBe(true);
    expect(form.activities.leadTimeMinutes).toBe(10);
  });

  it('gera upserts inativos para todos os canais quando a categoria está desligada', () => {
    expect(upsertPayloadsForCategory({ ...emptyPreferencesForm().offers, enabled: false })).toEqual([
      {
        category: 'offers',
        channel: 'email',
        status: 'inactive',
        preferredTime: 'no_preferred',
        leadTimeMinutes: null,
      },
      {
        category: 'offers',
        channel: 'whatsapp',
        status: 'inactive',
        preferredTime: 'no_preferred',
        leadTimeMinutes: null,
      },
      {
        category: 'offers',
        channel: 'push',
        status: 'inactive',
        preferredTime: 'no_preferred',
        leadTimeMinutes: null,
      },
    ]);
  });

  it('não desmarca o canal obrigatório no upsert', () => {
    const payloads = upsertPayloadsForCategory({
      ...emptyPreferencesForm().offers,
      channels: { email: false, whatsapp: true, push: false },
    });

    expect(payloads.find((payload) => payload.channel === 'email')?.status).toBe('active');
    expect(payloads.find((payload) => payload.channel === 'whatsapp')?.status).toBe('active');
  });
});
