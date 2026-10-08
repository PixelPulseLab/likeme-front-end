import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import type { Attachment } from '@/types/attachment';
import { downloadCommunityAttachment } from '@/utils/community/communityAttachmentDownload';
import { communityFileKindIconSource } from '@/utils/community/communityFileKindIconSource';
import { styles } from './styles';

function materialIconSize(type: Attachment['type']): { width: number; height: number } {
  if (type === 'pdf') {
    return { width: 30, height: 37 };
  }
  if (type === 'document' || type === 'generic') {
    return { width: 40, height: 37 };
  }
  return { width: 38, height: 37 };
}

export function LessonMaterialCard({ attachment }: { attachment: Attachment }) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadLabel = t('community.attachments.download', { defaultValue: 'Baixar' });
  const isImage = attachment.type === 'image' && Boolean(attachment.url.trim());
  const iconSize = materialIconSize(attachment.type);
  const materialIcon = isImage ? (
    <CachedImage source={{ uri: attachment.url }} style={iconSize} contentFit='contain' />
  ) : (
    <Image source={communityFileKindIconSource(attachment.type)} style={iconSize} resizeMode='contain' />
  );
  const downloadAction = isDownloading ? (
    <ActivityIndicator size='small' color={COLORS.NEUTRAL.LOW.PURE} />
  ) : (
    <>
      <Text style={styles.downloadLabel}>{downloadLabel}</Text>
      <Icon name='vertical-align-bottom' size={24} color={COLORS.NEUTRAL.LOW.PURE} />
    </>
  );

  const onDownload = async () => {
    if (isDownloading) {
      return;
    }
    setIsDownloading(true);
    try {
      await downloadCommunityAttachment(attachment);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.identity}>
        <View style={styles.iconWrap}>{materialIcon}</View>
        <Text style={styles.name} numberOfLines={1}>
          {attachment.fileName}
        </Text>
      </View>
      <Pressable
        style={styles.download}
        onPress={() => {
          void onDownload();
        }}
        disabled={isDownloading}
        accessibilityRole='button'
        accessibilityLabel={`${downloadLabel} ${attachment.fileName}`}
        accessibilityState={{ busy: isDownloading }}
      >
        {downloadAction}
      </Pressable>
    </View>
  );
}
