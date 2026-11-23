// Round-ish profile picture used for electricians and for the signed-in customer.
// If there is a photo we show it. If there is none (or it fails to load, like a
// broken link) we fall back to the person's initials, so it never looks empty.
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { initialsOf } from '../../technicians/technicianFilters';
import { MAP_COLORS } from './ServiceMapTypes';

export type AvatarTone = 'available' | 'busy' | 'customer';

const TONES = {
  available: { background: '#123426', text: MAP_COLORS.available },
  busy: { background: '#232B38', text: MAP_COLORS.muted },
  customer: { background: '#2B2A14', text: MAP_COLORS.volt },
};

export function ProfileAvatar({
  name,
  photoUrl,
  size,
  tone,
  showStatus,
}: {
  name: string;
  photoUrl?: string;
  size: number;
  tone: AvatarTone;
  // the little green/grey dot in the corner (electricians only)
  showStatus?: boolean;
}) {
  // remember which link failed, so a new photo link gets a fresh try
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = !!photoUrl && failedUrl !== photoUrl;
  const colors = TONES[tone];
  const radius = size * 0.3;

  return (
    <View
      accessibilityLabel={showPhoto ? `Photo of ${name}` : `${name}, initials`}
      style={[avatarStyles.base, { backgroundColor: colors.background, borderRadius: radius, height: size, width: size }]}
    >
      {showPhoto ? (
        <Image
          accessibilityIgnoresInvertColors
          onError={() => setFailedUrl(photoUrl)}
          source={{ uri: photoUrl }}
          style={{ borderRadius: radius, height: size, width: size }}
        />
      ) : (
        <Text style={[avatarStyles.initials, { color: colors.text, fontSize: size * 0.36 }]}>{initialsOf(name)}</Text>
      )}
      {showStatus && <View style={[avatarStyles.dot, tone === 'busy' && avatarStyles.dotBusy]} />}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '900' },
  dot: { backgroundColor: MAP_COLORS.available, borderColor: MAP_COLORS.panel, borderRadius: 7, borderWidth: 2, bottom: -2, height: 14, position: 'absolute', right: -2, width: 14 },
  dotBusy: { backgroundColor: MAP_COLORS.muted },
});
