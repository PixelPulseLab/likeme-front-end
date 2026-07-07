import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import EventBanner from '@/components/sections/community/EventBanner';
import type { EventBannerData } from '@/types/event';

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { host?: string }) => {
      const labels: Record<string, string> = {
        'community.eventBanner.purchaseTitlePrefix': 'Participe da',
        'community.eventBanner.reminderTitlePrefix': 'Não perca a',
        'community.eventBanner.reminderCreated': 'Lembrete criado',
      };
      if (params?.host) {
        return `${key}:${params.host}`;
      }
      return labels[key] ?? key;
    },
  }),
}));

jest.mock('@/components/ui/media/CachedImage', () => ({
  CachedImage: () => null,
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

const baseEvent: EventBannerData = {
  id: 'evt-1',
  title: 'Yoga ao vivo',
  host: 'Dr. Diogo',
  status: 'Scheduled',
  startTime: '2026-06-30T18:00:00.000Z',
  endTime: '2026-06-30T19:00:00.000Z',
  thumbnail: 'https://example.com/thumb.jpg',
  variant: 'purchase',
};

describe('EventBanner (APP-344)', () => {
  it('exibe prefixo de compra + título para usuário não pagante', () => {
    const { getByText } = render(<EventBanner event={{ ...baseEvent, variant: 'purchase' }} onPress={jest.fn()} />);

    expect(getByText('Participe da Yoga ao vivo')).toBeTruthy();
  });

  it('exibe prefixo de lembrete + título para usuário com acesso', () => {
    const { getByText } = render(<EventBanner event={{ ...baseEvent, variant: 'reminder' }} onPress={jest.fn()} />);

    expect(getByText('Não perca a Yoga ao vivo')).toBeTruthy();
  });

  it('exibe data e horário no rodapé do card agendado', () => {
    const { getByText } = render(<EventBanner event={{ ...baseEvent, variant: 'reminder' }} onPress={jest.fn()} />);

    const schedule = getByText(/30\/06\/2026 · \d{2}:\d{2} - \d{2}:\d{2}/);
    expect(schedule).toBeTruthy();
  });

  it('desabilita CTA e mostra Lembrete criado após registro', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EventBanner event={{ ...baseEvent, variant: 'reminder_created' }} onPress={onPress} />,
    );

    expect(getByText('Lembrete criado')).toBeTruthy();
    fireEvent.press(getByText('Lembrete criado'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
