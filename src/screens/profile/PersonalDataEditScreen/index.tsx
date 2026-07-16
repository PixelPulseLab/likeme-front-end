import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { PrimaryButton, Loading } from '@/components/ui';
import { ScreenWithHeader, GradientBackground, KeyboardAwareScreen } from '@/components/ui/layout';
import PersonalDataFieldsForm, {
  type PersonalDataFieldErrors,
} from '@/components/sections/person/PersonalDataFieldsForm';
import { personsService, userService } from '@/services';
import { useTranslation } from '@/hooks/i18n';
import { useLoadPersonalData, useScrollToFocusedField, type PersonFormData } from '@/hooks';
import type { PersonData } from '@/types/person';
import type { RootStackParamList } from '@/types/navigation';
import { birthdateToISO, ageFromBirthdateISO } from '@/utils/formatters/personFormats';
import { useAnalyticsScreen } from '@/analytics';
import { logger } from '@/utils/logger';
import { parseFullName, validateFullNameForPerson } from '@/utils/person/fullNameValidation';
import { COLORS, SPACING } from '@/constants';
import { styles } from './styles';

const EMPTY_FORM: PersonFormData = {
  fullName: '',
  birthdate: '',
  gender: '',
  weight: '',
  height: '',
};

type Props = StackScreenProps<RootStackParamList, 'PersonalDataEdit'>;

function personFormDataEqual(left: PersonFormData, right: PersonFormData): boolean {
  return (
    left.fullName === right.fullName &&
    left.birthdate === right.birthdate &&
    left.gender === right.gender &&
    left.weight === right.weight &&
    left.height === right.height
  );
}

const PersonalDataEditScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'PersonalDataEdit', screenClass: 'PersonalDataEditScreen' });
  const { t } = useTranslation();
  const { loadPersonalData } = useLoadPersonalData();

  const [formData, setFormData] = useState<PersonFormData>(EMPTY_FORM);
  const [savedFormData, setSavedFormData] = useState<PersonFormData>(EMPTY_FORM);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PersonalDataFieldErrors>({});

  const scrollViewRef = useRef<ScrollView>(null);
  const { scrollToFocusedField, handleContentLayout, handleContainerLayout, handleFieldLayout } =
    useScrollToFocusedField(scrollViewRef);

  const hasPendingChanges = useMemo(() => !personFormDataEqual(formData, savedFormData), [formData, savedFormData]);

  const loadFormData = useCallback(async () => {
    setIsLoadingData(true);
    setLoadFailed(false);
    try {
      const data = await loadPersonalData();
      if (!data) {
        setLoadFailed(true);
        return;
      }
      setFormData(data);
      setSavedFormData(data);
    } catch (error) {
      logger.error('[PersonalDataEditScreen] Falha ao carregar dados pessoais.', error);
      setLoadFailed(true);
    } finally {
      setIsLoadingData(false);
    }
  }, [loadPersonalData]);

  useEffect(() => {
    void loadFormData();
  }, [loadFormData]);

  const validateNumericField = useCallback(
    (value: string, min: number, max: number, required: boolean): string | undefined => {
      if (!value.trim()) return required ? t('auth.requiredField') : undefined;
      const n = Number(value.trim());
      if (Number.isNaN(n)) return t('auth.validationInvalidNumber');
      if (n < min || n > max) {
        return t('auth.validationOutOfRange', { min: String(min), max: String(max) });
      }
      return undefined;
    },
    [t],
  );

  const handleFormChange = useCallback((patch: Partial<PersonFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleClearFieldError = useCallback((field: keyof PersonalDataFieldErrors) => {
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setFieldErrors({});

      const errors: PersonalDataFieldErrors = {};

      const fullNameIssue = validateFullNameForPerson(formData.fullName);
      if (fullNameIssue === 'empty') {
        errors.fullName = t('auth.fillFullName');
      } else if (fullNameIssue === 'invalid_chars') {
        errors.fullName = t('auth.validationInvalidFullName');
      } else if (fullNameIssue === 'missing_surname') {
        errors.fullName = t('auth.validationFullNameRequiresSurname');
      } else if (fullNameIssue === 'part_too_short') {
        errors.fullName = t('auth.validationFullNamePartTooShort');
      }

      const birthdateISO = formData.birthdate.trim() ? birthdateToISO(formData.birthdate.trim()) : null;
      if (!formData.birthdate.trim()) {
        errors.birthdate = t('auth.requiredField');
      } else if (!birthdateISO) {
        errors.birthdate = t('auth.validationInvalidBirthdate');
      } else {
        const age = ageFromBirthdateISO(birthdateISO);
        if (age == null || age < 1 || age > 120) {
          errors.birthdate = t('auth.validationOutOfRange', { min: '1', max: '120' });
        }
      }

      if (!formData.gender.trim()) {
        errors.gender = t('auth.requiredField');
      }

      const weightNormalized = formData.weight.trim().replace(/,/g, '.');
      const weightError = validateNumericField(weightNormalized, 1, 499, true);
      if (weightError) errors.weight = weightError;

      const heightNormalized = formData.height.trim().replace(/,/g, '.');
      const heightError = validateNumericField(heightNormalized, 1, 499, true);
      if (heightError) errors.height = heightError;

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      const { firstName, lastName } = parseFullName(formData.fullName);

      const personData: PersonData = {
        firstName,
        lastName,
        gender: formData.gender.trim(),
        birthdate: birthdateISO!,
        weight: formData.weight.trim().replace(/,/g, '.'),
        height: formData.height.trim().replace(/,/g, '.'),
      };

      await personsService.createOrUpdatePerson(personData);
      await userService.syncStoredUserName(formData.fullName.trim());
      setSavedFormData(formData);
      navigation.goBack();
    } catch (error: unknown) {
      logger.error('[PersonalDataEditScreen] Erro ao salvar dados pessoais', error);
      Alert.alert(t('common.error'), t('profile.personalData.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigation, t, validateNumericField]);

  const saveDisabled = !hasPendingChanges || isSubmitting || (isLoadingData && !loadFailed);

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        onBackPress: () => navigation.goBack(),
        backgroundColor: COLORS.SECONDARY.LIGHT,
      }}
      contentBackgroundColor={COLORS.BACKGROUND}
      contentContainerStyle={styles.container}
    >
      <GradientBackground colors={['#958AAA', '#D8E4D6', '#F4F3EC']} />
      {isLoadingData ? (
        <Loading message={t('profile.personalData.loading')} fullScreen />
      ) : loadFailed ? (
        <View style={styles.loadErrorBlock}>
          <Text style={styles.loadErrorText}>{t('profile.personalData.loadError')}</Text>
          <PrimaryButton label={t('common.retry')} onPress={() => void loadFormData()} size='large' />
        </View>
      ) : (
        <KeyboardAwareScreen
          scrollRef={scrollViewRef}
          scrollViewStyle={styles.scrollView}
          scrollContentContainerStyle={styles.scrollContent}
          keyboardFooterLiftExtra={SPACING.MD}
          footer={
            <View style={styles.footer}>
              <PrimaryButton
                label={t('profile.personalData.save')}
                onPress={handleSave}
                disabled={saveDisabled}
                solidDisabled
                loading={isSubmitting}
                size='large'
              />
            </View>
          }
        >
          <View style={styles.content} onLayout={handleContentLayout}>
            <Text style={styles.title}>{t('profile.personalData.title')}</Text>
            <PersonalDataFieldsForm
              variant='profile'
              values={formData}
              fieldErrors={fieldErrors}
              onChange={handleFormChange}
              onClearFieldError={handleClearFieldError}
              scrollToFocusedField={scrollToFocusedField}
              onFieldLayout={handleFieldLayout}
              onContainerLayout={handleContainerLayout}
            />
          </View>
        </KeyboardAwareScreen>
      )}
    </ScreenWithHeader>
  );
};

export default PersonalDataEditScreen;
