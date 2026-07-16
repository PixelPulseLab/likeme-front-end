import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from './index';

const t = (key: string, opts?: Record<string, string>) => {
  const map: Record<string, string> = {
    'auth.registerTitle': 'Vamos começar!',
    'common.next': 'Próximo',
    'common.save': 'Salvar',
    'common.saving': 'Salvando...',
    'common.skipInformation': 'Pular Informação',
    'common.configureLater': 'Configurar depois',
    'auth.fullName': 'Nome completo',
    'auth.fullNamePlaceholder': 'Nome completo',
    'auth.age': 'Idade',
    'auth.agePlaceholder': 'Idade',
    'auth.birthdate': 'Data de nascimento',
    'auth.birthdatePlaceholder': 'DD/MM/AAAA',
    'auth.validationInvalidBirthdate': 'Informe uma data de nascimento válida (DD/MM/AAAA).',
    'auth.requiredField': 'Campo obrigatório',
    'auth.fillFullName': 'Por favor, preencha o nome completo.',
    'auth.validationFullNameRequiresSurname': 'Informe nome e sobrenome.',
    'auth.validationFullNamePartTooShort': 'Nome e sobrenome devem ter pelo menos 2 caracteres cada.',
    'auth.validationInvalidNumber': 'Informe um número válido.',
    'auth.validationOutOfRange': `Deve estar entre ${opts?.min ?? ''} e ${opts?.max ?? ''}.`,
    'auth.gender': 'Gênero',
    'auth.genderPlaceholder': 'Selecione',
    'auth.genderFemale': 'Feminino',
    'auth.genderMale': 'Masculino',
    'auth.genderNonBinary': 'Não binário',
    'auth.genderOther': 'Outro',
    'auth.genderPreferNotToSay': 'Prefiro não dizer',
    'auth.registerInvitationQuestion': 'Convite?',
    'auth.registerEnterCode': 'Código',
    'auth.registerCodePlaceholder': 'Código',
    'auth.registerInfoMessage': 'Info',
    'auth.weight': 'Peso',
    'auth.weightPlaceholder': 'Peso',
    'auth.height': 'Altura',
    'auth.heightPlaceholder': 'Altura',
    'auth.insurance': 'Convênio',
    'auth.insurancePlaceholder': 'Convênio',
    'common.close': 'Fechar',
    'common.error': 'Erro',
    'auth.registerError': 'Não foi possível salvar. Tente novamente.',
  };
  return map[key] ?? key;
};

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({ t }),
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: () => {
    /* noop */
  },
}));

jest.mock('@/assets', () => ({
  GradientSplash5: 'GradientSplash5',
}));

jest.mock('@/utils', () => ({
  getNextOnboardingScreen: () => 'InterestCategories',
}));

jest.mock('@/services', () => ({
  personsService: {
    createOrUpdatePerson: jest.fn().mockResolvedValue(undefined),
    getPerson: jest.fn().mockResolvedValue(null),
  },
  userService: {
    getProfile: jest.fn().mockResolvedValue({ success: false }),
    syncStoredUserName: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/components/ui', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity, TextInput: RNTextInput } = require('react-native');
  return {
    Header: () => null,
    Title: ({ title }: { title: string }) => <Text>{title}</Text>,
    TextInput: React.forwardRef(({ label, placeholder, onChangeText, value, errorText }: any, ref: any) => (
      <View>
        {label && <Text>{label}</Text>}
        <RNTextInput
          ref={ref}
          placeholder={placeholder}
          onChangeText={onChangeText}
          value={value}
          testID={`input-${placeholder}`}
        />
        {errorText ? <Text>{errorText}</Text> : null}
      </View>
    )),
    PrimaryButton: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <TouchableOpacity onPress={onPress} testID={`button-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    SecondaryButton: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <TouchableOpacity onPress={onPress} testID={`button-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    ButtonGroup: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
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

const getServices = () => require('@/services');

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getServices().personsService.createOrUpdatePerson.mockResolvedValue(undefined);
    getServices().personsService.getPerson.mockResolvedValue(null);
  });

  it('renders correctly', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: {} };

    const { getByText } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    expect(getByText('Vamos começar!')).toBeTruthy();
    expect(getByText('Salvar')).toBeTruthy();
    expect(getByText('Configurar depois')).toBeTruthy();
  });

  it('navigates to InterestCategories when Salvar button is pressed with all required fields', async () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: { userName: 'John' } };

    const { getByText, getByTestId } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.changeText(getByTestId('input-Nome completo'), 'John Doe');
    fireEvent.changeText(getByTestId('input-DD/MM/AAAA'), '01/01/1990');
    fireEvent.press(getByText('Selecione'));
    fireEvent.press(getByText('Masculino'));
    fireEvent.changeText(getByTestId('input-60'), '70');
    fireEvent.changeText(getByTestId('input-1,60'), '1,75');
    fireEvent.press(getByText('Salvar'));

    await waitFor(() => {
      expect(getServices().personsService.createOrUpdatePerson).toHaveBeenCalled();
      expect(mockNavigation.navigate).toHaveBeenCalledWith('InterestCategories', {
        firstName: 'John',
      });
    });
  });

  it('sends personData with all required fields when set', async () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: {} };

    const { getByText, getByTestId } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.changeText(getByTestId('input-Nome completo'), 'Maria Silva');
    fireEvent.changeText(getByTestId('input-DD/MM/AAAA'), '15/06/1985');
    fireEvent.press(getByText('Selecione'));
    fireEvent.press(getByText('Feminino'));
    fireEvent.changeText(getByTestId('input-60'), '60');
    fireEvent.changeText(getByTestId('input-1,60'), '1,65');
    fireEvent.press(getByText('Salvar'));

    await expect(getServices().personsService.createOrUpdatePerson).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Maria',
        lastName: 'Silva',
      }),
    );
  });

  it('navigates to InterestCategories with fullName when Salvar is pressed and fullName is set', async () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: { userName: 'John' } };

    const { getByText, getByTestId } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.changeText(getByTestId('input-Nome completo'), 'John Doe');
    fireEvent.changeText(getByTestId('input-DD/MM/AAAA'), '01/01/1990');
    fireEvent.press(getByText('Selecione'));
    fireEvent.press(getByText('Masculino'));
    fireEvent.changeText(getByTestId('input-60'), '70');
    fireEvent.changeText(getByTestId('input-1,60'), '1,75');
    fireEvent.press(getByText('Salvar'));

    await waitFor(() => {
      expect(getServices().personsService.createOrUpdatePerson).toHaveBeenCalled();
      expect(mockNavigation.navigate).toHaveBeenCalledWith('InterestCategories', {
        firstName: 'John',
      });
    });
  });

  it('navigates to InterestCategories when Configurar depois button is pressed', async () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: { userName: 'John' } };

    const { getByText } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.press(getByText('Configurar depois'));

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('InterestCategories', {
        firstName: 'John',
      });
    });
  });

  it('shows inline error when Salvar is pressed without fullName', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: {} };

    const { getByText, getByTestId } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.changeText(getByTestId('input-Nome completo'), '');
    fireEvent.press(getByText('Salvar'));

    expect(getByText('Por favor, preencha o nome completo.')).toBeTruthy();
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
    expect(getServices().personsService.createOrUpdatePerson).not.toHaveBeenCalled();
  });

  it('shows inline error when Salvar is pressed with only whitespace in fullName', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: {} };

    const { getByText, getByTestId } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.changeText(getByTestId('input-Nome completo'), '   ');
    fireEvent.press(getByText('Salvar'));

    expect(getByText('Por favor, preencha o nome completo.')).toBeTruthy();
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('shows inline error when Salvar is pressed with single-word fullName', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: {} };

    const { getByText, getByTestId } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.changeText(getByTestId('input-Nome completo'), 'Maria');
    fireEvent.press(getByText('Salvar'));

    expect(getByText('Informe nome e sobrenome.')).toBeTruthy();
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
    expect(getServices().personsService.createOrUpdatePerson).not.toHaveBeenCalled();
  });

  it('does not navigate when birthdate is out of range and sets field error', async () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    const mockRoute = { params: {} };

    const { getByText, getByTestId } = render(<RegisterScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.changeText(getByTestId('input-Nome completo'), 'João Silva');
    fireEvent.changeText(getByTestId('input-DD/MM/AAAA'), '01/01/1820');
    fireEvent.press(getByText('Salvar'));

    expect(getServices().personsService.createOrUpdatePerson).not.toHaveBeenCalled();
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});
