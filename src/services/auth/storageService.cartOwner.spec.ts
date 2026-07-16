import AsyncStorage from '@react-native-async-storage/async-storage';
import storageService from './storageService';

describe('storageService session/cart owner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('clearLocalUserDataIfOwnerChanged limpa quando não há dono anterior (logout incompleto)', async () => {
    const clearCartSpy = jest.spyOn(storageService, 'clearCart').mockResolvedValue(undefined);
    const clearOnboardingSpy = jest.spyOn(storageService, 'clearOnboardingLocalState').mockResolvedValue(undefined);

    await storageService.clearLocalUserDataIfOwnerChanged('b@example.com');

    expect(clearOnboardingSpy).toHaveBeenCalled();
    expect(clearCartSpy).toHaveBeenCalled();
    clearCartSpy.mockRestore();
    clearOnboardingSpy.mockRestore();
  });

  it('clearLocalUserDataIfOwnerChanged limpa onboarding e carrinho quando o e-mail muda', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === '@likeme:user') {
        return JSON.stringify({ email: 'a@example.com', name: 'A' });
      }
      if (key === '@likeme:session_owner_email') {
        return 'a@example.com';
      }
      return null;
    });
    const clearCartSpy = jest.spyOn(storageService, 'clearCart').mockResolvedValue(undefined);
    const clearOnboardingSpy = jest.spyOn(storageService, 'clearOnboardingLocalState').mockResolvedValue(undefined);

    await storageService.clearLocalUserDataIfOwnerChanged('b@example.com');

    expect(clearOnboardingSpy).toHaveBeenCalled();
    expect(clearCartSpy).toHaveBeenCalled();
    clearCartSpy.mockRestore();
    clearOnboardingSpy.mockRestore();
  });

  it('clearLocalUserDataIfOwnerChanged mantém dados quando o e-mail é o mesmo', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === '@likeme:user') {
        return JSON.stringify({ email: 'a@example.com', name: 'A' });
      }
      if (key === '@likeme:session_owner_email') {
        return 'a@example.com';
      }
      if (key === '@likeme:cart_owner_email') {
        return 'a@example.com';
      }
      return null;
    });
    const clearCartSpy = jest.spyOn(storageService, 'clearCart').mockResolvedValue(undefined);
    const clearOnboardingSpy = jest.spyOn(storageService, 'clearOnboardingLocalState').mockResolvedValue(undefined);

    await storageService.clearLocalUserDataIfOwnerChanged('a@example.com');

    expect(clearOnboardingSpy).not.toHaveBeenCalled();
    expect(clearCartSpy).not.toHaveBeenCalled();
    clearCartSpy.mockRestore();
    clearOnboardingSpy.mockRestore();
  });

  it('getCartItems descarta itens quando o dono do carrinho diverge do usuário logado', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === '@likeme:cart_items') {
        return JSON.stringify([{ id: 'p1', quantity: 1 }]);
      }
      if (key === '@likeme:cart_owner_email') {
        return 'a@example.com';
      }
      if (key === '@likeme:user') {
        return JSON.stringify({ email: 'b@example.com', name: 'B' });
      }
      return null;
    });

    await expect(storageService.getCartItems()).resolves.toEqual([]);
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['@likeme:cart_items', '@likeme:cart_owner_email']);
  });
});
