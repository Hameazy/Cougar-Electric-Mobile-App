
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PaymentStatus = 'Pending' | 'Paid' | 'Failed';

type Payment = {
  id: string;
  service: string;
  date: string;
  amount: number;
  status: PaymentStatus;
};

// Sample records for the UI preview.
// Real customer records will replace these during backend integration.
const samplePayments: Payment[] = [
  {
    id: 'CE-1001',
    service: 'Outlet Repair',
    date: 'Nov 10, 2026',
    amount: 125,
    status: 'Pending',
  },
  {
    id: 'CE-1002',
    service: 'Breaker Replacement',
    date: 'Oct 28, 2026',
    amount: 210,
    status: 'Paid',
  },
  {
    id: 'CE-1003',
    service: 'Lighting Repair',
    date: 'Oct 15, 2026',
    amount: 95,
    status: 'Paid',
  },
];

const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;

export default function CustomerPayments() {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const outstandingPayments = samplePayments.filter(
    (payment) => payment.status === 'Pending'
  );

  const paymentHistory = samplePayments.filter(
    (payment) => payment.status !== 'Pending'
  );

  const outstandingBalance = outstandingPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  function renderPayment(payment: Payment) {
    return (
      <Pressable
        key={payment.id}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${payment.service}`}
        onPress={() => setSelectedPayment(payment)}
        style={({ pressed }) => [
          styles.paymentCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.row}>
          <Text style={styles.service}>{payment.service}</Text>
          <Text style={styles.amount}>
            {formatAmount(payment.amount)}
          </Text>
        </View>

        <Text style={styles.muted}>
          {payment.id} · {payment.date}
        </Text>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.status,
              payment.status === 'Paid'
                ? styles.paid
                : payment.status === 'Failed'
                  ? styles.failed
                  : styles.pending,
            ]}
          >
            {payment.status}
          </Text>

          <Text style={styles.detailsLink}>View Details →</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>COUGAR ELECTRIC</Text>

        <Text accessibilityRole="header" style={styles.title}>
          Payments
        </Text>

        <Text style={styles.subtitle}>
          View your outstanding balance and payment history.
        </Text>

        <View style={styles.balanceCard}>
          <Text style={styles.label}>OUTSTANDING BALANCE</Text>
          <Text style={styles.balance}>
            {formatAmount(outstandingBalance)}
          </Text>
          <Text style={styles.muted}>
            {outstandingPayments.length} unpaid service request
            {outstandingPayments.length === 1 ? '' : 's'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Outstanding Payments</Text>

        {outstandingPayments.length > 0 ? (
          outstandingPayments.map(renderPayment)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>You&apos;re all caught up!</Text>
            <Text style={styles.muted}>
              You don&apos;t have any outstanding payments.
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, styles.historyTitle]}>
          Payment History
        </Text>

        {paymentHistory.length > 0 ? (
          paymentHistory.map(renderPayment)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No payment history yet</Text>
            <Text style={styles.muted}>
              Your previous payments will appear here.
            </Text>
          </View>
        )}

        <Text style={styles.previewNotice}>
          Sample records for UI preview. Payment processing is not
          available yet.
        </Text>
      </ScrollView>

      <Modal
        visible={selectedPayment !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPayment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Payment Details</Text>

            {selectedPayment && (
              <>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>
                  {selectedPayment.service}
                </Text>

                <Text style={styles.detailLabel}>Request ID</Text>
                <Text style={styles.detailValue}>
                  {selectedPayment.id}
                </Text>

                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {selectedPayment.date}
                </Text>

                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>
                  {formatAmount(selectedPayment.amount)}
                </Text>

                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    selectedPayment.status === 'Paid'
                      ? styles.paid
                      : selectedPayment.status === 'Failed'
                        ? styles.failed
                        : styles.pending,
                  ]}
                >
                  {selectedPayment.status}
                </Text>
              </>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedPayment(null)}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#070B13',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  brand: {
    color: '#E7B75F',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    color: '#A9B1C0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  balanceCard: {
    backgroundColor: '#172235',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#34435A',
  },
  label: {
    color: '#B8C3D4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  muted: {
    color: '#98A5B8',
    fontSize: 13,
    marginTop: 6,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 16,
  },
  historyTitle: {
    marginTop: 28,
  },
  paymentCard: {
    backgroundColor: '#111B2B',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#26364B',
  },
  pressed: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  service: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
  },
  paid: {
    color: '#65D6A0',
  },
  pending: {
    color: '#F2C66D',
  },
  failed: {
    color: '#FF8A8A',
  },
  detailsLink: {
    color: '#E7B75F',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#111B2B',
    borderRadius: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: '#26364B',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  previewNotice: {
    color: '#E7B75F',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#172235',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#34435A',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  detailLabel: {
    color: '#98A5B8',
    fontSize: 12,
    marginTop: 12,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#E7B75F',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  closeButtonText: {
    color: '#070B13',
    fontSize: 14,
    fontWeight: '700',
  },
});
