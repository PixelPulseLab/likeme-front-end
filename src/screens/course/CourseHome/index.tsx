import { useCallback, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CourseLiveCamIcon from '@/assets/course/course-live-cam.svg';
import CourseMoreIcon from '@/assets/course/course-more.svg';
import { SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { CourseModuleCard } from '@/components/sections/course/CourseModuleCard';
import { CourseProgress } from '@/components/sections/course/CourseProgress';
import type { InfoSectionMenuOption } from '@/components/ui/carousel/InfoSectionTabsRow';
import { COLORS } from '@/constants';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { useTranslation } from '@/hooks/i18n';
import type { Course } from '@/screens/course/course';
import { styles } from './styles';

export type CourseLiveCard = {
  imageUri: string | null;
  message: string;
  whenLabel: string;
  actionLabel: string;
  onAction: () => void;
};

type Props = {
  welcomeName: string;
  description: string | null;
  course: Course;
  live: CourseLiveCard | null;
  onOpenCourseModule: (courseModuleId: string) => void;
  menuOptions?: InfoSectionMenuOption[];
};

export function CourseHome({ welcomeName, description, course, live, onOpenCourseModule, menuOptions }: Props) {
  const { t } = useTranslation();
  const menuButtonRef = useRef<View>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ top: 0, right: 16 });
  const welcomeTitle = t('profile.courseHome.welcomeTitle', {
    name: welcomeName,
    defaultValue: 'Bem-vinda ao\n{{name}}',
  });
  const continueContent = course.continueContent;
  const isProgramComplete = course.totalContents > 0 && course.completedContents >= course.totalContents;
  const showCourseModuleTitle =
    continueContent != null && continueContent.courseModuleTitle.trim() !== continueContent.contentTitle.trim();
  const showMenu = Boolean(menuOptions?.length);
  const menuLabel = t('profile.protocolDetail.manageProtocol', { defaultValue: 'Gerenciar protocolo' });
  const manageButtonStyle = isMenuOpen ? [styles.manageButton, styles.manageButtonOpen] : styles.manageButton;
  const menuIconColor = isMenuOpen ? COLORS.WHITE : COLORS.NEUTRAL.LOW.PURE;

  const openMenu = useCallback(() => {
    if (!menuOptions?.length) {
      return;
    }
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      const windowWidth = Dimensions.get('window').width;
      setMenuAnchor({
        top: y + height + 4,
        right: Math.max(16, windowWidth - (x + width)),
      });
      setIsMenuOpen(true);
    });
  }, [menuOptions]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <View style={styles.root}>
      <View style={styles.welcomeBlock}>
        <View style={styles.welcomeHeader}>
          <Text style={[styles.displayTitle, styles.welcomeTitle]}>{welcomeTitle}</Text>
          {showMenu ? (
            <View ref={menuButtonRef} collapsable={false} testID={E2E_TEST_IDS.PROTOCOL_MORE_MENU}>
              <Pressable
                style={manageButtonStyle}
                onPress={openMenu}
                accessibilityRole='button'
                accessibilityLabel={menuLabel}
              >
                <CourseMoreIcon color={menuIconColor} />
              </Pressable>
            </View>
          ) : null}
        </View>
        {description ? <Text style={styles.welcomeBody}>{description}</Text> : null}
      </View>

      {isProgramComplete ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('profile.courseHome.programCompletedTitle', { defaultValue: 'Programa concluído' })}
          </Text>
          <Text style={styles.welcomeBody}>
            {t('profile.courseHome.programCompletedBody', {
              defaultValue: 'Você concluiu todas as aulas desta jornada.',
            })}
          </Text>
        </View>
      ) : null}

      {continueContent ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('profile.courseHome.continueTitle', { defaultValue: 'Continue a sua jornada' })}
          </Text>
          <Pressable style={styles.continueCard} onPress={() => onOpenCourseModule(continueContent.courseModuleId)}>
            {continueContent.coverUri ? (
              <CachedImage source={{ uri: continueContent.coverUri }} style={styles.continueCover} />
            ) : (
              <View style={[styles.continueCover, { backgroundColor: COLORS.SECONDARY.MEDIUM }]} />
            )}
            <View style={styles.continueCopy}>
              <View>
                {showCourseModuleTitle ? (
                  <Text style={styles.overline}>{continueContent.courseModuleTitle}</Text>
                ) : null}
                <Text style={styles.continueTitle}>{continueContent.contentTitle}</Text>
                {continueContent.summary ? <Text style={styles.continueSummary}>{continueContent.summary}</Text> : null}
              </View>
              <SecondaryButton
                label={t('profile.courseHome.continueAction', { defaultValue: 'Continuar' })}
                icon='chevron-right'
                onPress={() => onOpenCourseModule(continueContent.courseModuleId)}
              />
            </View>
          </Pressable>
        </View>
      ) : null}

      {live ? (
        <View style={styles.liveSection}>
          <Text style={styles.liveLabel}>{t('profile.courseHome.nextLive', { defaultValue: 'Próxima live' })}</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveCoverFrame}>
              <View style={styles.liveCoverWrap}>
                {live.imageUri ? (
                  <CachedImage source={{ uri: live.imageUri }} style={styles.liveCover} />
                ) : (
                  <View style={[styles.liveCover, styles.liveCoverFallback]} />
                )}
                <LinearGradient
                  pointerEvents='none'
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.64)']}
                  style={styles.liveCoverShade}
                />
                <Pressable
                  style={styles.liveAction}
                  onPress={live.onAction}
                  accessibilityRole='button'
                  accessibilityLabel={live.actionLabel}
                >
                  <Text style={styles.liveActionLabel}>{live.actionLabel}</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.livePanel}>
              <View style={styles.liveCopy}>
                <CourseLiveCamIcon />
                <Text style={styles.liveMessage}>{live.message}</Text>
              </View>
              {live.whenLabel ? <Text style={styles.liveWhen}>{live.whenLabel}</Text> : null}
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.journeyHeader}>
        <Text style={styles.displayTitle}>{t('profile.courseHome.journeyTitle', { defaultValue: 'Sua jornada' })}</Text>
        <Text style={styles.journeyHint}>
          {t('profile.courseHome.journeyHint', { defaultValue: 'Conclua cada etapa para liberar a próxima.' })}
        </Text>
      </View>
      <CourseProgress completed={course.completedContents} total={course.totalContents} />

      {course.modules.length > 0 ? (
        <View style={styles.stageList}>
          {course.modules.map((courseModule) => (
            <CourseModuleCard
              key={courseModule.id}
              courseModule={courseModule}
              onOpenCourseModule={onOpenCourseModule}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.journeyHint}>
          {t('profile.protocolDetail.noCourseSteps', { defaultValue: 'Nenhuma aula disponível no momento.' })}
        </Text>
      )}

      <Modal visible={isMenuOpen} transparent animationType='fade' onRequestClose={closeMenu}>
        <View style={styles.menuBackdrop}>
          <Pressable style={styles.menuDismissArea} onPress={closeMenu} accessibilityRole='button' />
          <View style={[styles.menuCard, { top: menuAnchor.top, right: menuAnchor.right }]}>
            {menuOptions?.map((option) => (
              <Pressable
                key={option.label}
                style={styles.menuOption}
                onPress={() => {
                  closeMenu();
                  option.onPress();
                }}
                accessibilityRole='button'
                accessibilityLabel={option.label}
                testID={option.testID}
              >
                <Text style={styles.menuOptionLabel}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
