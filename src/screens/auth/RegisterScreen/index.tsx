import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Alert, Text, useWindowDimensions } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Title, PrimaryButton, SecondaryButton, ButtonGroup, TextInput } from '@/components/ui';
import { KeyboardAwareScreen, ScreenWithHeader } from '@/components/ui/layout';
import { CachedImage } from '@/components/ui/media/CachedImage';
import PersonalDataFieldsForm, {
  type PersonalDataFieldErrors,
} from '@/components/sections/person/PersonalDataFieldsForm';
import { GradientSplash5 } from '@/assets/auth';
import { advertiserAffiliateService, personsService, userService } from '@/services';
import { useTranslation } from '@/hooks/i18n';
import { useLoadPersonalData, useScrollToFocusedField } from '@/hooks';
import type { PersonData } from '@/types/person';
import type { RootStackParamList } from '@/types/navigation';
import { getNextOnboardingScreen } from '@/utils';
import { birthdateToISO, ageFromBirthdateISO } from '@/utils/formatters/personFormats';
import { styles } from './styles';
import { COLORS, SPACING } from '@/constants';
import { useAnalyticsScreen } from '@/analytics';
import { logger } from '@/utils/logger';
import { getReadableErrorMessage } from '@/utils/error/readableErrorMessage';
import { parseFullName, validateFullNameForPerson } from '@/utils/person/fullNameValidation';

type Props = StackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'Register', screenClass: 'RegisterScreen' });
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const { loadPersonalData } = useLoadPersonalData();
  const [fullName, setFullName] = useState(route.params?.userName || '');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateCodeError, setAffiliateCodeError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PersonalDataFieldErrors>({});

  const scrollViewRef = useRef<ScrollView>(null);
  const { scrollToFocusedField, handleContentLayout, handleContainerLayout, handleFieldLayout } =
    useScrollToFocusedField(scrollViewRef);

  const adornmentStyle = useMemo(() => {
    const adornmentSize = windowWidth * 0.45;
    return {
      width: adornmentSize,
      height: adornmentSize,
      right: -adornmentSize * 0.25,
      top: -adornmentSize * 0.36,
    };
  }, [windowWidth]);

  useEffect(() => {
    let cancelled = false;
    loadPersonalData().then((data) => {
      if (cancelled || !data) return;
      setFullName((prev) => (prev.trim() ? prev : data.fullName));
      setBirthdate(data.birthdate);
      setGender(data.gender);
      setWeight(data.weight);
      setHeight(data.height);
    });
    return () => {
      cancelled = true;
    };
  }, [loadPersonalData]);

  const topSectionStyle = useMemo(() => [styles.topSection], []);

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

  const handleFormChange = useCallback(
    (patch: Partial<{ fullName: string; birthdate: string; gender: string; weight: string; height: string }>) => {
      if (patch.fullName !== undefined) setFullName(patch.fullName);
      if (patch.birthdate !== undefined) setBirthdate(patch.birthdate);
      if (patch.gender !== undefined) setGender(patch.gender);
      if (patch.weight !== undefined) setWeight(patch.weight);
      if (patch.height !== undefined) setHeight(patch.height);
    },
    [],
  );

  const handleClearFieldError = useCallback((field: keyof PersonalDataFieldErrors) => {
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }, []);

  const navigateAfterRegister = useCallback(
    (parsedFirstName: string) => {
      const nextScreen = getNextOnboardingScreen('Register');
      const params = {
        firstName: parsedFirstName || fullName.trim() || route.params?.userName || 'Usuário',
      };
      navigation.navigate(nextScreen as never, params as never);
    },
    [fullName, navigation, route.params?.userName],
  );

  const handleNext = useCallback(async () => {
    try {
      setIsLoading(true);
      setFieldErrors({});
      setAffiliateCodeError(undefined);

      const errors: PersonalDataFieldErrors = {};

      const fullNameIssue = validateFullNameForPerson(fullName);
      if (fullNameIssue === 'empty') {
        errors.fullName = t('auth.fillFullName');
      } else if (fullNameIssue === 'invalid_chars') {
        errors.fullName = t('auth.validationInvalidFullName');
      } else if (fullNameIssue === 'missing_surname') {
        errors.fullName = t('auth.validationFullNameRequiresSurname');
      } else if (fullNameIssue === 'part_too_short') {
        errors.fullName = t('auth.validationFullNamePartTooShort');
      }

      const birthdateISO = birthdate.trim() ? birthdateToISO(birthdate.trim()) : null;
      if (!birthdate.trim()) {
        errors.birthdate = t('auth.requiredField');
      } else if (!birthdateISO) {
        errors.birthdate = t('auth.validationInvalidBirthdate');
      } else {
        const age = ageFromBirthdateISO(birthdateISO);
        if (age == null || age < 1 || age > 120) {
          errors.birthdate = t('auth.validationOutOfRange', { min: '1', max: '120' });
        }
      }

      if (!gender.trim()) {
        errors.gender = t('auth.requiredField');
      }

      const weightNormalized = weight.trim().replace(/,/g, '.');
      const weightError = validateNumericField(weightNormalized, 1, 499, true);
      if (weightError) errors.weight = weightError;

      const heightNormalized = height.trim().replace(/,/g, '.');
      const heightError = validateNumericField(heightNormalized, 1, 499, true);
      if (heightError) errors.height = heightError;

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setIsLoading(false);
        return;
      }

      const { firstName, lastName } = parseFullName(fullName);

      const personData: PersonData = {
        firstName,
        lastName,
        gender: gender.trim(),
        birthdate: birthdateISO!,
        weight: weight.trim().replace(/,/g, '.'),
        height: height.trim().replace(/,/g, '.'),
      };

      await personsService.createOrUpdatePerson(personData);
      await userService.syncStoredUserName(fullName.trim());

      const trimmedAffiliateCode = affiliateCode.trim();
      if (trimmedAffiliateCode) {
        try {
          await advertiserAffiliateService.linkByAffiliateCode(trimmedAffiliateCode);
        } catch (error: unknown) {
          logger.error('[RegisterScreen] Código de afiliado inválido ou falha no vínculo', error);
          setAffiliateCodeError(getReadableErrorMessage(error, t('auth.affiliateCodeInvalid')));
          setIsLoading(false);
          return;
        }
      }

      navigateAfterRegister(firstName || fullName.trim());
    } catch (error: unknown) {
      const message = getReadableErrorMessage(error, t('auth.registerError'));
      logger.error('[RegisterScreen] Erro ao salvar dados da pessoa', error);
      Alert.alert(t('common.error'), message);
    } finally {
      setIsLoading(false);
    }
  }, [affiliateCode, fullName, gender, birthdate, weight, height, navigateAfterRegister, t, validateNumericField]);

  const handleSkip = useCallback(async () => {
    try {
      setIsSkipLoading(true);
      const trimmedName = fullName.trim();
      if (trimmedName) {
        await userService.syncStoredUserName(trimmedName);
        if (!validateFullNameForPerson(trimmedName)) {
          const { firstName, lastName } = parseFullName(trimmedName);
          try {
            await personsService.createOrUpdatePerson({ firstName, lastName });
          } catch (error) {
            logger.warn('[RegisterScreen] Falha ao persistir nome ao pular cadastro', { cause: error });
          }
        }
      }
      const firstName = trimmedName.split(/\s+/)[0] || fullName || route.params?.userName || 'Usuário';
      navigateAfterRegister(firstName);
    } catch (error: unknown) {
      const message = getReadableErrorMessage(error, t('auth.registerError'));
      logger.error('[RegisterScreen] Erro ao pular registro', error);
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSkipLoading(false);
    }
  }, [fullName, navigateAfterRegister, route.params?.userName, t]);

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ onBackPress: () => navigation.goBack() }}
      contentContainerStyle={styles.safeArea}
      contentBackgroundColor={COLORS.BACKGROUND}
    >
      <KeyboardAwareScreen
        scrollRef={scrollViewRef}
        scrollViewStyle={styles.scrollView}
        scrollContentContainerStyle={styles.scrollContent}
        keyboardFooterLiftExtra={SPACING.MD}
        footer={
          <View style={styles.footer}>
            <ButtonGroup style={styles.buttonGroup}>
              <PrimaryButton
                label={isLoading ? t('common.saving') : t('common.save')}
                onPress={handleNext}
                disabled={isLoading || isSkipLoading}
                size='large'
              />
              <SecondaryButton
                label={t('common.configureLater')}
                onPress={handleSkip}
                disabled={isLoading || isSkipLoading}
                size='large'
              />
            </ButtonGroup>
          </View>
        }
      >
        <View collapsable={false} style={styles.scrollContentInner}>
          <View style={topSectionStyle}>
            <View style={styles.headerContent}>
              <Title title={t('auth.registerTitle')} />
              <View style={styles.invitationSection}>
                <CachedImage
                  source={GradientSplash5}
                  style={[styles.titleAdornment, adornmentStyle]}
                  contentFit='contain'
                />
                <Text style={styles.invitationQuestion}>{t('auth.registerInvitationQuestion')}</Text>
                <View style={styles.affiliateCodeField}>
                  <TextInput
                    label={t('auth.registerEnterCode')}
                    value={affiliateCode}
                    onChangeText={(text) => {
                      setAffiliateCode(text);
                      if (affiliateCodeError) setAffiliateCodeError(undefined);
                    }}
                    placeholder={t('auth.registerCodePlaceholder')}
                    autoCapitalize='characters'
                    autoCorrect={false}
                    onFocus={() => {
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                    errorText={affiliateCodeError}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.content} onLayout={handleContentLayout}>
            <PersonalDataFieldsForm
              variant='register'
              values={{ fullName, birthdate, gender, weight, height }}
              fieldErrors={fieldErrors}
              onChange={handleFormChange}
              onClearFieldError={handleClearFieldError}
              scrollToFocusedField={scrollToFocusedField}
              onFieldLayout={handleFieldLayout}
              onContainerLayout={handleContainerLayout}
            />
          </View>
        </View>
      </KeyboardAwareScreen>
    </ScreenWithHeader>
  );
};

export default RegisterScreen;
