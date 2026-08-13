import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput as RNTextInput, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ModalBase } from '@/components/ui/modals/shared';
import { SecondaryButton, PrimaryButton } from '@/components/ui/buttons';
import { useTranslation } from '@/hooks/i18n';
import { styles } from './styles';

type ActivityType = 'task' | 'event';

export type CreateActivityFormData = {
  name: string;
  type: ActivityType;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  description?: string;
  reminderEnabled: boolean;
  reminderMinutes?: number;
  addToDeviceCalendar: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: CreateActivityFormData, activityId?: string) => void;
  activityId?: string;
  initialData?: Partial<CreateActivityFormData> & {
    name: string;
    type: ActivityType;
    reminderEnabled: boolean;
  };
};

const CreateActivityModal: React.FC<Props> = ({ visible, onClose, onSave, activityId, initialData }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<ActivityType>(initialData?.type || 'event');
  const [startDateValue, setStartDateValue] = useState(
    initialData?.startDate ? new Date(initialData.startDate) : new Date(),
  );
  const [startTimeValue, setStartTimeValue] = useState(
    initialData?.startTime ? parseTimeToDate(initialData.startTime) : new Date(),
  );
  const [endDateValue, setEndDateValue] = useState(initialData?.endDate ? new Date(initialData.endDate) : new Date());
  const [endTimeValue, setEndTimeValue] = useState(
    initialData?.endTime ? parseTimeToDate(initialData.endTime) : new Date(),
  );
  const [location, setLocation] = useState(initialData?.location || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminderEnabled || false);
  const [reminderMinutes, setReminderMinutes] = useState(initialData?.reminderMinutes || 5);
  const [addToDeviceCalendar, setAddToDeviceCalendar] = useState(initialData?.addToDeviceCalendar ?? true);

  // Helper function to parse time string to Date
  function parseTimeToDate(timeString: string): Date {
    const date = new Date();
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours, 10);
    if (period === 'pm' && hour !== 12) {
      hour += 12;
    }
    if (period === 'am' && hour === 12) {
      hour = 0;
    }
    date.setHours(hour, parseInt(minutes, 10), 0, 0);
    return date;
  }

  React.useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name || '');
        setType(initialData.type || 'event');
        setStartDateValue(initialData.startDate ? new Date(initialData.startDate) : new Date());
        setStartTimeValue(initialData.startTime ? parseTimeToDate(initialData.startTime) : new Date());
        setEndDateValue(initialData.endDate ? new Date(initialData.endDate) : new Date());
        setEndTimeValue(initialData.endTime ? parseTimeToDate(initialData.endTime) : new Date());
        setLocation(initialData.location || '');
        setDescription(initialData.description || '');
        setReminderEnabled(initialData.reminderEnabled || false);
        setReminderMinutes(initialData.reminderMinutes || 5);
        setAddToDeviceCalendar(initialData.addToDeviceCalendar ?? true);
      } else {
        setName('');
        setType('event');
        setStartDateValue(new Date());
        setStartTimeValue(new Date());
        setEndDateValue(new Date());
        setEndTimeValue(new Date());
        setLocation('');
        setDescription('');
        setReminderEnabled(false);
        setReminderMinutes(5);
        setAddToDeviceCalendar(true);
      }
    }
  }, [visible, initialData]);

  // Picker visibility states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Format date for display
  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}.`;
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const startDate = formatDate(startDateValue);
  const startTime = formatTime(startTimeValue);
  const endDate = formatDate(endDateValue);
  const endTime = formatTime(endTimeValue);

  // Função para formatar data no formato YYYY-MM-DD usando timezone local
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSave = () => {
    onSave(
      {
        name,
        type,
        startDate: formatDateLocal(startDateValue),
        startTime: formatTime(startTimeValue),
        endDate: formatDateLocal(endDateValue),
        endTime: formatTime(endTimeValue),
        location,
        description: type === 'task' ? description : undefined,
        reminderEnabled,
        reminderMinutes: reminderEnabled ? reminderMinutes : undefined,
        addToDeviceCalendar,
      },
      activityId,
    );
    onClose();
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setStartDateValue(selectedDate);
      if (Platform.OS === 'ios') {
        setShowStartDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowStartDatePicker(false);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setStartTimeValue(selectedTime);
      if (Platform.OS === 'ios') {
        setShowStartTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowStartTimePicker(false);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setEndDateValue(selectedDate);
      if (Platform.OS === 'ios') {
        setShowEndDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowEndDatePicker(false);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setEndTimeValue(selectedTime);
      if (Platform.OS === 'ios') {
        setShowEndTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowEndTimePicker(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <ModalBase
      visible={visible}
      onClose={onClose}
      showTitle={false}
      header={
        <View style={styles.header}>
          <SecondaryButton label={t('common.cancel')} onPress={handleCancel} />
          <PrimaryButton label={t('common.save')} onPress={handleSave} icon='arrow-upward' iconPosition='right' />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <RNTextInput
            value={name}
            onChangeText={setName}
            placeholder={t('activities.activityName')}
            placeholderTextColor='#999'
            style={styles.nameInput}
          />
        </View>

        <View style={styles.typeSelector}>
          <SecondaryButton
            label={t('activities.task')}
            onPress={() => setType('task')}
            style={[styles.typeButtonBase, type === 'task' && styles.typeButtonSelected]}
          />
          <SecondaryButton
            label={t('activities.event')}
            onPress={() => setType('event')}
            style={[styles.typeButtonBase, type === 'event' && styles.typeButtonSelected]}
          />
        </View>
        <View style={styles.divider} />

        {type === 'task' && (
          <>
            <View style={styles.inputContainer}>
              <RNTextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('activities.description')}
                placeholderTextColor='#999'
                style={styles.descriptionInput}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeFieldContainer}>
            <SecondaryButton
              label={startDate}
              onPress={() => setShowStartDatePicker(true)}
              variant='dark'
              icon='calendar-today'
              iconPosition='left'
              iconSize={16}
            />
            {showStartDatePicker && (
              <View style={styles.pickerContainer}>
                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent
                    visible={showStartDatePicker}
                    animationType='slide'
                    onRequestClose={() => setShowStartDatePicker(false)}
                  >
                    <TouchableOpacity
                      style={styles.pickerOverlay}
                      activeOpacity={1}
                      onPress={() => setShowStartDatePicker(false)}
                    >
                      <View style={styles.pickerContent}>
                        <DateTimePicker
                          value={startDateValue}
                          mode='date'
                          display='spinner'
                          onChange={handleStartDateChange}
                          style={styles.picker}
                        />
                      </View>
                    </TouchableOpacity>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={startDateValue}
                    mode='date'
                    display='default'
                    onChange={handleStartDateChange}
                  />
                )}
              </View>
            )}
          </View>
          <View style={styles.dateTimeFieldContainer}>
            <SecondaryButton
              label={t('activities.startsAt', { time: startTime })}
              onPress={() => setShowStartTimePicker(true)}
              variant='dark'
            />
            {showStartTimePicker && (
              <View style={styles.pickerContainer}>
                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent
                    visible={showStartTimePicker}
                    animationType='slide'
                    onRequestClose={() => setShowStartTimePicker(false)}
                  >
                    <TouchableOpacity
                      style={styles.pickerOverlay}
                      activeOpacity={1}
                      onPress={() => setShowStartTimePicker(false)}
                    >
                      <View style={styles.pickerContent}>
                        <DateTimePicker
                          value={startTimeValue}
                          mode='time'
                          display='spinner'
                          onChange={handleStartTimeChange}
                          style={styles.picker}
                        />
                      </View>
                    </TouchableOpacity>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={startTimeValue}
                    mode='time'
                    display='default'
                    onChange={handleStartTimeChange}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeFieldContainer}>
            <SecondaryButton
              label={endDate}
              onPress={() => setShowEndDatePicker(true)}
              variant='dark'
              icon='calendar-today'
              iconPosition='left'
              iconSize={16}
            />
            {showEndDatePicker && (
              <View style={styles.pickerContainer}>
                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent
                    visible={showEndDatePicker}
                    animationType='slide'
                    onRequestClose={() => setShowEndDatePicker(false)}
                  >
                    <TouchableOpacity
                      style={styles.pickerOverlay}
                      activeOpacity={1}
                      onPress={() => setShowEndDatePicker(false)}
                    >
                      <View style={styles.pickerContent}>
                        <DateTimePicker
                          value={endDateValue}
                          mode='date'
                          display='spinner'
                          onChange={handleEndDateChange}
                          style={styles.picker}
                        />
                      </View>
                    </TouchableOpacity>
                  </Modal>
                ) : (
                  <DateTimePicker value={endDateValue} mode='date' display='default' onChange={handleEndDateChange} />
                )}
              </View>
            )}
          </View>
          <View style={styles.dateTimeFieldContainer}>
            <SecondaryButton
              label={t('activities.endsAt', { time: endTime })}
              onPress={() => setShowEndTimePicker(true)}
              variant='dark'
            />
            {showEndTimePicker && (
              <View style={styles.pickerContainer}>
                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent
                    visible={showEndTimePicker}
                    animationType='slide'
                    onRequestClose={() => setShowEndTimePicker(false)}
                  >
                    <TouchableOpacity
                      style={styles.pickerOverlay}
                      activeOpacity={1}
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <View style={styles.pickerContent}>
                        <DateTimePicker
                          value={endTimeValue}
                          mode='time'
                          display='spinner'
                          onChange={handleEndTimeChange}
                          style={styles.picker}
                        />
                      </View>
                    </TouchableOpacity>
                  </Modal>
                ) : (
                  <DateTimePicker value={endTimeValue} mode='time' display='default' onChange={handleEndTimeChange} />
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.locationContainer}>
          <Icon name='place' size={16} color='#6E6A6A' style={styles.locationIcon} />
          <RNTextInput
            value={location}
            onChangeText={setLocation}
            placeholder={t('activities.addressOrMeetUrl')}
            placeholderTextColor='#999'
            style={styles.locationInput}
            multiline={false}
            autoCapitalize='none'
            autoCorrect={false}
          />
        </View>
        <View style={styles.divider} />

        <View style={styles.reminderContainer}>
          <View style={styles.reminderContent}>
            <Icon name='notifications' size={20} color='#001137' />
            <Text style={styles.reminderText}>{t('activities.reminderMinutes', { minutes: reminderMinutes })}</Text>
          </View>
          <View style={styles.switchContainer}>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#E0E0E0', true: '#0154f8' }}
              thumbColor='#FFFFFF'
            />
            <Text style={styles.switchLabel}>{reminderEnabled ? t('activities.on') : t('activities.off')}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.reminderContainer}>
          <View style={styles.reminderContent}>
            <Icon name='event' size={20} color='#001137' />
            <Text style={styles.reminderText}>
              {t('activities.markOnDeviceCalendar', { defaultValue: 'Marcar na agenda do celular' })}
            </Text>
          </View>
          <View style={styles.switchContainer}>
            <Switch
              value={addToDeviceCalendar}
              onValueChange={setAddToDeviceCalendar}
              trackColor={{ false: '#E0E0E0', true: '#0154f8' }}
              thumbColor='#FFFFFF'
            />
            <Text style={styles.switchLabel}>{addToDeviceCalendar ? t('activities.on') : t('activities.off')}</Text>
          </View>
        </View>
      </View>
    </ModalBase>
  );
};

export default CreateActivityModal;
