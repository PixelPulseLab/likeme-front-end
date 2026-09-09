import React from 'react';
import { Text } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { ScreenWithHeader } from '@/components/ui/layout';
import { useAnalyticsScreen } from '@/analytics';
import type { RootStackParamList } from '@/types/navigation';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'InvitationContext'>;

const InvitationContextScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'InvitationContext', screenClass: 'InvitationContextScreen' });

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        onBackPress: () => navigation.goBack(),
        onLogoPress: () => undefined,
      }}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.programName}>{route.params.program.name}</Text>
    </ScreenWithHeader>
  );
};

export default InvitationContextScreen;
