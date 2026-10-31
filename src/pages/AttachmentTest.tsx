// Preview page for the photo & video section until the real request screen exists.
// Open /attachment-test in the browser. Remove this page once the request screen uses AttachmentPicker.
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttachmentPicker } from '../parts/AttachmentPicker';
import { Logo } from '../parts/Logo';
import type { Attachment } from '../helpers/AttachmentRules';
import { styles } from '../styles/PageStyle';

export default function AttachmentTest() {
  const [files, setFiles] = useState<Attachment[]>([]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View pointerEvents="none" accessible={false} style={styles.backdrop}>
          <View style={styles.rail} />
          <View style={styles.windows}><View style={styles.window} /><View style={styles.window} /><View style={styles.window} /></View>
          <View style={styles.rail} />
        </View>

        <View style={styles.topline}>
          <Link href="/" style={styles.textLink}>← Back</Link>
          <Text style={styles.step}>SERVICE REQUEST</Text>
        </View>
        <Logo />

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>RELIABLE. PROFESSIONAL. LOCAL.</Text>
          <Text accessibilityRole="header" style={styles.title}>Show us{'\n'}the problem.</Text>
          <Text style={styles.subtitle}>Photos help our electrician understand the issue before they arrive.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tell us more</Text>
          <Text style={[styles.cardSubtitle, { marginBottom: 18 }]}>Add anything that shows what’s going on.</Text>
          <AttachmentPicker value={files} onChange={setFiles} />
        </View>

        <Text style={styles.footer}>COUGAR ELECTRIC INC.  ·  SERVICE REQUEST</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
