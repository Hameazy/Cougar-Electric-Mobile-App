import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ActiveServiceRequest } from '../serviceRequests/ActiveServiceRequestTypes';
import { styles } from '../styles/PageStyle';

export function ElectricianSearchProgress({
  request,
  onOpen,
}: {
  request: ActiveServiceRequest;
  onOpen: () => void;
}) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      changed = true;
      setReduceMotion(enabled);
    });

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active && !changed) setReduceMotion(enabled);
    }).catch((error: unknown) => {
      console.warn('Could not check the reduce motion setting.', error);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse, reduceMotion]);

  return (
    <View style={progressStyles.card}>
      <View style={progressStyles.header}>
        <View style={progressStyles.headerCopy}>
          <Text style={progressStyles.eyebrow}>ELECTRICIAN MATCHING</Text>
          <Text accessibilityRole="header" style={progressStyles.title}>Finding your electrician</Text>
          <Text style={progressStyles.issue}>
            {request.issueType || 'Electrical service request'} · #{request.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <View accessible={false} style={progressStyles.signal}>
          <Animated.View style={[
            progressStyles.signalRing,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.1] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.3] }) }],
            },
          ]} />
          <View style={progressStyles.signalDot} />
        </View>
      </View>

      <View style={progressStyles.timeline}>
        <View style={progressStyles.step}>
          <View style={[progressStyles.marker, progressStyles.completedMarker]}>
            <Text accessible={false} style={progressStyles.check}>✓</Text>
          </View>
          <View style={progressStyles.stepCopy}>
            <Text style={progressStyles.stepTitle}>Request submitted</Text>
            <Text style={progressStyles.stepDetail}>Your service request is pending.</Text>
          </View>
        </View>
        <View style={progressStyles.step}>
          <View style={[progressStyles.marker, progressStyles.currentMarker]}>
            <View style={progressStyles.currentDot} />
          </View>
          <View style={progressStyles.stepCopy}>
            <Text style={progressStyles.stepTitle}>Searching and contacting · Pending</Text>
            <Text style={progressStyles.stepDetail}>Matching includes finding available electricians and contacting them about your request.</Text>
          </View>
        </View>
        <View style={progressStyles.step}>
          <View style={progressStyles.marker}><Text accessible={false} style={progressStyles.stepNumber}>3</Text></View>
          <View style={progressStyles.stepCopy}>
            <Text style={progressStyles.waitingTitle}>Electrician accepts</Text>
            <Text style={progressStyles.stepDetail}>Waiting for an acceptance.</Text>
          </View>
        </View>
      </View>
      <Text style={progressStyles.note}>Individual search and contact updates are not available yet.</Text>
      <Pressable
        accessibilityLabel={`View ${request.issueType || 'electrical service'} request ${request.id.slice(0, 8)} details`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [progressStyles.detailsButton, pressed && styles.buttonPressed]}
      >
        <Text style={progressStyles.detailsText}>VIEW REQUEST DETAILS</Text>
        <Text accessible={false} style={progressStyles.chevron}>›</Text>
      </Pressable>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  card: { backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 18, borderWidth: 1, gap: 16, padding: 18 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  headerCopy: { flex: 1, gap: 4 },
  eyebrow: { color: '#F5B900', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#F8FAFC', fontSize: 19, fontWeight: '800' },
  issue: { color: '#AAB5C7', fontSize: 13 },
  signal: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  signalRing: { backgroundColor: '#F5B900', borderRadius: 22, height: 44, position: 'absolute', width: 44 },
  signalDot: { backgroundColor: '#F5B900', borderColor: '#111722', borderRadius: 8, borderWidth: 3, height: 16, width: 16 },
  timeline: { gap: 14 },
  step: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  marker: { alignItems: 'center', borderColor: '#596779', borderRadius: 13, borderWidth: 1, height: 26, justifyContent: 'center', width: 26 },
  completedMarker: { backgroundColor: '#F5B900', borderColor: '#F5B900' },
  check: { color: '#111722', fontSize: 15, fontWeight: '800' },
  currentMarker: { borderColor: '#F5B900', borderWidth: 2 },
  currentDot: { backgroundColor: '#F5B900', borderRadius: 4, height: 8, width: 8 },
  stepNumber: { color: '#AAB5C7', fontSize: 11, fontWeight: '700' },
  stepCopy: { flex: 1, gap: 3 },
  stepTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  waitingTitle: { color: '#AAB5C7', fontSize: 14, fontWeight: '700' },
  stepDetail: { color: '#AAB5C7', fontSize: 12, lineHeight: 18 },
  note: { color: '#8290A6', fontSize: 11, lineHeight: 16 },
  detailsButton: { alignItems: 'center', borderColor: '#4A5363', borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 44, paddingHorizontal: 35 },
  detailsText: { color: '#F8FAFC', fontSize: 11, fontWeight: '800', letterSpacing: 0.7, textAlign: 'center' },
  chevron: { color: '#D7DFEC', fontSize: 22, position: 'absolute', right: 14 },
});
