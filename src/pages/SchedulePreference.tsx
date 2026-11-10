import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../parts/Logo';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import type { SchedulePreference as Preference } from '../serviceRequests/ServiceRequestTypes';
import { styles } from '../styles/PageStyle';

const DAYS: Preference['day'][] = ['Tomorrow', 'Next business day', 'This week', "I'm flexible"];
const TIMES: Preference['time'][] = ['Morning', 'Afternoon', 'Evening', 'Any time'];

export default function SchedulePreference() {
  const { draft, setSchedulePreference } = useServiceRequestDraft();
  const [day, setDay] = useState<Preference['day'] | undefined>(draft.schedulePreference?.day);
  const [time, setTime] = useState<Preference['time'] | undefined>(draft.schedulePreference?.time);

  function continueRequest() {
    if (!day || !time) return;
    setSchedulePreference({ day, time });
    router.push('/choose-electrical-issue');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topline}>
          <Link href="/dashboard" style={styles.textLink}>← Back</Link>
          <Text style={styles.step}>SCHEDULE SERVICE</Text>
        </View>
        <Logo />
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PREFERRED APPOINTMENT</Text>
          <Text accessibilityRole="header" style={styles.title}>When works best?</Text>
          <Text style={styles.subtitle}>Choose a preferred window. Our team will confirm the exact appointment with you.</Text>
        </View>
        <ChoiceGroup label="Preferred day" values={DAYS} selected={day} onSelect={setDay} />
        <ChoiceGroup label="Preferred time" values={TIMES} selected={time} onSelect={setTime} />
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !day || !time }} disabled={!day || !time} onPress={continueRequest} style={({ pressed }) => [scheduleStyles.continueButton, (!day || !time) && scheduleStyles.disabled, pressed && styles.buttonPressed]}>
          <Text style={scheduleStyles.continueText}>CONTINUE</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChoiceGroup<T extends string>({ label, values, selected, onSelect }: { label: string; values: readonly T[]; selected?: T; onSelect: (value: T) => void }) {
  return (
    <View style={scheduleStyles.group}>
      <Text style={scheduleStyles.label}>{label}</Text>
      <View style={scheduleStyles.choices}>
        {values.map((value) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: selected === value }} onPress={() => onSelect(value)} style={[scheduleStyles.choice, selected === value && scheduleStyles.selected]}>
            <View style={[scheduleStyles.radio, selected === value && scheduleStyles.radioSelected]} />
            <Text style={[scheduleStyles.choiceText, selected === value && scheduleStyles.choiceTextSelected]}>{value}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const scheduleStyles = StyleSheet.create({
  group: { marginBottom: 24 },
  label: { color: '#8290A6', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  choices: { gap: 10 },
  choice: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 14, borderWidth: 1, flexDirection: 'row', minHeight: 58, paddingHorizontal: 16 },
  selected: { backgroundColor: '#172239', borderColor: '#F5B900' },
  radio: { borderColor: '#657188', borderRadius: 8, borderWidth: 2, height: 16, marginRight: 13, width: 16 },
  radioSelected: { backgroundColor: '#F5B900', borderColor: '#F5B900' },
  choiceText: { color: '#D8DFEA', fontSize: 15, fontWeight: '600' },
  choiceTextSelected: { color: '#FFFFFF' },
  continueButton: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 14, justifyContent: 'center', minHeight: 58 },
  disabled: { opacity: 0.4 },
  continueText: { color: '#080C14', fontSize: 14, fontWeight: '800', letterSpacing: 1.1 },
});
