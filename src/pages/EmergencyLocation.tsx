import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { validateServiceLocation, type LocationErrors } from '../helpers/ServiceRequestValidation';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { Logo } from '../parts/Logo';
import { TextBox } from '../parts/TextBox';
import { styles } from '../styles/PageStyle';
import type { ServiceLocation } from '../serviceRequests/types';

const emptyLocation: ServiceLocation = { address: '', city: '', state: '', zip: '' };

export default function EmergencyLocation() {
  const { draft, setLocation: saveLocation } = useServiceRequestDraft();
  const [location, setLocation] = useState(draft.location ?? emptyLocation);
  const [errors, setErrors] = useState<LocationErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  function change(key: keyof ServiceLocation, value: string) {
    setLocation((current) => ({ ...current, [key]: value }));
    setMessage('');
    if (attempted) setErrors(validateServiceLocation({ ...location, [key]: value }));
  }

  async function useCurrentLocation() {
    setLoadingLocation(true);
    setMessage('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setMessage('Location permission was not granted. You can enter the service address manually.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      setLocation((current) => ({
        ...current,
        address: address?.street ? `${address.street}${address.name ? ` ${address.name}` : ''}` : current.address,
        city: address?.city || address?.subregion || current.city,
        state: address?.region || current.state,
        zip: address?.postalCode || current.zip,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }));
      setMessage('Current location added. Please review the address before continuing.');
    } catch {
      setMessage('We could not determine your location. Enter the service address manually.');
    } finally {
      setLoadingLocation(false);
    }
  }

  function continueFromLocation() {
    Keyboard.dismiss();
    setAttempted(true);
    const validation = validateServiceLocation(location);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    saveLocation(location);
    setMessage('Location saved for this service request.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topline}>
            <Link href={draft.issueType === 'Other electrical issue' ? '/emergency-description' : '/choose-electrical-issue'} style={styles.textLink}>← Back</Link>
            <Text style={styles.step}>STEP 2 OF 2</Text>
          </View>
          <Logo />
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>WHERE IS SERVICE NEEDED?</Text>
            <Text accessibilityRole="header" style={styles.title}>Add the service location.</Text>
            <Text style={styles.subtitle}>Enter the address where our electrician should respond.</Text>
          </View>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.cardTitle}>Service address</Text>
            <Text style={styles.cardSubtitle}>This can be different from your account address.</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ busy: loadingLocation }} disabled={loadingLocation} onPress={useCurrentLocation} style={({ pressed }) => [styles.locationButton, pressed && styles.buttonPressed]}>
              <Text style={styles.locationButtonText}>{loadingLocation ? 'FINDING LOCATION…' : 'USE MY CURRENT LOCATION'}</Text>
            </Pressable>
            {!!message && <View style={styles.notice}><Text accessibilityLiveRegion="polite" style={styles.noticeText}>{message}</Text></View>}
            <View style={{ marginTop: 24 }}>
              <TextBox label="Street address" placeholder="123 Main St" autoComplete="street-address" textContentType="fullStreetAddress" autoCapitalize="words" value={location.address} onChangeText={(value) => change('address', value)} error={errors.address} />
              <TextBox label="City" placeholder="City" textContentType="addressCity" autoCapitalize="words" value={location.city} onChangeText={(value) => change('city', value)} error={errors.city} />
              <View style={styles.row}>
                <View style={styles.flex}><TextBox label="State" placeholder="CA" autoCapitalize="characters" autoCorrect={false} maxLength={2} textContentType="addressState" value={location.state} onChangeText={(value) => change('state', value)} error={errors.state} /></View>
                <View style={styles.flex}><TextBox label="ZIP code" placeholder="95814" keyboardType="numbers-and-punctuation" autoComplete="postal-code" textContentType="postalCode" value={location.zip} onChangeText={(value) => change('zip', value)} error={errors.zip} /></View>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={continueFromLocation} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>SAVE LOCATION  →</Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>COUGAR ELECTRIC INC.  ·  EMERGENCY REQUEST</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
