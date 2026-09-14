import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AvatarScreen from './index';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const GestureHandler = ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement(View, props, children);
  return {
    PanGestureHandler: GestureHandler,
    PinchGestureHandler: GestureHandler,
    State: { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@/components/ui/media/CachedImage', () => {
  const { View } = require('react-native');
  return {
    CachedImage: () => <View />,
  };
});

jest.mock('@/components/ui/layout', () => {
  const { View } = require('react-native');
  return {
    ScreenWithHeader: ({ children }: { children: unknown }) => <View>{children}</View>,
  };
});

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
}));

describe('AvatarScreen', () => {
  it('mostra o título e os rótulos de mente e corpo', () => {
    const { getByText } = render(
      <AvatarScreen
        navigation={{ canGoBack: () => true, goBack: jest.fn(), addListener: () => () => undefined } as never}
        route={{ key: 'OnboardingAvatar', name: 'OnboardingAvatar' } as never}
      />,
    );

    expect(getByText('invitation.avatarTitle')).toBeTruthy();
    expect(getByText('invitation.avatarSubtitle')).toBeTruthy();
    expect(getByText('invitation.avatarMind')).toBeTruthy();
    expect(getByText('invitation.avatarBody')).toBeTruthy();
  });

  it('abre as bolinhas das categorias ao tocar no avatar', async () => {
    const { getByTestId, getByText } = render(
      <AvatarScreen
        navigation={{ canGoBack: () => true, goBack: jest.fn(), addListener: () => () => undefined } as never}
        route={{ key: 'OnboardingAvatar', name: 'OnboardingAvatar' } as never}
      />,
    );

    fireEvent.press(getByTestId(E2E_TEST_IDS.ONBOARDING_AVATAR_MIND));

    await waitFor(() => {
      expect(getByTestId(E2E_TEST_IDS.ONBOARDING_AVATAR_CATEGORIES)).toBeTruthy();
      expect(getByText('auth.objectiveStress')).toBeTruthy();
      expect(getByText('auth.objectiveRelationship')).toBeTruthy();
      expect(getByText('auth.objectiveNutrition')).toBeTruthy();
    });
  });
});
