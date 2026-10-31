import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { validateIssueDescription } from '../helpers/ServiceRequestValidation';
import { Logo } from '../parts/Logo';
import { styles } from '../styles/PageStyle';

const MAX_DESCRIPTION_LENGTH = 500;

export default function EmergencyDescription() {
  const [description, setDescription] = useState('');
  const [attempted, setAttempted] = useState(false);
  const error = attempted ? validateIssueDescription(description) : undefined;

  function continueToLocation() {
    Keyboard.dismiss();
    setAttempted(true);
    if (validateIssueDescription(description)) return;

    router.push({
      pathname: '/emergency-location',
      params: { description: description.trim() },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topline}>
            <Text style={styles.toplineText}>EMERGENCY SERVICE REQUEST</Text>
            <Text style={styles.step}>STEP 1 OF 2</Text>
          </View>
          <Logo />
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>TELL US WHAT HAPPENED</Text>
            <Text accessibilityRole="header" style={styles.title}>Describe the problem.</Text>
            <Text style={styles.subtitle}>Tell us what is happening so our team can prepare for your service request.</Text>
          </View>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.cardTitle}>What needs attention?</Text>
            <Text style={styles.cardSubtitle}>Include warning signs, affected areas, and when the problem started.</Text>
            <View style={styles.descriptionField}>
              <TextInput
                accessibilityLabel="Electrical problem description"
                accessibilityHint={error || 'Describe the electrical problem.'}
                value={description}
                onChangeText={(value) => setDescription(value.slice(0, MAX_DESCRIPTION_LENGTH))}
                placeholder="Example: The kitchen outlets stopped working and the breaker keeps tripping."
                placeholderTextColor="#7F8BA0"
                multiline
                textAlignVertical="top"
                maxLength={MAX_DESCRIPTION_LENGTH}
                style={[styles.descriptionInput, !!error && styles.descriptionInputInvalid]}
              />
            </View>
            <View style={styles.descriptionMeta}>
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.descriptionError}>{error || ' '}</Text>
              <Text style={styles.characterCount}>{description.length}/{MAX_DESCRIPTION_LENGTH}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: false }} onPress={continueToLocation} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>CONTINUE TO LOCATION  →</Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>COUGAR ELECTRIC INC.  ·  EMERGENCY REQUEST</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
