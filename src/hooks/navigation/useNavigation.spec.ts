import { renderHook, waitFor } from '@testing-library/react-native';
import { CommonActions } from '@react-navigation/native';
import { SHARE_DEEP_LINK_HOME_SCREEN } from '@/constants/share';
import { useNavigation } from './useNavigation';

const mockGetToken = jest.fn();

jest.mock('@/services', () => ({
  storageService: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
  },
}));

describe('useNavigation', () => {
  const dispatch = jest.fn();
  const navigation = { dispatch };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue(null);
  });

  it('reseta a root stack na tela pedida', () => {
    const { result } = renderHook(() => useNavigation(navigation));

    result.current.resetTo('Summary');

    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Summary' }],
      }),
    );
  });

  it('não reseta quando resetToIfAuthenticated está sem sessão', async () => {
    renderHook(() => useNavigation(navigation, { resetToIfAuthenticated: SHARE_DEEP_LINK_HOME_SCREEN }));

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalled();
    });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('reseta para a tela informada quando já há sessão', async () => {
    mockGetToken.mockResolvedValue('session-token');

    renderHook(() => useNavigation(navigation, { resetToIfAuthenticated: SHARE_DEEP_LINK_HOME_SCREEN }));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        CommonActions.reset({
          index: 0,
          routes: [{ name: SHARE_DEEP_LINK_HOME_SCREEN }],
        }),
      );
    });
  });
});
