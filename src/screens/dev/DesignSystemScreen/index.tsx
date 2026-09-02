import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Badge from '@/components/ui/badge';
import { FilterButton, IconButton, PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import CTACard from '@/components/ui/cards/CTACard';
import EmptyState from '@/components/ui/feedback/EmptyState';
import SearchBar from '@/components/ui/inputs/SearchBar';
import TextInput from '@/components/ui/inputs/TextInput';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import ToggleTabs from '@/components/ui/tabs/ToggleTabs';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';
import type { RootStackParamList } from '@/types/navigation';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'DesignSystem'>;

const COLOR_SWATCHES = [
  { name: 'Primary', value: COLORS.PRIMARY.PURE },
  { name: 'Highlight', value: COLORS.HIGHLIGHT.PURE },
  { name: 'Texto', value: COLORS.TEXT },
  { name: 'Texto light', value: COLORS.TEXT_LIGHT },
  { name: 'Fundo', value: COLORS.BACKGROUND },
  { name: 'Secondary', value: COLORS.SECONDARY.PURE },
  { name: 'Erro', value: COLORS.ERROR },
  { name: 'Branco', value: COLORS.WHITE },
] as const;

const TYPE_SAMPLES = [
  { name: 'displaySm', style: TYPOGRAPHY.displaySm, sample: 'LikeMe' },
  { name: 'title3', style: TYPOGRAPHY.title3, sample: 'Destaque da semana' },
  { name: 'bodyMd', style: TYPOGRAPHY.bodyMd, sample: 'Corpo de texto padrão do app.' },
  { name: 'labelMd', style: TYPOGRAPHY.labelMd, sample: 'Label de campo' },
] as const;

const TOGGLE_TABS = [
  { id: 'actives', label: 'Ativos' },
  { id: 'history', label: 'Histórico' },
] as const;

function CatalogSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const DesignSystemScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('Programa demo');
  const [search, setSearch] = useState('');
  const [tabId, setTabId] = useState<(typeof TOGGLE_TABS)[number]['id']>('actives');

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        onBackPress: () => navigation.goBack(),
        showBackButton: true,
        backgroundColor: COLORS.SECONDARY.LIGHT,
      }}
      contentBackgroundColor={COLORS.BACKGROUND}
      contentContainerStyle={styles.container}
      testID='design-system-screen'
    >
      <GradientBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SPACING.SECTION + Math.max(insets.bottom, SPACING.MD) },
        ]}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Design system</Text>
          <Text style={styles.introBody}>
            Catálogo dos componentes de UI do app. Só aparece em builds de desenvolvimento.
          </Text>
        </View>

        <CatalogSection title='Cores'>
          <View style={styles.swatchGrid}>
            {COLOR_SWATCHES.map((swatch) => (
              <View key={swatch.name} style={styles.swatch}>
                <View style={[styles.swatchChip, { backgroundColor: swatch.value }]} />
                <Text style={styles.swatchName}>{swatch.name}</Text>
                <Text style={styles.swatchValue}>{swatch.value}</Text>
              </View>
            ))}
          </View>
        </CatalogSection>

        <CatalogSection title='Tipografia'>
          <View style={styles.stack}>
            {TYPE_SAMPLES.map((sample) => (
              <View key={sample.name} style={styles.typeRow}>
                <Text style={styles.typeLabel}>{sample.name}</Text>
                <Text style={[sample.style, { color: COLORS.TEXT }]}>{sample.sample}</Text>
              </View>
            ))}
          </View>
        </CatalogSection>

        <CatalogSection title='Botões'>
          <View style={styles.stack}>
            <PrimaryButton label='Primário dark' onPress={() => undefined} />
            <PrimaryButton label='Primário light' variant='light' onPress={() => undefined} />
            <PrimaryButton label='Carregando' loading onPress={() => undefined} />
            <PrimaryButton label='Desabilitado' disabled onPress={() => undefined} />
            <SecondaryButton label='Secundário' onPress={() => undefined} />
            <SecondaryButton label='Secundário com ícone' icon='arrow-forward' onPress={() => undefined} />
            <View style={styles.row}>
              <IconButton icon='search' onPress={() => undefined} label='Buscar' />
              <IconButton icon='favorite' variant='dark' onPress={() => undefined} label='Favorito' />
              <FilterButton
                label='Filtro'
                modalTitle='Filtro'
                modalContent={<Text style={styles.introBody}>Conteúdo de exemplo do modal de filtro.</Text>}
              />
            </View>
          </View>
        </CatalogSection>

        <CatalogSection title='Abas'>
          <ToggleTabs tabs={[...TOGGLE_TABS]} selectedId={tabId} onSelect={(id) => setTabId(id as typeof tabId)} />
        </CatalogSection>

        <CatalogSection title='Campos'>
          <View style={styles.stack}>
            <SearchBar placeholder='Buscar' value={search} onChangeText={setSearch} showFilterButton={false} />
            <TextInput
              label='Nome'
              value={name}
              onChangeText={setName}
              helperText='Campo usado em cadastros e busca.'
            />
            <TextInput label='E-mail' value='' onChangeText={() => undefined} errorText='Informe um e-mail válido.' />
          </View>
        </CatalogSection>

        <CatalogSection title='Badge'>
          <View style={styles.row}>
            <Badge label='Programa' color='blue' />
            <Badge label='Destaque' color='lime' />
            <Badge label='Novo' color='orange' />
            <Badge label='Neutro' color='beige' />
          </View>
        </CatalogSection>

        <CatalogSection title='Empty state'>
          <EmptyState
            iconName='inbox'
            title='Nada por aqui'
            description='Estado vazio das listagens, com ação opcional.'
            actionLabel='Tentar de novo'
            onActionPress={() => undefined}
          />
        </CatalogSection>

        <CatalogSection title='Card'>
          <CTACard
            title='Continue de onde parou'
            description='Card de chamada usado em home e protocolos.'
            primaryButtonLabel='Abrir'
            primaryButtonOnPress={() => undefined}
            secondaryButtonLabel='Agora não'
            secondaryButtonOnPress={() => undefined}
          />
        </CatalogSection>
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default DesignSystemScreen;
