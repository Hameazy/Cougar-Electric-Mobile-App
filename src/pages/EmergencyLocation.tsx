import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { validateServiceLocation, type LocationErrors } from '../helpers/validateServiceRequestDetails';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { BackButton } from '../parts/BackButton';
import { TextBox } from '../parts/TextBox';
import { styles } from '../styles/PageStyle';
import type { ServiceLocation } from '../serviceRequests/ServiceRequestTypes';

const emptyLocation: ServiceLocation = { address: '', city: '', state: '', zip: '' };
type ServiceLocationTextField = 'address' | 'city' | 'state' | 'zip';

export default function EmergencyLocation() {
  const { draft, setLocation: saveLocation } = useServiceRequestDraft();
  const location = draft.location ?? emptyLocation;
  const [errors, setErrors] = useState<LocationErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  const [locationAdded, setLocationAdded] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  function change(key: ServiceLocationTextField, value: string) {
    const nextLocation = { ...location, [key]: value };
    saveLocation(nextLocation);
    setMessage('');
    setLocationAdded(false);
    if (attempted) setErrors(validateServiceLocation(nextLocation));
  }

  async function useCurrentLocation() {
    setLoadingLocation(true);
    setMessage('');
    setLocationAdded(false);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setMessage('Location permission was not granted. You can enter the service address manually.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      saveLocation({
        ...location,
        address: address?.street
          ? [address.streetNumber, address.street].filter(Boolean).join(' ')
          : location.address,
        city: address?.city || address?.subregion || location.city,
        state: address?.region || location.state,
        zip: address?.postalCode || location.zip,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationAdded(true);
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
    router.push('/review-request');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={locationStyles.content} keyboardShouldPersistTaps="handled">
          <View style={locationStyles.header}>
            <View style={locationStyles.headerSide}>
              <BackButton accessibilityLabel="Back" fallback="/emergency-description" textStyle={styles.textLink}>← Back</BackButton>
            </View>
            <Text accessibilityRole="header" style={locationStyles.heading}>Enter Address</Text>
            <View style={locationStyles.headerSide} />
          </View>
          <View style={[styles.card, locationStyles.card]}>
            <Pressable accessibilityRole="button" accessibilityState={{ busy: loadingLocation }} disabled={loadingLocation} onPress={useCurrentLocation} style={({ pressed }) => [styles.locationButton, pressed && styles.buttonPressed]}>
              <Text style={styles.locationButtonText}>{loadingLocation ? 'FINDING LOCATION…' : 'USE MY CURRENT LOCATION'}</Text>
            </Pressable>
            {locationAdded && (
              <Text accessibilityLiveRegion="polite" style={locationStyles.success}>
                ✓ Current location added successfully.
              </Text>
            )}
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
              <Text style={styles.buttonText}>NEXT</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const locationStyles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: 600,
    padding: 22,
    paddingBottom: 40,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 28,
    marginTop: 4,
  },
  headerSide: { width: 72 },
  heading: {
    color: '#F8FAFC',
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    alignSelf: 'center',
    maxWidth: 540,
    width: '100%',
  },
  success: {
    color: '#55D68B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
  },
});
