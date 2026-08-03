import React, { useMemo, useState } from 'react';
import { View, Text, Platform, Keyboard, Modal, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TextInput } from '@/components/ui';
import { useTranslation } from '@/hooks/i18n';
import type { PersonFormData } from '@/hooks/person/useLoadPersonalData';
import {
  BIRTHDATE_MASK,
  parseWeightInput,
  parseHeightInput,
  formatBirthdateInput,
} from '@/utils/formatters/personFormats';
import { formatPhone } from '@/utils/formatters/inputFormatters';
import { COLORS } from '@/constants';
import { styles } from './styles';

const GENDER_OPTIONS = [
  { value: 'female', i18nKey: 'auth.genderFemale' },
  { value: 'male', i18nKey: 'auth.genderMale' },
  { value: 'non_binary', i18nKey: 'auth.genderNonBinary' },
  { value: 'other', i18nKey: 'auth.genderOther' },
  { value: 'prefer_not_to_say', i18nKey: 'auth.genderPreferNotToSay' },
] as const;

export type PersonalDataFieldErrors = {
  fullName?: string;
  birthdate?: string;
  gender?: string;
  weight?: string;
  height?: string;
  phone?: string;
};

type Props = {
  values: PersonFormData;
  fieldErrors: PersonalDataFieldErrors;
  onChange: (patch: Partial<PersonFormData>) => void;
  onClearFieldError: (field: keyof PersonalDataFieldErrors) => void;
  variant?: 'register' | 'profile';
  scrollToFocusedField?: (fieldKey: string) => void;
  onFieldLayout?: (fieldKey: string) => (event: LayoutChangeEvent) => void;
  onContainerLayout?: (event: LayoutChangeEvent) => void;
};

const PersonalDataFieldsForm: React.FC<Props> = ({
  values,
  fieldErrors,
  onChange,
  onClearFieldError,
  variant = 'register',
  scrollToFocusedField,
  onFieldLayout,
  onContainerLayout,
}) => {
  const { t } = useTranslation();
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  const genderLabel = useMemo(() => {
    if (!values.gender) return '';
    const opt = GENDER_OPTIONS.find((o) => o.value === values.gender);
    return opt ? t(opt.i18nKey) : values.gender;
  }, [values.gender, t]);

  const fields = (
    <View style={styles.fieldsContainer} onLayout={onContainerLayout}>
      <View collapsable={false} style={styles.fieldRow} onLayout={onFieldLayout?.('fullName')}>
        <TextInput
          label={t('auth.fullName')}
          value={values.fullName}
          onChangeText={(text) => {
            onChange({ fullName: text });
            onClearFieldError('fullName');
          }}
          placeholder={t('auth.fullNamePlaceholder')}
          onFocus={() => scrollToFocusedField?.('fullName')}
          errorText={fieldErrors.fullName}
          required
        />
      </View>

      <View collapsable={false} style={styles.fieldRow} onLayout={onFieldLayout?.('birthdate')}>
        <TextInput
          label={t('auth.birthdate')}
          value={values.birthdate}
          onChangeText={(text) => {
            onChange({ birthdate: formatBirthdateInput(text) });
            onClearFieldError('birthdate');
          }}
          placeholder={BIRTHDATE_MASK}
          keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
          onFocus={() => scrollToFocusedField?.('birthdate')}
          errorText={fieldErrors.birthdate}
          required
        />
      </View>

      <View collapsable={false} style={styles.fieldRow} onLayout={onFieldLayout?.('gender')}>
        <View style={styles.genderLabelRow}>
          <Text style={styles.genderLabel}>{t('auth.gender')}</Text>
          <Text style={styles.requiredMark}> *</Text>
        </View>
        <TouchableOpacity
          style={styles.genderTouchable}
          onPress={() => {
            Keyboard.dismiss();
            setGenderModalVisible(true);
          }}
          activeOpacity={0.7}
          accessibilityLabel={genderLabel ? `${t('auth.gender')}: ${genderLabel}` : t('auth.genderPlaceholder')}
          accessibilityRole='button'
          accessibilityHint={t('auth.genderPlaceholder')}
        >
          <Text style={[styles.genderTouchableText, !genderLabel && styles.genderPlaceholder]} numberOfLines={1}>
            {genderLabel || t('auth.genderPlaceholder')}
          </Text>
          <Icon name='keyboard-arrow-down' size={24} color={COLORS.NEUTRAL.LOW.DARK} />
        </TouchableOpacity>
        {fieldErrors.gender ? <Text style={styles.fieldErrorText}>{fieldErrors.gender}</Text> : null}
      </View>

      <View collapsable={false} style={styles.fieldRow} onLayout={onFieldLayout?.('weight')}>
        <TextInput
          label={t('auth.weight')}
          value={values.weight}
          onChangeText={(text) => {
            onChange({ weight: parseWeightInput(text) });
            onClearFieldError('weight');
          }}
          placeholder='60'
          suffix=' Kg'
          keyboardType='decimal-pad'
          onFocus={() => scrollToFocusedField?.('weight')}
          errorText={fieldErrors.weight}
          required
        />
      </View>

      <View collapsable={false} style={styles.fieldRow} onLayout={onFieldLayout?.('height')}>
        <TextInput
          label={t('auth.height')}
          value={values.height}
          onChangeText={(text) => {
            onChange({ height: parseHeightInput(text) });
            onClearFieldError('height');
          }}
          placeholder='1,60'
          suffix=' m'
          keyboardType='decimal-pad'
          onFocus={() => scrollToFocusedField?.('height')}
          errorText={fieldErrors.height}
          required
        />
      </View>

      <View collapsable={false} style={styles.fieldRow} onLayout={onFieldLayout?.('phone')}>
        <TextInput
          label={t('auth.phone')}
          value={values.phone}
          onChangeText={(text) => {
            onChange({ phone: formatPhone(text) });
            onClearFieldError('phone');
          }}
          placeholder={t('auth.phonePlaceholder')}
          keyboardType='phone-pad'
          onFocus={() => scrollToFocusedField?.('phone')}
          errorText={fieldErrors.phone}
        />
      </View>
    </View>
  );

  return (
    <>
      {variant === 'register' ? (
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>{t('auth.registerInfoMessage')}</Text>
          <Text style={styles.sectionLabel}>Dados Pessoais</Text>
          {fields}
        </View>
      ) : (
        fields
      )}

      <Modal
        visible={genderModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setGenderModalVisible(false)}
        accessibilityLabel={t('auth.gender')}
      >
        <TouchableOpacity
          style={styles.genderModalOverlay}
          activeOpacity={1}
          onPress={() => setGenderModalVisible(false)}
          accessibilityLabel={t('common.close')}
          accessibilityRole='button'
        >
          <View style={styles.genderModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.genderModalHeader}>
              <Text style={styles.genderModalTitle}>{t('auth.gender')}</Text>
              <TouchableOpacity
                onPress={() => setGenderModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel={t('common.close')}
                accessibilityRole='button'
              >
                <Icon name='close' size={24} color={COLORS.NEUTRAL.LOW.PURE} />
              </TouchableOpacity>
            </View>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.genderOption, values.gender === opt.value && styles.genderOptionSelected]}
                onPress={() => {
                  onChange({ gender: opt.value });
                  setGenderModalVisible(false);
                  onClearFieldError('gender');
                }}
                activeOpacity={0.7}
                accessibilityLabel={t(opt.i18nKey)}
                accessibilityRole='button'
                accessibilityState={{ selected: values.gender === opt.value }}
              >
                <Text style={[styles.genderOptionText, values.gender === opt.value && styles.genderOptionTextSelected]}>
                  {t(opt.i18nKey)}
                </Text>
                {values.gender === opt.value && <Icon name='check' size={22} color={COLORS.PRIMARY.PURE} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default PersonalDataFieldsForm;
