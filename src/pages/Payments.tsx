import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppSectionHeader } from '../parts/AppSectionHeader';
import { styles } from '../styles/PageStyle';

export default function Payments() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={paymentStyles.content}>
        <AppSectionHeader
          eyebrow="CUSTOMER BILLING"
          title="Payments"
          subtitle="Manage payment information for your electrical service."
        />
        <View style={paymentStyles.card}>
          <Text accessibilityRole="header" style={paymentStyles.title}>
            Payments are coming soon
          </Text>
          <Text style={paymentStyles.body}>
            Payment methods and service invoices will be available here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const paymentStyles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    maxWidth: 600,
    padding: 22,
    paddingBottom: 40,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#111722',
    borderColor: '#353F50',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 26,
    padding: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: '#AAB5C7',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
    textAlign: 'center',
  },
});
