import { primaryContactLink } from './primaryContact';

describe('primaryContactLink', () => {
  it('prioriza o contato com isPrincipal quando a URL é resolvível', () => {
    const result = primaryContactLink([
      { type: 'email', value: 'a@b.com' },
      { type: 'whatsapp', value: '5511999999999', isPrincipal: true },
    ]);

    expect(result?.contact.type).toBe('whatsapp');
    expect(result?.url).toContain('wa.me');
  });

  it('usa o primeiro contato resolvível quando nenhum é principal', () => {
    const result = primaryContactLink([
      { type: 'whatsapp', value: '5511999999999' },
      { type: 'email', value: 'a@b.com' },
    ]);

    expect(result?.contact.type).toBe('whatsapp');
    expect(result?.url).toContain('wa.me');
  });

  it('pula contato principal sem valor e usa o próximo resolvível', () => {
    const result = primaryContactLink([
      { type: 'whatsapp', value: '   ', isPrincipal: true },
      { type: 'email', value: 'contato@servico.com' },
    ]);

    expect(result?.contact.type).toBe('email');
    expect(result?.url).toBe('mailto:contato@servico.com');
  });

  it('retorna null quando não há canal utilizável', () => {
    expect(primaryContactLink([])).toBeNull();
    expect(primaryContactLink(undefined)).toBeNull();
  });
});
