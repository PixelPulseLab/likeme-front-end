import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import WelcomeScreen from './index';

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@/assets', () => ({
  GradientSplash4: 'GradientSplash4',
}));

jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');
  const RNTextInput = require('react-native').TextInput;
  return {
    TextInput: React.forwardRef(({ placeholder, onChangeText, value, onSubmitEditing }: any, ref: any) => (
      <RNTextInput
        ref={ref}
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        onSubmitEditing={onSubmitEditing}
        testID={`input-${placeholder}`}
      />
    )),
    PrimaryButton: ({ label, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
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

jest.mock('@/utils', () => ({
  getNextOnboardingScreen: () => 'AppPresentation',
}));

jest.mock('@/services', () => ({
  storageService: {
    setWelcomeScreenAccessedAt: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn().mockResolvedValue(null),
  },
  userService: {
    syncStoredUserName: jest.fn().mockResolvedValue(undefined),
  },
  personsService: {
    createOrUpdatePerson: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('WelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const { getByText, getByPlaceholderText } = render(<WelcomeScreen navigation={mockNavigation} />);

    expect(getByText('auth.welcomeTitleStart')).toBeTruthy();
    expect(getByText('auth.welcomeSubtitle')).toBeTruthy();
    expect(getByPlaceholderText('auth.yourNamePlaceholder')).toBeTruthy();
  });

  it('navega para AppPresentation ao pressionar Enter em qualquer teclado', async () => {
    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const { getByPlaceholderText } = render(<WelcomeScreen navigation={mockNavigation} />);

    const input = getByPlaceholderText('auth.yourNamePlaceholder');
    fireEvent.changeText(input, 'John');
    fireEvent(input, 'submitEditing');

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('AppPresentation', { userName: 'John' });
    });
  });

  it('shows alert when trying to continue with empty name', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByPlaceholderText } = render(<WelcomeScreen navigation={mockNavigation} />);

    const input = getByPlaceholderText('auth.yourNamePlaceholder');
    fireEvent.changeText(input, '');
    fireEvent(input, 'submitEditing');

    expect(alertSpy).toHaveBeenCalledWith('auth.nameRequired', 'auth.nameRequiredMessage');
    expect(mockNavigation.navigate).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('shows alert when trying to continue with only whitespace in name', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByPlaceholderText } = render(<WelcomeScreen navigation={mockNavigation} />);

    const input = getByPlaceholderText('auth.yourNamePlaceholder');
    fireEvent.changeText(input, '   ');
    fireEvent(input, 'submitEditing');

    expect(alertSpy).toHaveBeenCalledWith('auth.nameRequired', 'auth.nameRequiredMessage');
    expect(mockNavigation.navigate).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
