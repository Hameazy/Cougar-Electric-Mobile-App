import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

type NavigationDestination = {
  address: string;
  latitude?: number;
  longitude?: number;
};

function destinationText(destination: NavigationDestination): string {
  if (
    Number.isFinite(destination.latitude)
    && Number.isFinite(destination.longitude)
  ) {
    return `${destination.latitude},${destination.longitude}`;
  }
  return destination.address;
}

export async function openExternalMaps(
  destination: NavigationDestination,
): Promise<void> {
  const target = encodeURIComponent(destinationText(destination));
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=driving`;
  const url = Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${target}&dirflg=d`
    : googleMapsUrl;

  try {
    await Linking.openURL(url);
  } catch {
    if (url === googleMapsUrl) throw new Error('External maps could not be opened.');
    await Linking.openURL(googleMapsUrl).catch(() => {
      throw new Error('External maps could not be opened.');
    });
  }
}
