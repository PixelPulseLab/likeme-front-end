import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PersonalDataEditScreen from './index';

const loadedFormData = {
  fullName: 'Roberto Botelho',
  birthdate: '12/05/1986',
  gender: 'male',
  weight: '78',
  height: '1,73',
};

const t = (key: string, opts?: Record<string, string>) => {
  const map: Record<string, string> = {
    'profile.personalData.title': 'Dados pessoais',
    'profile.personalData.save': 'Salvar',
    'profile.personalData.loading': 'Carregando dados pessoais...',
    'profile.personalData.loadError': 'Não foi possível carregar seus dados pessoais. Tente novamente.',
    'profile.personalData.saveError': 'Não foi possível salvar seus dados pessoais. Tente novamente.',
    'auth.fullName': 'Nome completo',
    'auth.fullNamePlaceholder': 'Nome completo',
    'auth.birthdate': 'Data de nascimento',
    'auth.gender': 'Gênero',
    'auth.genderPlaceholder': 'Selecione',
    'auth.genderMale': 'Masculino',
    'auth.weight': 'Peso',
    'auth.height': 'Altura',
    'auth.requiredField': 'Campo obrigatório',
    'auth.fillFullName': 'Por favor, preencha o nome completo.',
    'auth.validationFullNameRequiresSurname': 'Informe nome e sobrenome.',
    'auth.validationInvalidBirthdate': 'Informe uma data de nascimento válida (DD/MM/AAAA).',
    'auth.validationInvalidNumber': 'Informe um número válido.',
    'auth.validationOutOfRange': `Deve estar entre ${opts?.min ?? ''} e ${opts?.max ?? ''}.`,
    'common.retry': 'Tentar novamente',
    'common.error': 'Erro',
    'common.close': 'Fechar',
  };
  return map[key] ?? key;
};

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({ t }),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/components/ui/layout', () => {
  const React = require('react');
  const { View, ScrollView } = require('react-native');
  return {
    ScreenWithHeader: ({ children, headerProps }: any) => {
      const { Header } = require('@/components/ui');
      return (
        <View>
          <Header {...headerProps} />
          {children}
        </View>
      );
    },
    GradientBackground: () => <View testID='gradient-background' />,
    KeyboardAwareScreen: ({ children, footer }: any) => (
      <View>
        <ScrollView>{children}</ScrollView>
        {footer}
      </View>
    ),
  };
});

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: () => {
    /* noop */
  },
}));

jest.mock('@/components/ui', () => {
  const { View, Text, TouchableOpacity, TextInput: RNTextInput } = require('react-native');
  return {
    Header: ({ onBackPress }: { onBackPress?: () => void }) => (
      <TouchableOpacity onPress={onBackPress}>
        <Text>Back</Text>
      </TouchableOpacity>
    ),
    TextInput: ({ label, value, onChangeText, testID }: any) => (
      <View>
        <Text>{label}</Text>
        <RNTextInput testID={testID ?? label} value={value} onChangeText={onChangeText} />
      </View>
    ),
    PrimaryButton: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
      <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityState={{ disabled: !!disabled }}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    Loading: ({ message }: { message: string }) => <Text>{message}</Text>,
  };
});

const mockLoadPersonalData = jest.fn();

jest.mock('@/hooks/person/useLoadPersonalData', () => ({
  useLoadPersonalData: () => ({
    loadPersonalData: mockLoadPersonalData,
  }),
}));

jest.mock('@/services', () => ({
  personsService: {
    createOrUpdatePerson: jest.fn().mockResolvedValue(undefined),
  },
  userService: {
    syncStoredUserName: jest.fn().mockResolvedValue(undefined),
  },
}));

const getServices = () => require('@/services');

const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

describe('PersonalDataEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadPersonalData.mockResolvedValue(loadedFormData);
    getServices().personsService.createOrUpdatePerson.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('carrega e exibe os dados pessoais', async () => {
    const { getByText, getByDisplayValue } = render(
      <PersonalDataEditScreen navigation={navigation as any} route={{} as any} />,
    );

    await waitFor(() => {
      expect(getByText('Dados pessoais')).toBeTruthy();
      expect(getByDisplayValue('Roberto Botelho')).toBeTruthy();
    });
  });

  it('mantém Salvar desabilitado sem alterações', async () => {
    const { getByText } = render(<PersonalDataEditScreen navigation={navigation as any} route={{} as any} />);

    await waitFor(() => {
      expect(getByText('Salvar')).toBeTruthy();
    });

    fireEvent.press(getByText('Salvar'));
    expect(getServices().personsService.createOrUpdatePerson).not.toHaveBeenCalled();
  });

  it('habilita Salvar após alteração e persiste no backend', async () => {
    const { getByText, getByTestId } = render(
      <PersonalDataEditScreen navigation={navigation as any} route={{} as any} />,
    );

    await waitFor(() => {
      expect(getByText('Nome completo')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('Nome completo'), 'Roberto Botelho Silva');
    fireEvent.press(getByText('Salvar'));

    await waitFor(() => {
      expect(getServices().personsService.createOrUpdatePerson).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Roberto',
          lastName: 'Botelho Silva',
          gender: 'male',
        }),
      );
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });

  it('desabilita Salvar ao reverter para o valor original', async () => {
    const { getByText, getByTestId } = render(
      <PersonalDataEditScreen navigation={navigation as any} route={{} as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('Nome completo')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('Nome completo'), 'Roberto Botelho Silva');
    fireEvent.changeText(getByTestId('Nome completo'), 'Roberto Botelho');

    fireEvent.press(getByText('Salvar'));
    expect(getServices().personsService.createOrUpdatePerson).not.toHaveBeenCalled();
  });

  it('exibe erro de carregamento e permite retry', async () => {
    mockLoadPersonalData.mockResolvedValueOnce(null).mockResolvedValueOnce(loadedFormData);

    const { getByText } = render(<PersonalDataEditScreen navigation={navigation as any} route={{} as any} />);

    await waitFor(() => {
      expect(getByText('Não foi possível carregar seus dados pessoais. Tente novamente.')).toBeTruthy();
    });

    fireEvent.press(getByText('Tentar novamente'));

    await waitFor(() => {
      expect(getByText('Dados pessoais')).toBeTruthy();
    });
  });
});
