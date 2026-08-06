import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Share } from 'react-native';
import {
  downloadCommunityAttachment,
  downloadCommunityAttachmentsSequentially,
  openCommunityAttachmentUrl,
} from './communityAttachmentDownload';

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///mock/cache/',
  downloadAsync: jest.fn(),
  getContentUriAsync: jest.fn(),
}));

describe('communityAttachmentDownload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({ uri: 'file:///mock/cache/guide.pdf' });
    (FileSystem.getContentUriAsync as jest.Mock).mockResolvedValue('content://mock/guide.pdf');
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  it('baixa o arquivo e abre compartilhamento', async () => {
    await downloadCommunityAttachment({
      id: 'doc-1',
      url: 'https://cdn.example.com/guide.pdf',
      type: 'pdf',
      fileName: 'guide.pdf',
    });

    expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
      'https://cdn.example.com/guide.pdf',
      'file:///mock/cache/community-doc-1-guide.pdf',
    );
    expect(Share.share).toHaveBeenCalled();
  });

  it('abre URL quando o download falha', async () => {
    (FileSystem.downloadAsync as jest.Mock).mockRejectedValue(new Error('network'));

    await downloadCommunityAttachment({
      id: 'doc-1',
      url: 'https://cdn.example.com/guide.pdf',
      type: 'pdf',
      fileName: 'guide.pdf',
    });

    expect(Linking.openURL).toHaveBeenCalledWith('https://cdn.example.com/guide.pdf');
  });

  it('baixa anexos em sequência', async () => {
    await downloadCommunityAttachmentsSequentially([
      {
        id: 'doc-1',
        url: 'https://cdn.example.com/guide.pdf',
        type: 'pdf',
        fileName: 'guide.pdf',
      },
      {
        id: 'doc-2',
        url: 'https://cdn.example.com/checklist.pdf',
        type: 'pdf',
        fileName: 'checklist.pdf',
      },
    ]);

    expect(FileSystem.downloadAsync).toHaveBeenCalledTimes(2);
    expect(Share.share).toHaveBeenCalledTimes(2);
  });

  it('openCommunityAttachmentUrl valida canOpenURL', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

    await openCommunityAttachmentUrl('https://cdn.example.com/guide.pdf', {
      attachmentId: 'doc-1',
      type: 'pdf',
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
