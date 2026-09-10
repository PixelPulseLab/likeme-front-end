import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import InvitationContextScreen from './index';
import { INVITATION_CODE_VALIDATION_ERROR } from '@/constants/invitation/invitationCodeValidation';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

const mockValidateCode = jest.fn();
const mockActivateCode = jest.fn();
const mockSetPendingInvitationCode = jest.fn();
const mockAuthLogin = jest.fn();

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('@/assets/auth', () => ({
  InvitationContextBackground: 'InvitationContextBackground',
}));

jest.mock('@/components/ui/media/CachedImage', () => {
  const { View } = require('react-native');
  return {
    CachedImage: () => <View />,
  };
});

jest.mock('@/components/ui', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return {
    PrimaryButton: ({ label, onPress, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/ui/layout', () => {
  const { View, ScrollView, TouchableOpacity, Text } = require('react-native');
  return {
    ScreenWithHeader: ({ children, headerProps }: any) => (
      <View>
        <TouchableOpacity testID='e2e.invitation.contextBack' onPress={headerProps?.onBackPress}>
          <Text>back</Text>
        </TouchableOpacity>
        {children}
      </View>
    ),
    KeyboardAwareScreen: ({ children, footer }: any) => (
      <View>
        <ScrollView>{children}</ScrollView>
        {footer}
      </View>
    ),
  };
});

jest.mock('@/hooks', () => ({
  useAuthLogin: () => ({
    handleLogin: mockAuthLogin,
    isLoading: false,
  }),
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
  logButtonClick: jest.fn(),
  logNavigation: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/services/invitation/invitationService', () => ({
  invitationService: {
    validateCode: (...args: unknown[]) => mockValidateCode(...args),
    activateCode: (...args: unknown[]) => mockActivateCode(...args),
  },
}));

jest.mock('@/services', () => ({
  storageService: {
    setPendingInvitationCode: (...args: unknown[]) => mockSetPendingInvitationCode(...args),
  },
}));

const validContext = {
  code: '7F3K9Q',
  program: { id: 'program-1', name: 'Protocolo', imageUrl: 'https://cdn.example/program.jpg', programType: 'course' },
  provider: { id: 'provider-1', name: 'Clínica', logoUrl: 'https://cdn.example/logo.jpg' },
  community: { id: 'community-1', displayName: 'Movimento', imageUrl: null },
};

describe('InvitationContextScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockValidateCode.mockResolvedValue(validContext);
    mockSetPendingInvitationCode.mockResolvedValue(undefined);
    mockAuthLogin.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mostra programa, provider e comunidade do payload validado', () => {
    const { getAllByText, getByText, queryByText } = render(
      <InvitationContextScreen
        navigation={{ navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true } as never}
        route={{ params: validContext } as never}
      />,
    );

    expect(getByText('invitation.congratulations')).toBeTruthy();
    expect(getByText('invitation.accessGranted')).toBeTruthy();
    expect(getAllByText('Protocolo').length).toBeGreaterThan(0);
    expect(getAllByText('Clínica').length).toBeGreaterThan(0);
    expect(getByText('marketplace.productCatalogType.program')).toBeTruthy();
    expect(getByText('invitation.login')).toBeTruthy();
    expect(queryByText('Bailarina')).toBeNull();
    expect(queryByText('5')).toBeNull();
  });

  it('usa o placeholder da home quando o programa não tem imagem', () => {
    const { getAllByText } = render(
      <InvitationContextScreen
        navigation={{ navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true } as never}
        route={{ params: { ...validContext, program: { ...validContext.program, imageUrl: null } } as never } as never}
      />,
    );

    expect(getAllByText('Protocolo').length).toBeGreaterThan(0);
  });

  it('mostra a tag de programa mesmo sem comunidade no convite', () => {
    const { getByText, queryByText } = render(
      <InvitationContextScreen
        navigation={{ navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true } as never}
        route={{ params: { ...validContext, community: null } } as never}
      />,
    );

    expect(getByText('marketplace.productCatalogType.program')).toBeTruthy();
    expect(queryByText('Movimento')).toBeNull();
  });

  it('guarda o código e segue para o Auth0 sem ativar o convite', async () => {
    const navigation = { navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true };
    const { getByTestId } = render(
      <InvitationContextScreen navigation={navigation as never} route={{ params: validContext } as never} />,
    );

    fireEvent.press(getByTestId(E2E_TEST_IDS.INVITATION_CONTEXT_CONTINUE));

    await waitFor(() => {
      expect(mockValidateCode).toHaveBeenCalledWith('7F3K9Q');
      expect(mockSetPendingInvitationCode).toHaveBeenCalledWith('7F3K9Q');
      expect(mockAuthLogin).toHaveBeenCalled();
    });
    expect(navigation.navigate).not.toHaveBeenCalledWith('Unauthenticated', { startLogin: true });
    expect(mockActivateCode).not.toHaveBeenCalled();
  });

  it('não avança e volta para o código quando a revalidação recusa o convite', async () => {
    mockValidateCode.mockRejectedValue(new Error(INVITATION_CODE_VALIDATION_ERROR.EXPIRED));
    const navigation = { navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true };
    const { getByTestId } = render(
      <InvitationContextScreen navigation={navigation as never} route={{ params: validContext } as never} />,
    );

    fireEvent.press(getByTestId(E2E_TEST_IDS.INVITATION_CONTEXT_CONTINUE));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('invitation.codeExpired');
      expect(navigation.navigate).toHaveBeenCalledWith('InvitationCode', { code: '7F3K9Q' });
    });
    expect(mockSetPendingInvitationCode).not.toHaveBeenCalled();
    expect(mockActivateCode).not.toHaveBeenCalled();
    expect(mockAuthLogin).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalledWith('Unauthenticated');
  });

  it('volta para a tela de código pelo header', () => {
    const navigation = { navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true };
    const { getByTestId } = render(
      <InvitationContextScreen navigation={navigation as never} route={{ params: validContext } as never} />,
    );

    fireEvent.press(getByTestId('e2e.invitation.contextBack'));

    expect(navigation.goBack).toHaveBeenCalled();
    expect(mockValidateCode).not.toHaveBeenCalled();
    expect(mockActivateCode).not.toHaveBeenCalled();
  });

  it('mostra erro e não oferece continuar quando o contexto da rota é inválido', () => {
    const navigation = { navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true };
    const { getByText, queryByTestId } = render(
      <InvitationContextScreen navigation={navigation as never} route={{ params: { code: '' } as never } as never} />,
    );

    expect(getByText('invitation.contextUnavailable')).toBeTruthy();
    expect(queryByTestId(E2E_TEST_IDS.INVITATION_CONTEXT_CONTINUE)).toBeNull();
    expect(mockValidateCode).not.toHaveBeenCalled();
  });
});
