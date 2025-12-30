import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClose: () => void;
  visible: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  onClose,
  visible,
}: DateRangePickerProps) {
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [selectingStart, setSelectingStart] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDayPress = (day: number) => {
    const selectedDate = selectingStart
      ? new Date(tempStart.getFullYear(), tempStart.getMonth(), day)
      : new Date(tempEnd.getFullYear(), tempEnd.getMonth(), day);

    if (selectingStart) {
      setTempStart(selectedDate);
      setSelectingStart(false);
    } else {
      // Ensure end date is after start date
      if (selectedDate >= tempStart) {
        setTempEnd(selectedDate);
      } else {
        // Swap if end is before start
        setTempEnd(tempStart);
        setTempStart(selectedDate);
      }
    }
  };

  const handleMonthChange = (month: number, isStart: boolean) => {
    if (isStart) {
      setTempStart(new Date(tempStart.getFullYear(), month, tempStart.getDate()));
    } else {
      setTempEnd(new Date(tempEnd.getFullYear(), month, tempEnd.getDate()));
    }
  };

  const handleYearChange = (year: number, isStart: boolean) => {
    if (isStart) {
      setTempStart(new Date(year, tempStart.getMonth(), tempStart.getDate()));
    } else {
      setTempEnd(new Date(year, tempEnd.getMonth(), tempEnd.getDate()));
    }
  };

  const handleApply = () => {
    // Set start date to beginning of day
    const adjustedStart = new Date(tempStart);
    adjustedStart.setHours(0, 0, 0, 0);

    // Set end date to end of day
    const adjustedEnd = new Date(tempEnd);
    adjustedEnd.setHours(23, 59, 59, 999);

    onRangeChange(adjustedStart, adjustedEnd);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderCalendar = (date: Date, isStart: boolean) => {
    const daysInMonth = getDaysInMonth(date.getFullYear(), date.getMonth());
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const days = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      const isSelected =
        (isStart && selectingStart && day === tempStart.getDate() &&
         date.getMonth() === tempStart.getMonth() && date.getFullYear() === tempStart.getFullYear()) ||
        (!isStart && !selectingStart && day === tempEnd.getDate() &&
         date.getMonth() === tempEnd.getMonth() && date.getFullYear() === tempEnd.getFullYear());
      const isInRange = currentDate >= tempStart && currentDate <= tempEnd;

      days.push(
        <Pressable
          key={day}
          style={[
            styles.dayCell,
            isInRange && styles.dayCellInRange,
            isSelected && styles.dayCellSelected,
          ]}
          onPress={() => {
            if (isStart) setSelectingStart(true);
            else setSelectingStart(false);
            handleDayPress(day);
          }}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.dayTextSelected,
            ]}
          >
            {day}
          </Text>
        </Pressable>
      );
    }

    return days;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Seleccionar Rango de Fechas</Text>

          {/* Selected Range Display */}
          <View style={styles.rangeDisplay}>
            <Pressable
              style={[styles.dateBox, selectingStart && styles.dateBoxActive]}
              onPress={() => setSelectingStart(true)}
            >
              <Text style={styles.dateLabel}>Desde</Text>
              <Text style={styles.dateValue}>{formatDate(tempStart)}</Text>
            </Pressable>
            <Text style={styles.rangeSeparator}>→</Text>
            <Pressable
              style={[styles.dateBox, !selectingStart && styles.dateBoxActive]}
              onPress={() => setSelectingStart(false)}
            >
              <Text style={styles.dateLabel}>Hasta</Text>
              <Text style={styles.dateValue}>{formatDate(tempEnd)}</Text>
            </Pressable>
          </View>

          {/* Month/Year Selectors */}
          <View style={styles.selectors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {MONTHS.map((month, index) => (
                <Pressable
                  key={month}
                  style={[
                    styles.monthPill,
                    (selectingStart ? tempStart : tempEnd).getMonth() === index &&
                      styles.monthPillActive,
                  ]}
                  onPress={() => handleMonthChange(index, selectingStart)}
                >
                  <Text
                    style={[
                      styles.monthPillText,
                      (selectingStart ? tempStart : tempEnd).getMonth() === index &&
                        styles.monthPillTextActive,
                    ]}
                  >
                    {month.slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.yearSelector}>
            {years.map((year) => (
              <Pressable
                key={year}
                style={[
                  styles.yearPill,
                  (selectingStart ? tempStart : tempEnd).getFullYear() === year &&
                    styles.yearPillActive,
                ]}
                onPress={() => handleYearChange(year, selectingStart)}
              >
                <Text
                  style={[
                    styles.yearPillText,
                    (selectingStart ? tempStart : tempEnd).getFullYear() === year &&
                      styles.yearPillTextActive,
                  ]}
                >
                  {year}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendar}>
            <View style={styles.weekDays}>
              {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {renderCalendar(selectingStart ? tempStart : tempEnd, selectingStart)}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dateBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateBoxActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  rangeSeparator: {
    fontSize: 18,
    color: '#9ca3af',
    marginHorizontal: 12,
  },
  selectors: {
    marginBottom: 8,
  },
  monthPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  monthPillActive: {
    backgroundColor: '#3b82f6',
  },
  monthPillText: {
    fontSize: 13,
    color: '#374151',
  },
  monthPillTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  yearPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  yearPillActive: {
    backgroundColor: '#3b82f6',
  },
  yearPillText: {
    fontSize: 13,
    color: '#374151',
  },
  yearPillTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  calendar: {
    marginBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellInRange: {
    backgroundColor: '#eff6ff',
  },
  dayCellSelected: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
