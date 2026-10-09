import { render } from '@testing-library/react-native';
import { StackActions } from '@react-navigation/native';
import HomeScreen from './index';

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
}));

describe('HomeScreen', () => {
  it('troca só a própria rota por Summary, sem atingir a tela focada', () => {
    const dispatch = jest.fn();
    const replace = jest.fn();
    const navigation = {
      dispatch,
      replace,
      getState: () => ({ key: 'stack-home' }),
    };

    render(<HomeScreen navigation={navigation} route={{}} />);

    expect(replace).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      ...StackActions.replace('Summary'),
      target: 'stack-home',
    });
  });
});
