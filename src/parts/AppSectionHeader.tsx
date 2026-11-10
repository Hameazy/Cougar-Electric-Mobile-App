import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export function AppSectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <>
      <View style={headerStyles.topline}>
        <Link href="/dashboard" style={headerStyles.back}>← Home</Link>
        <Text style={headerStyles.brand}>COUGAR ELECTRIC</Text>
      </View>
      <Text style={headerStyles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={headerStyles.title}>{title}</Text>
      <Text style={headerStyles.subtitle}>{subtitle}</Text>
    </>
  );
}

const headerStyles = StyleSheet.create({
  topline: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  back: { color: '#F5B900', fontSize: 14, fontWeight: '700', paddingVertical: 8 },
  brand: { color: '#78859A', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  eyebrow: { color: '#F5B900', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 9 },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: '#AAB5C7', fontSize: 14, lineHeight: 21, marginTop: 9 },
});
