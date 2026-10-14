import React from 'react';
import { ActivityIndicator, Alert, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '@/constants';
import { logger } from '@/utils/logger';
import { useTranslation } from '@/hooks/i18n';

export interface EventWebViewSessionProps {
  url: string;
  onClose: () => void;
  variant?: 'live' | 'default';
}

export const EventWebViewSession: React.FC<EventWebViewSessionProps> = ({ url, onClose, variant = 'default' }) => {
  const isLiveSession = variant === 'live';
  const { t } = useTranslation();

  const openInBrowser = () => {
    void Linking.openURL(url)
      .catch((cause) => {
        logger.error('[EventWebViewSession] Falha ao abrir URL externa', { url, cause });
        Alert.alert(
          t('errors.error'),
          t('community.eventBanner.liveJoinError', {
            defaultValue: 'Não foi possível entrar na live agora. Tente novamente em instantes.',
          }),
        );
      })
      .finally(onClose);
  };

  const onWebViewError = (event: { nativeEvent: { description?: string; code?: number } }) => {
    logger.error('[EventWebViewSession] Erro ao renderizar WebView', {
      url,
      description: event.nativeEvent.description,
      code: event.nativeEvent.code,
    });
  };

  return (
    <Modal visible transparent={false} animationType='slide' onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
          {isLiveSession ? (
            <TouchableOpacity onPress={openInBrowser} style={styles.browserLinkButton} activeOpacity={0.8}>
              <Text style={styles.browserLinkText}>
                {t('community.eventBanner.openInBrowser', { defaultValue: 'Abrir no navegador' })}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <WebView
          source={{ uri: url }}
          style={styles.webView}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          allowsFullscreenVideo={isLiveSession}
          allowsInlineMediaPlayback={isLiveSession}
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType={isLiveSession ? 'grant' : undefined}
          onError={onWebViewError}
          onHttpError={onWebViewError}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size='large' />
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DADADA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeButton: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#001137',
    fontWeight: '600',
  },
  browserLinkButton: {
    paddingVertical: 8,
    paddingLeft: 8,
  },
  browserLinkText: {
    fontSize: 14,
    color: '#001137',
    fontWeight: '500',
  },
  webView: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
});
