import userService from './userService';
import apiClient from '../infrastructure/apiClient';
import storageService from '../auth/storageService';
import { logger } from '@/utils/logger';

jest.mock('../infrastructure/apiClient');
jest.mock('../auth/storageService', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn(),
    setUser: jest.fn(),
  },
}));
jest.mock('@/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockStorage = storageService as jest.Mocked<typeof storageService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('userService profile avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadProfileAvatar', () => {
    it('envia multipart para /api/upload/profile-image e retorna URL pública', async () => {
      mockApiClient.postMultipart.mockResolvedValue({
        success: true,
        data: { url: 'https://cdn.example.com/profiles/u1/avatar.jpg' },
      });

      const url = await userService.uploadProfileAvatar('file:///avatar.jpg', 'image/jpeg', 'avatar.jpg');

      expect(mockApiClient.postMultipart).toHaveBeenCalledWith('/api/upload/profile-image', expect.any(FormData));
      expect(url).toBe('https://cdn.example.com/profiles/u1/avatar.jpg');
    });

    it('lança erro quando API não retorna URL', async () => {
      mockApiClient.postMultipart.mockResolvedValue({
        success: false,
        message: 'Falha no upload',
      });

      await expect(userService.uploadProfileAvatar('file:///avatar.jpg')).rejects.toThrow('Falha no upload');
    });
  });

  describe('updateProfileAvatar', () => {
    it('atualiza avatar via PUT /api/auth/profile', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'u1', avatar: 'https://cdn.example.com/new.jpg' },
      };
      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await userService.updateProfileAvatar('https://cdn.example.com/new.jpg');

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/api/auth/profile',
        { avatar: 'https://cdn.example.com/new.jpg' },
        true,
      );
      expect(result).toEqual(mockResponse);
    });

    it('permite remover avatar enviando null', async () => {
      mockApiClient.put.mockResolvedValue({ success: true, data: { id: 'u1', avatar: null } });

      await userService.updateProfileAvatar(null);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/auth/profile', { avatar: null }, true);
    });

    it('propaga erro quando API falha', async () => {
      mockApiClient.put.mockResolvedValue({ success: false, message: 'Erro ao salvar' });

      await expect(userService.updateProfileAvatar('https://cdn.example.com/new.jpg')).rejects.toThrow(
        'Erro ao salvar',
      );
    });
  });

  describe('syncStoredUserPicture', () => {
    it('atualiza picture no storage local quando há avatar', async () => {
      mockStorage.getUser.mockResolvedValue({ email: 'a@b.com', name: 'Ana', picture: 'old.jpg' });

      await userService.syncStoredUserPicture('https://cdn.example.com/new.jpg');

      expect(mockStorage.setUser).toHaveBeenCalledWith({
        email: 'a@b.com',
        name: 'Ana',
        picture: 'https://cdn.example.com/new.jpg',
      });
    });

    it('remove picture do storage local quando avatar é null', async () => {
      mockStorage.getUser.mockResolvedValue({ email: 'a@b.com', name: 'Ana', picture: 'old.jpg' });

      await userService.syncStoredUserPicture(null);

      expect(mockStorage.setUser).toHaveBeenCalledWith({
        email: 'a@b.com',
        name: 'Ana',
      });
    });

    it('não altera storage quando usuário local não existe', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      await userService.syncStoredUserPicture('https://cdn.example.com/new.jpg');

      expect(mockStorage.setUser).not.toHaveBeenCalled();
    });

    it('registra warn e não propaga erro quando storage falha', async () => {
      mockStorage.getUser.mockRejectedValue(new Error('storage indisponível'));

      await expect(userService.syncStoredUserPicture('https://cdn.example.com/new.jpg')).resolves.toBeUndefined();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[userService] Falha ao sincronizar avatar no storage local',
        expect.objectContaining({ cause: expect.any(Error) }),
      );
    });
  });

  describe('syncStoredUserName', () => {
    it('atualiza name no storage local', async () => {
      mockStorage.getUser.mockResolvedValue({ email: 'a@b.com', name: 'Ana', picture: 'old.jpg' });

      await userService.syncStoredUserName('  Ana Nova  ');

      expect(mockStorage.setUser).toHaveBeenCalledWith({
        email: 'a@b.com',
        name: 'Ana Nova',
        picture: 'old.jpg',
      });
    });

    it('não altera storage quando nome está vazio', async () => {
      mockStorage.getUser.mockResolvedValue({ email: 'a@b.com', name: 'Ana' });

      await userService.syncStoredUserName('   ');

      expect(mockStorage.setUser).not.toHaveBeenCalled();
    });
  });
});
