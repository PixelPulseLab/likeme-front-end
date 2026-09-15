import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';
import WallScreen from './index';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@/components/ui/media/CachedImage', () => {
  const { View } = require('react-native');
  return { CachedImage: () => <View /> };
});

jest.mock('@/components/ui/layout', () => {
  const { View } = require('react-native');
  return { ScreenWithHeader: ({ children }: { children: unknown }) => <View>{children}</View> };
});

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
}));

jest.mock('@/assets/wall', () => {
  const { View } = require('react-native');
  return {
    WallPortrait: 1,
    WallInstagram: () => <View />,
  };
});

describe('WallScreen', () => {
  it('mostra o tapume, abre os links e volta ao código', () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const navigation = { navigate: jest.fn(), canGoBack: () => false };
    const { getByText, getByTestId } = render(
      <WallScreen navigation={navigation as never} route={{ key: 'Wall', name: 'Wall' } as never} />,
    );

    expect(getByTestId(E2E_TEST_IDS.WALL_ROOT)).toBeTruthy();
    expect(getByText('wall.title')).toBeTruthy();
    expect(getByText('wall.body')).toBeTruthy();

    fireEvent.press(getByText('likeme.global'));
    fireEvent.press(getByText('www.likeme.global'));
    fireEvent.press(getByText('wall.accessCode'));

    expect(openUrl).toHaveBeenCalledWith('https://www.instagram.com/likeme.global');
    expect(openUrl).toHaveBeenCalledWith('https://www.likeme.global');
    expect(navigation.navigate).toHaveBeenCalledWith('InvitationCode');
    openUrl.mockRestore();
  });
});
