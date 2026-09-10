import { render, fireEvent, waitFor } from '@testing-library/react-native';
import UnauthenticatedScreen from './index';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockAuthLogin = jest.fn();
const mockUseFeatureFlag = jest.fn();

jest.mock('@/hooks', () => ({
  useAuthLogin: () => ({
    handleLogin: mockAuthLogin,
    isLoading: false,
  }),
}));

jest.mock('@/hooks/featureFlags/useFeatureFlag', () => ({
  useFeatureFlag: (...args: unknown[]) => mockUseFeatureFlag(...args),
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
  logButtonClick: jest.fn(),
  logNavigation: jest.fn(),
}));

jest.mock('./components', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    UnauthenticatedStep1: ({ onStart }: any) => (
      <View>
        <Text>invitation.headline</Text>
        <TouchableOpacity onPress={onStart}>
          <Text>invitation.start</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

describe('UnauthenticatedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureFlag.mockReturnValue({ isEnabled: false, isLoading: false });
  });

  const mockRoute = { key: 'Unauthenticated', name: 'Unauthenticated' as const, params: {} };

  it('não dispara login sozinho no first launch', async () => {
    render(<UnauthenticatedScreen navigation={mockNavigation} route={mockRoute} />);

    expect(mockAuthLogin).not.toHaveBeenCalled();
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('Começar vai para o login quando a flag de convite está desligada', () => {
    const { getByText } = render(<UnauthenticatedScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.press(getByText('invitation.start'));

    expect(mockAuthLogin).toHaveBeenCalled();
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('Começar vai para InvitationCode quando a flag de convite está ligada', () => {
    mockUseFeatureFlag.mockReturnValue({ isEnabled: true, isLoading: false });
    const { getByText } = render(<UnauthenticatedScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.press(getByText('invitation.start'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('InvitationCode');
    expect(mockAuthLogin).not.toHaveBeenCalled();
  });

  it('dispara login ao chegar com startLogin', async () => {
    render(
      <UnauthenticatedScreen navigation={mockNavigation} route={{ ...mockRoute, params: { startLogin: true } }} />,
    );

    await waitFor(() => {
      expect(mockAuthLogin).toHaveBeenCalled();
    });
  });
});
