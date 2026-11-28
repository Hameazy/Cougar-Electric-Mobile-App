import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import TechnicianScreen from '../components/TechnicianScreen';

type Settings = {
  available: boolean;
  serviceRadius: number;
  skills: string[];
  startTime: string;
  endTime: string;
};

const STORAGE_KEY = 'technician-local-settings';

const defaultSettings: Settings = {
  available: false,
  serviceRadius: 15,
  skills: [],
  startTime: '08:00',
  endTime: '17:00',
};

const radiusOptions = [5, 10, 15, 25, 50];

const skillOptions = [
  'Panel upgrades',
  'Outages',
  'EV charger install',
  'Wiring',
  'Lighting',
  'Outlets',
  'Troubleshooting',
  'Generators',
  'Smoke detectors',
];

export default function TechnicianSettings() {
  const [settings, setSettings] =
    useState<Settings>(defaultSettings);

  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Restore previously saved preferences when the screen opens.
  useEffect(() => {
    async function loadSettings() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          setSettings({
            ...defaultSettings,
            ...JSON.parse(saved),
          });
        }
      } catch {
        setError(true);
        setFeedback('Unable to load saved settings.');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateSettings(changes: Partial<Settings>) {
    setSettings(previous => ({
      ...previous,
      ...changes,
    }));

    setFeedback('');
    setError(false);
  }

  function toggleSkill(skill: string) {
    const selectedSkills = settings.skills.includes(skill)
      ? settings.skills.filter(item => item !== skill)
      : [...settings.skills, skill];

    updateSettings({ skills: selectedSkills });
  }

  // Make sure working hours use a valid 24-hour time format.
  function validTime(time: string) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  }

  async function saveSettings() {
    setFeedback('');
    setError(false);

    if (
      !validTime(settings.startTime) ||
      !validTime(settings.endTime)
    ) {
      setError(true);
      setFeedback('Enter valid working hours in HH:MM format.');
      return;
    }

    if (settings.startTime >= settings.endTime) {
      setError(true);
      setFeedback('End time must be later than start time.');
      return;
    }

    setSaving(true);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

      setFeedback('Your preferences have been saved on this device.');
    } catch {
      setError(true);
      setFeedback('Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <TechnicianScreen
      title="Settings"
      subtitle="Manage your availability and service preferences."
    >
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>LOCAL PREFERENCES</Text>
        <Text style={styles.detail}>
          Settings are saved on this device. Live dispatch
          integration is not connected yet.
        </Text>
      </View>

      {loading ? (
        <Text style={styles.detail}>Loading settings...</Text>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Availability</Text>

            <View style={styles.row}>
              <View style={styles.body}>
                <Text style={styles.heading}>
                  {settings.available
                    ? 'Available for jobs'
                    : 'Unavailable'}
                </Text>

                <Text style={styles.detail}>
                  Set your preferred availability for service requests.
                </Text>
              </View>

              <Switch
                accessibilityLabel="Available for jobs"
                value={settings.available}
                disabled={saving}
                onValueChange={value =>
                  updateSettings({ available: value })
                }
                trackColor={{
                  false: '#354157',
                  true: '#20CC79',
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Text style={[
              styles.status,
              {
                color: settings.available
                  ? '#20CC79'
                  : '#94A2B8',
              },
            ]}>
              ● {settings.available ? 'AVAILABLE' : 'OFFLINE'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Radius</Text>

            <Text style={styles.detail}>
              Choose how far you are willing to travel
              for service requests.
            </Text>

            <Text style={styles.radiusValue}>
              {settings.serviceRadius} miles
            </Text>

            <View style={styles.options}>
              {radiusOptions.map(radius => (
                <Pressable
                  key={radius}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: settings.serviceRadius === radius,
                  }}
                  disabled={saving}
                  onPress={() =>
                    updateSettings({ serviceRadius: radius })
                  }
                  style={[
                    styles.option,
                    settings.serviceRadius === radius &&
                      styles.selectedOption,
                  ]}
                >
                  <Text style={[
                    styles.optionText,
                    settings.serviceRadius === radius &&
                      styles.selectedText,
                  ]}>
                    {radius} mi
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>
                Skills & Specialties
              </Text>

              <Text style={styles.detail}>
                {settings.skills.length} selected
              </Text>
            </View>

            <Text style={styles.detail}>
              Select the electrical services you can perform.
            </Text>

            <View style={styles.options}>
              {skillOptions.map(skill => {
                const selected = settings.skills.includes(skill);

                return (
                  <Pressable
                    key={skill}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    disabled={saving}
                    onPress={() => toggleSkill(skill)}
                    style={[
                      styles.option,
                      selected && styles.selectedOption,
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      selected && styles.selectedText,
                    ]}>
                      {selected ? '✓ ' : '+ '}{skill}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Working Hours
            </Text>

            <Text style={styles.detail}>
              Set your preferred daily schedule using
              24-hour time.
            </Text>

            <View style={styles.hours}>
              <View style={styles.body}>
                <Text style={styles.label}>START TIME</Text>

                <TextInput
                  accessibilityLabel="Start time"
                  value={settings.startTime}
                  editable={!saving}
                  onChangeText={value =>
                    updateSettings({ startTime: value })
                  }
                  placeholder="08:00"
                  placeholderTextColor="#74839B"
                  maxLength={5}
                  style={styles.input}
                />
              </View>

              <View style={styles.body}>
                <Text style={styles.label}>END TIME</Text>

                <TextInput
                  accessibilityLabel="End time"
                  value={settings.endTime}
                  editable={!saving}
                  onChangeText={value =>
                    updateSettings({ endTime: value })
                  }
                  placeholder="17:00"
                  placeholderTextColor="#74839B"
                  maxLength={5}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.detail}>
              Example: 08:00 to 17:00 means 8 AM to 5 PM.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={saveSettings}
            style={({ pressed }) => [
              styles.saveButton,
              (pressed || saving) && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.saveText}>
              {saving ? 'SAVING...' : 'SAVE PREFERENCES'}
            </Text>
          </Pressable>
        </>
      )}

      {!!feedback && (
        <View style={styles.feedback}>
          <Text
            accessibilityRole="alert"
            style={{
              color: error ? '#FF8585' : '#53E49A',
              fontWeight: '700',
              lineHeight: 21,
            }}
          >
            {feedback}
          </Text>
        </View>
      )}
    </TechnicianScreen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: '#142139',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  noticeTitle: {
    color: '#F5B900',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#101827',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  detail: {
    color: '#94A2B8',
    fontSize: 13,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  body: {
    flex: 1,
    gap: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  radiusValue: {
    color: '#F5B900',
    fontSize: 32,
    fontWeight: '900',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    backgroundColor: '#142139',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  selectedOption: {
    backgroundColor: '#F5B900',
    borderColor: '#F5B900',
  },
  optionText: {
    color: '#94A2B8',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedText: {
    color: '#07101F',
  },
  hours: {
    flexDirection: 'row',
    gap: 14,
  },
  label: {
    color: '#94A2B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#07101F',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#F5B900',
    borderRadius: 16,
    padding: 19,
    alignItems: 'center',
  },
  saveText: {
    color: '#07101F',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  feedback: {
    backgroundColor: '#142139',
    borderRadius: 14,
    padding: 16,
  },
});