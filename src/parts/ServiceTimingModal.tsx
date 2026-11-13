import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  fromLocalDateKey,
  isPastServiceDate,
  isTodayServiceDate,
  toLocalDateKey,
} from '../serviceRequests/SchedulePreferenceUtils';
import type { RequestTiming } from '../serviceRequests/ServiceRequestTypes';
import { styles } from '../styles/PageStyle';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function firstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function calendarDates(month: Date): (Date | null)[] {
  const firstDay = firstDayOfMonth(month);
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
    12,
  ).getDate();

  return [
    ...Array<Date | null>(firstDay.getDay()).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1, 12),
    ),
  ];
}

export function ServiceTimingModal({
  onClose,
  onSelectDate,
  onSelectUrgent,
  preferredDate,
  timing,
  visible,
}: {
  onClose: () => void;
  onSelectDate: (date: string) => void;
  onSelectUrgent: () => void;
  preferredDate?: string;
  timing: RequestTiming | null;
  visible: boolean;
}) {
  const selectionLocked = useRef(false);
  const initialDate = preferredDate && !isPastServiceDate(preferredDate)
    ? fromLocalDateKey(preferredDate)
    : null;
  const [visibleMonth, setVisibleMonth] = useState(() => firstDayOfMonth(initialDate ?? new Date()));
  const dates = useMemo(() => calendarDates(visibleMonth), [visibleMonth]);
  const currentMonth = firstDayOfMonth(new Date());
  const canGoToPreviousMonth = visibleMonth.getTime() > currentMonth.getTime();

  function selectUrgent() {
    if (selectionLocked.current) return;
    selectionLocked.current = true;
    onSelectUrgent();
  }

  function selectDate(dateKey: string) {
    if (selectionLocked.current || isPastServiceDate(dateKey)) return;
    selectionLocked.current = true;
    if (isTodayServiceDate(dateKey)) onSelectUrgent();
    else onSelectDate(dateKey);
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={modalStyles.backdrop}>
        <View accessibilityViewIsModal style={modalStyles.panel}>
          <Pressable
            accessibilityLabel="Close service timing"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}
            style={({ pressed }) => [modalStyles.closeButton, pressed && styles.buttonPressed]}
          >
            <Text style={modalStyles.closeText}>×</Text>
          </Pressable>

          <ScrollView contentContainerStyle={modalStyles.content} showsVerticalScrollIndicator={false}>
            <Text accessibilityRole="header" style={modalStyles.heading}>When do you need a technician?</Text>

            <Pressable
              accessibilityLabel="Urgent, as soon as possible"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: timing === 'asap' }}
              onPress={selectUrgent}
              style={({ pressed }) => [
                modalStyles.urgentOption,
                timing === 'asap' && modalStyles.urgentSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={[modalStyles.checkbox, timing === 'asap' && modalStyles.checkboxSelected]}>
                {timing === 'asap' && <Text style={modalStyles.checkmark}>✓</Text>}
              </View>
              <View style={modalStyles.urgentCopy}>
                <Text style={modalStyles.urgentTitle}>URGENT</Text>
                <Text style={modalStyles.urgentSubtitle}>As soon as possible</Text>
              </View>
            </Pressable>

            <View style={modalStyles.calendarHeader}>
              <Pressable
                accessibilityLabel="Previous month"
                accessibilityRole="button"
                accessibilityState={{ disabled: !canGoToPreviousMonth }}
                disabled={!canGoToPreviousMonth}
                onPress={() => setVisibleMonth((current) => addMonths(current, -1))}
                style={[modalStyles.monthButton, !canGoToPreviousMonth && modalStyles.disabled]}
              >
                <Text style={modalStyles.monthButtonText}>‹</Text>
              </Pressable>
              <Text style={modalStyles.monthTitle}>
                {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable
                accessibilityLabel="Next month"
                accessibilityRole="button"
                onPress={() => setVisibleMonth((current) => addMonths(current, 1))}
                style={modalStyles.monthButton}
              >
                <Text style={modalStyles.monthButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={modalStyles.weekdayRow}>
              {WEEKDAYS.map((weekday, index) => (
                <Text key={`${weekday}-${index}`} style={modalStyles.weekday}>{weekday}</Text>
              ))}
            </View>
            <View accessibilityRole="radiogroup" style={modalStyles.calendarGrid}>
              {dates.map((date, index) => {
                if (!date) return <View key={`empty-${index}`} style={modalStyles.dayCell} />;

                const dateKey = toLocalDateKey(date);
                const unavailable = isPastServiceDate(dateKey);
                const selected = timing === 'scheduled' && dateKey === preferredDate;
                const today = isTodayServiceDate(dateKey);
                return (
                  <View key={dateKey} style={modalStyles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}${today ? ', urgent service' : ''}`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, disabled: unavailable }}
                      disabled={unavailable}
                      onPress={() => selectDate(dateKey)}
                      style={[
                        modalStyles.dayButton,
                        unavailable && modalStyles.dayUnavailable,
                        today && modalStyles.today,
                        selected && modalStyles.daySelected,
                      ]}
                    >
                      <Text style={[
                        modalStyles.dayText,
                        unavailable && modalStyles.dayTextUnavailable,
                        selected && modalStyles.dayTextSelected,
                      ]}>
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Text style={modalStyles.note}>Today is treated as urgent. Future dates are preferences pending confirmation.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(2, 5, 10, 0.8)', flex: 1, justifyContent: 'center', padding: 20 },
  panel: { backgroundColor: '#0D1727', borderColor: '#3A4250', borderRadius: 20, borderWidth: 1, maxHeight: '90%', maxWidth: 440, position: 'relative', width: '100%' },
  closeButton: { alignItems: 'center', height: 42, justifyContent: 'center', position: 'absolute', right: 8, top: 8, width: 42, zIndex: 1 },
  closeText: { color: '#F8FAFC', fontSize: 29, fontWeight: '300', lineHeight: 31 },
  content: { padding: 20, paddingTop: 54 },
  heading: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', lineHeight: 27, textAlign: 'center' },
  urgentOption: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 14, borderWidth: 1, flexDirection: 'row', marginTop: 20, minHeight: 66, paddingHorizontal: 16 },
  urgentSelected: { borderColor: '#F5B900' },
  checkbox: { alignItems: 'center', borderColor: '#657188', borderRadius: 5, borderWidth: 2, height: 22, justifyContent: 'center', width: 22 },
  checkboxSelected: { backgroundColor: '#F5B900', borderColor: '#F5B900' },
  checkmark: { color: '#080C14', fontSize: 15, fontWeight: '900' },
  urgentCopy: { marginLeft: 13 },
  urgentTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', letterSpacing: 0.8 },
  urgentSubtitle: { color: '#AAB5C7', fontSize: 12, marginTop: 3 },
  calendarHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 20 },
  monthButton: { alignItems: 'center', backgroundColor: '#172239', borderRadius: 10, height: 38, justifyContent: 'center', width: 38 },
  monthButtonText: { color: '#F8FAFC', fontSize: 28, lineHeight: 30 },
  monthTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  weekdayRow: { flexDirection: 'row' },
  weekday: { color: '#8290A6', fontSize: 11, fontWeight: '700', paddingVertical: 6, textAlign: 'center', width: '14.2857%' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { alignItems: 'center', height: 42, justifyContent: 'center', width: '14.2857%' },
  dayButton: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  dayUnavailable: { opacity: 0.28 },
  today: { borderColor: '#F5B900', borderWidth: 1 },
  daySelected: { backgroundColor: '#F5B900' },
  dayText: { color: '#D8DFEA', fontSize: 13, fontWeight: '600' },
  dayTextUnavailable: { color: '#657188' },
  dayTextSelected: { color: '#080C14', fontWeight: '900' },
  note: { color: '#9EACC1', fontSize: 11, lineHeight: 17, marginTop: 14, textAlign: 'center' },
  disabled: { opacity: 0.4 },
});
