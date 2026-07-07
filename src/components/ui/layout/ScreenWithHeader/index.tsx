import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../Header';
import { COLORS, SPACING } from '@/constants';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';

type HeaderProps = React.ComponentProps<typeof Header>;

type Props = React.PropsWithChildren<{
  /** Navegação da tela (react-navigation). Usada para a ação padrão ao clicar na logo. */
  navigation?: any;
  headerProps?: HeaderProps;
  /** Fundo do conteúdo (abaixo do header). */
  contentBackgroundColor?: string;
  /** Estilo opcional extra para o container do conteúdo. */
  contentContainerStyle?: ViewStyle | ViewStyle[];
}>;

const ScreenWithHeader: React.FC<Props> = ({
  navigation,
  headerProps,
  contentBackgroundColor = COLORS.BACKGROUND,
  contentContainerStyle,
  children,
}) => {
  const defaultOnLogoPress = navigation != null ? () => navigateRootStack(navigation, 'Summary') : undefined;
  const headerBackgroundColor = headerProps?.backgroundColor ?? COLORS.BACKGROUND_SECONDARY;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: headerBackgroundColor }} edges={['top']}>
      <Header {...headerProps} onLogoPress={headerProps?.onLogoPress ?? defaultOnLogoPress} />
      <View
        style={[
          {
            flex: 1,
            backgroundColor: contentBackgroundColor,
            position: 'relative',
            paddingBottom: SPACING.XXL,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

export default ScreenWithHeader;
