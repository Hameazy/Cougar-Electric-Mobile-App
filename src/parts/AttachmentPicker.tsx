// "Photos & video" section for the emergency request screen.
// The screen keeps the list in its own state and passes it in, so the
// submit step can send the same list with the request.
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorBanner } from './ErrorBanner';
import {
  MAX_ATTACHMENTS,
  MAX_VIDEO_SECONDS,
  addAttachments,
  formatDuration,
  formatSize,
  toAttachment,
  type Attachment,
} from '../helpers/AttachmentRules';

type Props = {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
};

const GOLD = '#F5B900';
// Camera only makes sense on a phone. In a desktop browser it just opens a file window.
const canUseCamera = Platform.OS !== 'web';

export function AttachmentPicker({ value, onChange }: Props) {
  const [message, setMessage] = useState('');
  const left = MAX_ATTACHMENTS - value.length;
  const full = left <= 0;

  async function pick(from: 'library' | 'camera') {
    setMessage('');

    // Phones ask the customer first. On web these calls just return "granted".
    const permission = from === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(from === 'camera'
        ? 'Camera access is off. Turn it on in your phone settings to take a photo.'
        : 'Photo access is off. Turn it on in your phone settings to add photos.');
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images', 'videos'],
      quality: 0.7, // smaller files, still clear enough for the electrician
      videoMaxDuration: MAX_VIDEO_SECONDS,
      allowsMultipleSelection: from === 'library',
      selectionLimit: left,
    };

    try {
      const result = from === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.length) return;

      const { list, problems } = addAttachments(value, result.assets.map(toAttachment));
      onChange(list);
      if (problems.length) setMessage(problems.join('\n'));
    } catch {
      setMessage('Something went wrong opening your photos. Please try again.');
    }
  }

  function remove(uri: string) {
    onChange(value.filter((f) => f.uri !== uri));
    setMessage('');
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.section}>PHOTOS & VIDEO</Text>
        <View style={styles.optionalPill}><Text style={styles.optionalText}>OPTIONAL</Text></View>
      </View>
      <Text style={styles.lead}>
        A quick photo of the outlet, panel, or wiring helps our electrician bring the right parts.
      </Text>

      <ErrorBanner message={message} />

      {value.length === 0 ? (
        // Empty state: one big, easy target instead of a row of small buttons.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photos or a video"
          onPress={() => pick('library')}
          style={({ pressed }) => [styles.dropZone, pressed && styles.dropZonePressed]}
        >
          <View style={styles.dropIcon}><Text style={styles.dropIconText}>+</Text></View>
          <Text style={styles.dropTitle}>Add photos or a video</Text>
          <Text style={styles.dropHint}>Up to {MAX_ATTACHMENTS} files · videos up to {MAX_VIDEO_SECONDS} seconds</Text>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {value.map((file) => (
            <View key={file.uri} style={styles.tile}>
              {file.kind === 'photo' ? (
                <Image source={{ uri: file.uri }} style={styles.media} resizeMode="cover" accessibilityLabel={`Photo ${file.fileName}`} />
              ) : (
                <View style={[styles.media, styles.videoMedia]} accessibilityLabel={`Video ${file.fileName}`}>
                  <View style={styles.playCircle}><Text style={styles.playText}>▶</Text></View>
                </View>
              )}

              {/* little label so customers can tell photos and videos apart */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {file.kind === 'video'
                    ? ['Video', formatDuration(file.durationMs) || formatSize(file.sizeBytes)].filter(Boolean).join(' · ')
                    : formatSize(file.sizeBytes) || 'Photo'}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${file.fileName}`}
                onPress={() => remove(file.uri)}
                hitSlop={10}
                style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
              >
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
          ))}

          {/* "add more" tile sits in the grid so it's right where the eye already is */}
          {!full && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add more photos or video, ${left} left`}
              onPress={() => pick('library')}
              style={({ pressed }) => [styles.tile, styles.addTile, pressed && styles.dropZonePressed]}
            >
              <Text style={styles.addTilePlus}>+</Text>
              <Text style={styles.addTileText}>Add more</Text>
            </Pressable>
          )}
        </View>
      )}

      {canUseCamera && !full && (
        <Pressable
          accessibilityRole="button"
          onPress={() => pick('camera')}
          style={({ pressed }) => [styles.cameraButton, pressed && styles.dropZonePressed]}
        >
          <Text style={styles.cameraText}>Use camera</Text>
        </Pressable>
      )}

      <View style={styles.footer}>
        <View style={styles.meter} accessible accessibilityLabel={`${value.length} of ${MAX_ATTACHMENTS} files added`}>
          {Array.from({ length: MAX_ATTACHMENTS }, (_, i) => (
            <View key={i} style={[styles.meterBar, i < value.length && styles.meterBarOn]} />
          ))}
        </View>
        <Text style={styles.footerText}>
          {full ? 'Limit reached — remove one to add another' : `${value.length} of ${MAX_ATTACHMENTS} added`}
        </Text>
      </View>
      <Text style={styles.formats}>JPG, PNG, HEIC, WEBP · MP4, MOV</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  section: { color: GOLD, fontSize: 11, letterSpacing: 1.3, fontWeight: '700' },
  optionalPill: { borderWidth: 1, borderColor: '#3A4250', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  optionalText: { color: '#99A7BC', fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  lead: { color: '#B9C3D2', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 16 },

  dropZone: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#4A5363',
    backgroundColor: '#0A101B',
  },
  dropZonePressed: { borderColor: GOLD, backgroundColor: '#1C1C12' },
  dropIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dropIconText: { color: GOLD, fontSize: 28, lineHeight: 30, fontWeight: '300' },
  dropTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  dropHint: { color: '#99A7BC', fontSize: 12, marginTop: 6, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  tile: { width: '31%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0A101B', borderWidth: 1, borderColor: '#3A4250' },
  media: { width: '100%', height: '100%' },
  videoMedia: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#121721' },
  playCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245, 185, 0, 0.15)', borderWidth: 1, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  playText: { color: GOLD, fontSize: 15, marginLeft: 3 },
  badge: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(7, 11, 19, 0.82)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#E0E5EF', fontSize: 10, fontWeight: '600' },
  remove: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(7, 11, 19, 0.85)', borderWidth: 1, borderColor: '#5A6272', alignItems: 'center', justifyContent: 'center' },
  removePressed: { borderColor: '#FF9A91', backgroundColor: '#301B20' },
  removeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  addTile: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#4A5363', alignItems: 'center', justifyContent: 'center' },
  addTilePlus: { color: GOLD, fontSize: 26, fontWeight: '300', lineHeight: 28 },
  addTileText: { color: '#B9C3D2', fontSize: 12, fontWeight: '600', marginTop: 2 },

  cameraButton: { marginTop: 12, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  cameraText: { color: GOLD, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  meter: { flexDirection: 'row', gap: 4 },
  meterBar: { width: 18, height: 4, borderRadius: 2, backgroundColor: '#2A313D' },
  meterBarOn: { backgroundColor: GOLD },
  footerText: { color: '#99A7BC', fontSize: 12, flex: 1 },
  formats: { color: '#728099', fontSize: 11, marginTop: 6 },
});
