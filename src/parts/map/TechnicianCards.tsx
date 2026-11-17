// The electrician cards inside the bottom sheet: a compact row for the list,
// a bigger detail card for the one the customer picked, and loading / empty
// placeholders.
//
// Two numbers are always kept apart on these cards:
// - "Straight line" is the distance on the map, ignoring roads.
// - "Drive" is the driving time. It says whether it came from a real road route
//   or is only a rough estimate.
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { styles } from '../../styles/PageStyle';
import {
  formatRating,
  initialsOf,
  isEvSpecialist,
  type MapTechnician,
} from '../../technicians/technicianFilters';
import {
  formatMiles,
  formatShortMinutes,
  type DriveInfo,
} from '../../technicians/travelEstimate';
import { MAP_COLORS } from './ServiceMapTypes';

function driveLabel(drive: DriveInfo): string {
  return drive.source === 'road' ? formatShortMinutes(drive.minutes) : `~${formatShortMinutes(drive.minutes)}`;
}

function Tag({ text, tone = 'plain' }: { text: string; tone?: 'plain' | 'ev' }) {
  return (
    <View style={[cardStyles.tag, tone === 'ev' && cardStyles.tagEv]}>
      <Text style={[cardStyles.tagText, tone === 'ev' && cardStyles.tagTextEv]}>{text}</Text>
    </View>
  );
}

function tagsFor(technician: MapTechnician, limit: number): { text: string; tone: 'plain' | 'ev' }[] {
  const tags: { text: string; tone: 'plain' | 'ev' }[] = [];
  if (isEvSpecialist(technician)) tags.push({ text: 'EV specialist', tone: 'ev' });
  for (const specialty of technician.specialties ?? []) {
    if (/\bev\b|electric vehicle/i.test(specialty) && tags.some((tag) => tag.tone === 'ev')) continue;
    tags.push({ text: specialty, tone: 'plain' });
  }
  return tags.slice(0, limit);
}

function Avatar({ technician, size }: { technician: MapTechnician; size: number }) {
  const busy = technician.availability === 'busy';
  return (
    <View style={[cardStyles.avatar, { borderRadius: size * 0.3, height: size, width: size }, busy && cardStyles.avatarBusy]}>
      <Text style={[cardStyles.avatarText, { fontSize: size * 0.36 }, busy && cardStyles.avatarTextBusy]}>{initialsOf(technician.name)}</Text>
      <View style={[cardStyles.statusDot, busy && cardStyles.statusDotBusy]} />
    </View>
  );
}

export function TechnicianRow({
  technician,
  drive,
  selected,
  onPress,
}: {
  technician: MapTechnician;
  drive: DriveInfo;
  selected: boolean;
  onPress: () => void;
}) {
  const busy = technician.availability === 'busy';
  const tags = tagsFor(technician, 2);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${technician.name}, ${busy ? 'on another job' : 'available now'}, ${formatMiles(technician.distanceMiles)} straight line, ${drive.source === 'road' ? '' : 'about '}${formatShortMinutes(drive.minutes)} drive, ${formatRating(technician.rating)}`}
      onPress={onPress}
      style={({ pressed }) => [cardStyles.row, selected && cardStyles.rowSelected, pressed && styles.buttonPressed]}
    >
      <Avatar technician={technician} size={48} />
      <View style={cardStyles.rowCopy}>
        <View style={cardStyles.nameLine}>
          <Text style={cardStyles.rowName} numberOfLines={1}>{technician.name}</Text>
        </View>
        <Text style={cardStyles.rowMeta} numberOfLines={1}>
          <Text style={[cardStyles.rowStatus, busy && cardStyles.rowStatusBusy]}>{busy ? 'Busy' : 'Available'}</Text>
          {` · ${formatRating(technician.rating)}`}
          {technician.jobsCompleted !== undefined ? ` · ${technician.jobsCompleted} jobs` : ''}
        </Text>
        {tags.length > 0 && (
          <View style={cardStyles.tagRow}>
            {tags.map((tag) => <Tag key={tag.text} text={tag.text} tone={tag.tone} />)}
          </View>
        )}
      </View>
      <View style={cardStyles.rowRight}>
        <Text style={cardStyles.rowDrive}>{driveLabel(drive)}</Text>
        <Text style={cardStyles.rowDriveLabel}>{drive.source === 'road' ? 'drive' : 'est. drive'}</Text>
        <Text style={cardStyles.rowDistance}>{formatMiles(technician.distanceMiles)}</Text>
      </View>
    </Pressable>
  );
}

export function TechnicianDetails({
  technician,
  drive,
  routeStatus,
  hasActiveRequest,
  compact,
  onPrimary,
  onClose,
}: {
  technician: MapTechnician;
  drive: DriveInfo;
  // where the driving numbers came from: still loading, a real route, or a guess
  routeStatus: 'idle' | 'loading' | 'ready' | 'failed';
  hasActiveRequest: boolean;
  // true on phones, where the card sits in a short sheet and should stay small
  compact: boolean;
  onPrimary: () => void;
  onClose: () => void;
}) {
  const busy = technician.availability === 'busy';
  const tags = tagsFor(technician, compact ? 3 : 4);

  return (
    <View style={cardStyles.detailCard}>
      <View style={cardStyles.detailTop}>
        <Avatar technician={technician} size={56} />
        <View style={cardStyles.rowCopy}>
          <View style={cardStyles.nameLine}>
            <Text style={cardStyles.detailName} numberOfLines={1}>{technician.name}</Text>
          </View>
          <Text style={[cardStyles.detailMeta, busy && cardStyles.detailMetaBusy]}>
            {busy ? 'On another job' : 'Available now'}
          </Text>
          <Text style={cardStyles.detailMetaMuted}>
            {formatRating(technician.rating)}
            {technician.jobsCompleted !== undefined ? ` · ${technician.jobsCompleted} jobs` : ''}
          </Text>
        </View>
        <Pressable accessibilityLabel="Close details" accessibilityRole="button" hitSlop={10} onPress={onClose} style={cardStyles.close}>
          <Text style={cardStyles.closeText}>✕</Text>
        </Pressable>
      </View>

      {tags.length > 0 && (
        <View style={cardStyles.tagRow}>
          {tags.map((tag) => <Tag key={tag.text} text={tag.text} tone={tag.tone} />)}
        </View>
      )}

      <View style={cardStyles.statRow}>
        <View style={cardStyles.stat}>
          <Text style={cardStyles.statValue}>{formatMiles(technician.distanceMiles)}</Text>
          <Text style={cardStyles.statLabel}>Straight-line distance</Text>
        </View>
        <View style={cardStyles.stat}>
          <Text style={cardStyles.statValue}>
            {routeStatus === 'loading' ? '…' : driveLabel(drive)}
          </Text>
          <Text style={cardStyles.statLabel}>
            {routeStatus === 'loading'
              ? 'Finding the road route'
              : drive.source === 'road'
                ? `Driving time · ${formatMiles(drive.roadMiles ?? technician.distanceMiles)} by road`
                : 'Driving time · estimate'}
          </Text>
        </View>
      </View>

      {drive.source === 'estimate' && routeStatus !== 'loading' && (
        <Text style={cardStyles.note}>
          Road data isn’t available right now, so the driving time is a rough guess from the straight-line distance.
        </Text>
      )}

      {!compact && (
        <Text style={cardStyles.note}>
          {hasActiveRequest
            ? 'We match your request to the closest available electrician. Your exact arrival time shows once someone accepts.'
            : 'Send a request and we will match you with the closest available electrician.'}
        </Text>
      )}

      <Pressable accessibilityRole="button" onPress={onPrimary} style={({ pressed }) => [cardStyles.primary, pressed && styles.buttonPressed]}>
        <Text style={cardStyles.primaryText}>{hasActiveRequest ? 'View my request' : 'Request an electrician'}</Text>
      </Pressable>
    </View>
  );
}

// Gray pulsing placeholders while Firestore loads.
export function TechnicianSkeletons() {
  // useState (not useRef) so the same Animated.Value is kept between renders
  const [pulse] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View accessible accessibilityLabel="Loading electricians" style={{ gap: 12 }}>
      {[0, 1, 2].map((index) => (
        <Animated.View key={index} style={[cardStyles.row, { opacity: pulse }]}>
          <View style={[cardStyles.avatar, cardStyles.skeletonBlock, { borderRadius: 14, height: 48, width: 48 }]} />
          <View style={cardStyles.rowCopy}>
            <View style={[cardStyles.skeletonBlock, { height: 14, width: '55%' }]} />
            <View style={[cardStyles.skeletonBlock, { height: 12, width: '80%' }]} />
          </View>
          <View style={[cardStyles.skeletonBlock, { height: 28, width: 44 }]} />
        </Animated.View>
      ))}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={cardStyles.empty}>
      <Text style={cardStyles.emptyTitle}>{title}</Text>
      <Text style={cardStyles.emptyBody}>{body}</Text>
      {actionLabel && onAction && (
        <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [cardStyles.emptyAction, pressed && styles.buttonPressed]}>
          <Text style={cardStyles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  row: { alignItems: 'center', backgroundColor: MAP_COLORS.panel, borderColor: '#2A3240', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 76, padding: 12 },
  rowSelected: { borderColor: MAP_COLORS.volt },
  rowCopy: { flex: 1, gap: 4, minWidth: 0 },
  nameLine: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  rowName: { color: MAP_COLORS.text, flexShrink: 1, fontSize: 16, fontWeight: '800' },
  rowMeta: { color: '#AAB5C7', fontSize: 13 },
  rowStatus: { color: MAP_COLORS.available, fontWeight: '700' },
  rowStatusBusy: { color: MAP_COLORS.busy },
  rowRight: { alignItems: 'flex-end', minWidth: 62 },
  rowDrive: { color: MAP_COLORS.text, fontSize: 17, fontVariant: ['tabular-nums'], fontWeight: '800' },
  rowDriveLabel: { color: MAP_COLORS.muted, fontSize: 11 },
  rowDistance: { color: '#AAB5C7', fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 4 },

  avatar: { alignItems: 'center', backgroundColor: '#123426', justifyContent: 'center' },
  avatarBusy: { backgroundColor: '#232B38' },
  avatarText: { color: MAP_COLORS.available, fontWeight: '900' },
  avatarTextBusy: { color: MAP_COLORS.muted },
  statusDot: { backgroundColor: MAP_COLORS.available, borderColor: MAP_COLORS.panel, borderRadius: 7, borderWidth: 2, bottom: -3, height: 14, position: 'absolute', right: -3, width: 14 },
  statusDotBusy: { backgroundColor: MAP_COLORS.busy },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#1B2638', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { color: '#C7D2E3', fontSize: 11, fontWeight: '700' },
  tagEv: { backgroundColor: '#241B4A' },
  tagTextEv: { color: '#D6CBFF' },

  detailCard: { backgroundColor: MAP_COLORS.panel, borderColor: MAP_COLORS.volt, borderRadius: 20, borderWidth: 1, gap: 14, padding: 16 },
  detailTop: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  detailName: { color: MAP_COLORS.text, flexShrink: 1, fontSize: 19, fontWeight: '800' },
  detailMeta: { color: MAP_COLORS.available, fontSize: 14, fontWeight: '700' },
  detailMetaBusy: { color: MAP_COLORS.busy },
  detailMetaMuted: { color: '#AAB5C7', fontSize: 14, fontWeight: '600' },
  close: { alignItems: 'center', backgroundColor: '#1B2638', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  closeText: { color: '#C7D2E3', fontSize: 14, fontWeight: '800' },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { backgroundColor: MAP_COLORS.night, borderRadius: 14, flex: 1, gap: 4, padding: 12 },
  statValue: { color: MAP_COLORS.text, fontSize: 20, fontVariant: ['tabular-nums'], fontWeight: '800' },
  statLabel: { color: MAP_COLORS.muted, fontSize: 12, lineHeight: 16 },
  note: { color: '#AAB5C7', fontSize: 13, lineHeight: 19 },
  primary: { alignItems: 'center', backgroundColor: MAP_COLORS.volt, borderRadius: 14, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16 },
  primaryText: { color: MAP_COLORS.night, fontSize: 16, fontWeight: '800' },

  skeletonBlock: { backgroundColor: '#232B38', borderRadius: 6 },

  empty: { alignItems: 'center', backgroundColor: MAP_COLORS.panel, borderColor: '#2A3240', borderRadius: 16, borderWidth: 1, gap: 8, padding: 20 },
  emptyTitle: { color: MAP_COLORS.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#AAB5C7', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyAction: { alignItems: 'center', borderColor: MAP_COLORS.volt, borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginTop: 6, minHeight: 44, paddingHorizontal: 18 },
  emptyActionText: { color: MAP_COLORS.volt, fontSize: 14, fontWeight: '800' },
});
