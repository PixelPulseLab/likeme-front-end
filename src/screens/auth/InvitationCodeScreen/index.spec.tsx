import { fireEvent, render, waitFor } from '@testing-library/react-native';
import InvitationCodeScreen from './index';
import { INVITATION_CODE_VALIDATION_ERROR } from '@/constants/invitation/invitationCodeValidation';

const mockValidateCode = jest.fn();

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');
  const RNTextInput = require('react-native').TextInput;
  return {
    TextInput: ({ placeholder, onChangeText, value, onSubmitEditing, errorText, testID }: any) => (
      <View>
        <RNTextInput
          placeholder={placeholder}
          onChangeText={onChangeText}
          value={value}
          onSubmitEditing={onSubmitEditing}
          testID={testID}
        />
        {errorText ? <Text>{errorText}</Text> : null}
      </View>
    ),
    PrimaryButton: ({ label, onPress, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/ui/layout', () => {
  const { View, ScrollView } = require('react-native');
  return {
    ScreenWithHeader: ({ children }: any) => <View>{children}</View>,
    KeyboardAwareScreen: ({ children, footer }: any) => (
      <View>
        <ScrollView>{children}</ScrollView>
        {footer}
      </View>
    ),
  };
});

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
  logButtonClick: jest.fn(),
  logFormSubmit: jest.fn(),
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
  },
}));

const validContext = {
  code: '7F3K9Q',
  program: { id: 'program-1', name: 'Protocolo', imageUrl: null, programType: 'course' },
  provider: { id: 'provider-1', name: 'Clínica', logoUrl: null },
  community: null,
};

describe('InvitationCodeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não chama a API quando o código está vazio e mostra erro de formulário', async () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(
      <InvitationCodeScreen navigation={navigation as never} route={{ params: undefined } as never} />,
    );

    fireEvent.press(getByText('invitation.enter'));

    expect(getByText('invitation.codeRequired')).toBeTruthy();
    expect(mockValidateCode).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('navega para o contexto do convite quando a validação sucede', async () => {
    mockValidateCode.mockResolvedValue(validContext);
    const navigation = { navigate: jest.fn() };
    const { getByPlaceholderText, getByText } = render(
      <InvitationCodeScreen navigation={navigation as never} route={{ params: undefined } as never} />,
    );

    fireEvent.changeText(getByPlaceholderText('invitation.codePlaceholder'), ' 7F3K9Q ');
    fireEvent.press(getByText('invitation.enter'));

    await waitFor(() => {
      expect(mockValidateCode).toHaveBeenCalledWith('7F3K9Q');
      expect(navigation.navigate).toHaveBeenCalledWith('InvitationContext', validContext);
    });
    expect(getByPlaceholderText('invitation.codePlaceholder').props.value).toBe(' 7F3K9Q ');
  });

  it('permanece na tela e preserva o texto quando a validação recusa o código', async () => {
    mockValidateCode.mockRejectedValue(new Error(INVITATION_CODE_VALIDATION_ERROR.EXPIRED));
    const navigation = { navigate: jest.fn() };
    const { getByPlaceholderText, getByText } = render(
      <InvitationCodeScreen navigation={navigation as never} route={{ params: undefined } as never} />,
    );

    fireEvent.changeText(getByPlaceholderText('invitation.codePlaceholder'), '7F3K9Q');
    fireEvent.press(getByText('invitation.enter'));

    await waitFor(() => {
      expect(getByText('invitation.codeExpired')).toBeTruthy();
    });
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(getByPlaceholderText('invitation.codePlaceholder').props.value).toBe('7F3K9Q');
  });

  it('não oferece áreas de interesse nesta tela', () => {
    const { queryByText } = render(
      <InvitationCodeScreen navigation={{ navigate: jest.fn() } as never} route={{ params: undefined } as never} />,
    );

    expect(queryByText('invitation.notInvitedTitle')).toBeNull();
    expect(queryByText('invitation.interestAreas')).toBeNull();
  });

  it('preenche o campo a partir de route.params.code', () => {
    const { getByPlaceholderText } = render(
      <InvitationCodeScreen
        navigation={{ navigate: jest.fn() } as never}
        route={{ params: { code: 'ABC123' } } as never}
      />,
    );

    expect(getByPlaceholderText('invitation.codePlaceholder').props.value).toBe('ABC123');
  });

  it('permite editar o código preenchido pelo deep link', () => {
    const { getByPlaceholderText } = render(
      <InvitationCodeScreen
        navigation={{ navigate: jest.fn() } as never}
        route={{ params: { code: '7F3K9Q' } } as never}
      />,
    );

    fireEvent.changeText(getByPlaceholderText('invitation.codePlaceholder'), 'EDIT12');
    expect(getByPlaceholderText('invitation.codePlaceholder').props.value).toBe('EDIT12');
  });
});
