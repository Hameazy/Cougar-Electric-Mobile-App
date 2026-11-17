import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignedInOnly } from '../parts/SignedInOnly';

type PaymentStatus = 'Pending' | 'Paid' | 'Failed';
type ModalMode = 'details' | 'pay' | 'receipt' | 'review' | null;
type Payment = { id: string; service: string; date: string; amount: number; status: PaymentStatus };

const initialPayments: Payment[] = [
  { id: 'CE-1001', service: 'Outlet Repair', date: 'Nov 10, 2026', amount: 125, status: 'Pending' },
  { id: 'CE-1002', service: 'Breaker Replacement', date: 'Oct 28, 2026', amount: 210, status: 'Paid' },
  { id: 'CE-1003', service: 'Lighting Repair', date: 'Oct 15, 2026', amount: 95, status: 'Paid' },
];

const money = (amount: number) => `$${amount.toFixed(2)}`;

export default function CustomerPayments() {
  const [payments, setPayments] = useState(initialPayments);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [mode, setMode] = useState<ModalMode>(null);
  const [payAll, setPayAll] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const outstanding = payments.filter((payment) => payment.status === 'Pending');
  const history = payments.filter((payment) => payment.status !== 'Pending');
  const balance = outstanding.reduce((sum, payment) => sum + payment.amount, 0);

  function open(nextMode: Exclude<ModalMode, null>, payment: Payment | null, all = false) {
    setSelected(payment);
    setPayAll(all);
    setMode(nextMode);
    if (nextMode === 'review') {
      setRating(0);
      setReview('');
    }
  }

  function close() {
    setMode(null);
    setSelected(null);
    setPayAll(false);
  }

  function completePayment() {
    const ids = payAll ? outstanding.map((payment) => payment.id) : selected ? [selected.id] : [];
    const amount = payAll ? balance : selected?.amount ?? 0;
    setPayments((current) => current.map((payment) => ids.includes(payment.id) ? { ...payment, status: 'Paid' } : payment));
    setNotice(`Payment of ${money(amount)} completed.`);
    close();
  }

  function submitReview() {
    if (!selected || rating === 0) return;
    setReviewedIds((current) => [...new Set([...current, selected.id])]);
    setNotice(`Thank you for reviewing ${selected.service}.`);
    close();
  }

  function paymentCard(payment: Payment) {
    const reviewed = reviewedIds.includes(payment.id);
    return (
      <View key={payment.id} style={s.paymentCard}>
        <Pressable accessibilityRole="button" onPress={() => open('details', payment)} style={({ pressed }) => pressed && s.pressed}>
          <View style={s.row}>
            <Text style={s.service}>{payment.service}</Text>
            <Text style={s.amount}>{money(payment.amount)}</Text>
          </View>
          <Text style={s.muted}>{payment.id} · {payment.date}</Text>
          <View style={s.rowBottom}>
            <Text style={[s.status, statusStyle(payment.status)]}>{payment.status}</Text>
            <Text style={s.link}>View Details →</Text>
          </View>
        </Pressable>
        <View style={s.actions}>
          {payment.status === 'Pending' ? (
            <ActionButton label="PAY NOW" primary onPress={() => open('pay', payment)} />
          ) : (
            <>
              <ActionButton label="VIEW RECEIPT" onPress={() => open('receipt', payment)} />
              <ActionButton label={reviewed ? 'REVIEW SENT' : 'LEAVE A REVIEW'} primary={!reviewed} disabled={reviewed} onPress={() => open('review', payment)} />
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.brand}>COUGAR ELECTRIC</Text>
        <Text accessibilityRole="header" style={s.title}>Payments</Text>
        <Text style={s.subtitle}>Pay an outstanding balance, view receipts, and review completed service.</Text>
        <SignedInOnly returnTo="payments">{() => (
          <>
            {!!notice && <View style={s.notice}><Text accessibilityLiveRegion="polite" style={s.noticeText}>{notice}</Text></View>}
            <View style={s.balanceCard}>
              <Text style={s.label}>OUTSTANDING BALANCE</Text>
              <Text style={s.balance}>{money(balance)}</Text>
              <Text style={s.muted}>{outstanding.length} unpaid service request{outstanding.length === 1 ? '' : 's'}</Text>
              {balance > 0 && <ActionButton label="PAY OUTSTANDING BALANCE" primary onPress={() => open('pay', null, true)} />}
            </View>

            <Text style={s.sectionTitle}>Outstanding Payments</Text>
            {outstanding.length ? outstanding.map(paymentCard) : <Empty title="You're all caught up!" body="You don't have any outstanding payments." />}
            <Text style={[s.sectionTitle, s.historyTitle]}>Payment History</Text>
            {history.length ? history.map(paymentCard) : <Empty title="No payment history yet" body="Your previous payments will appear here." />}
          </>
        )}</SignedInOnly>
      </ScrollView>

      <PaymentModal
        mode={mode}
        payment={selected}
        payAll={payAll}
        amount={payAll ? balance : selected?.amount ?? 0}
        rating={rating}
        review={review}
        onClose={close}
        onPay={completePayment}
        onRating={setRating}
        onReview={setReview}
        onSubmitReview={submitReview}
      />
    </SafeAreaView>
  );
}

function ActionButton({ disabled = false, label, onPress, primary = false }: { disabled?: boolean; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, primary && s.actionPrimary, disabled && s.disabled, pressed && s.pressed]}>
      <Text style={[s.actionText, primary && s.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function Empty({ body, title }: { body: string; title: string }) {
  return <View style={s.empty}><Text style={s.emptyTitle}>{title}</Text><Text style={s.muted}>{body}</Text></View>;
}

function DetailRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return <View style={s.detailRow}><Text style={[s.detailText, strong && s.strong]}>{label}</Text><Text style={[s.detailText, strong && s.strong]}>{value}</Text></View>;
}

type PaymentModalProps = {
  amount: number;
  mode: ModalMode;
  onClose: () => void;
  onPay: () => void;
  onRating: (value: number) => void;
  onReview: (value: string) => void;
  onSubmitReview: () => void;
  payAll: boolean;
  payment: Payment | null;
  rating: number;
  review: string;
};

function PaymentModal({ amount, mode, onClose, onPay, onRating, onReview, onSubmitReview, payAll, payment, rating, review }: PaymentModalProps) {
  const title = mode === 'pay' ? 'Confirm Payment' : mode === 'receipt' ? 'Receipt' : mode === 'review' ? 'Leave a Review' : 'Payment Details';
  return (
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={s.modalCard}>
            <View style={s.modalHeader}><Text style={s.modalTitle}>{title}</Text><Pressable accessibilityLabel="Close" onPress={onClose}><Text style={s.close}>×</Text></Pressable></View>

            {mode === 'pay' && <>
              <Text style={s.modalIntro}>{payAll ? 'Pay all outstanding service requests' : payment?.service}</Text>
              <Text style={s.payTotal}>{money(amount)}</Text>
              <View style={s.method}><View style={s.cardIcon}><Text style={s.cardIconText}>▭</Text></View><View><Text style={s.detailValue}>VISA •••• 4242</Text><Text style={s.muted}>Default payment method</Text></View></View>
              <ActionButton label={`PAY ${money(amount)}`} primary onPress={onPay} />
            </>}

            {(mode === 'details' || mode === 'receipt') && payment && <>
              {mode === 'receipt' && <View style={s.check}><Text style={s.checkText}>✓</Text></View>}
              <View style={s.summary}>
                <Text style={s.summaryTitle}>Service Summary</Text>
                <DetailRow label={payment.service} value={money(payment.amount)} />
                <DetailRow label="Diagnostic Fee" value="$0.00" />
                <View style={s.divider} />
                <DetailRow label="Total" value={money(payment.amount)} strong />
              </View>
              <Text style={s.detailLabel}>REQUEST ID</Text><Text style={s.detailValue}>{payment.id}</Text>
              <Text style={s.detailLabel}>{payment.status === 'Paid' ? 'CHARGED' : 'SERVICE DATE'}</Text><Text style={s.detailValue}>{payment.date}</Text>
              <Text style={[s.status, statusStyle(payment.status), s.modalStatus]}>{payment.status.toUpperCase()}</Text>
              {mode === 'details' && payment.status === 'Pending' && <ActionButton label="PAY NOW" primary onPress={onPay} />}
            </>}

            {mode === 'review' && payment && <>
              <Text style={s.modalIntro}>How was your {payment.service.toLowerCase()} service?</Text>
              <View accessibilityRole="radiogroup" style={s.stars}>{[1, 2, 3, 4, 5].map((star) => <Pressable key={star} accessibilityRole="radio" accessibilityState={{ selected: rating === star }} onPress={() => onRating(star)}><Text style={[s.star, star <= rating && s.starSelected]}>★</Text></Pressable>)}</View>
              <TextInput accessibilityLabel="Review comments" multiline maxLength={500} onChangeText={onReview} placeholder="Tell us about your experience (optional)" placeholderTextColor="#75839A" style={s.reviewInput} value={review} />
              <Text style={s.count}>{review.length}/500</Text>
              <ActionButton label="SUBMIT REVIEW" primary disabled={rating === 0} onPress={onSubmitReview} />
            </>}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function statusStyle(status: PaymentStatus) {
  return status === 'Paid' ? s.paid : status === 'Failed' ? s.failed : s.pending;
}

const s = StyleSheet.create({
  safe: { backgroundColor: '#07101F', flex: 1 }, content: { alignSelf: 'center', maxWidth: 600, padding: 24, paddingBottom: 48, width: '100%' },
  brand: { color: '#F5B900', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 28 }, title: { color: '#FFF', fontSize: 32, fontWeight: '800', marginBottom: 10 }, subtitle: { color: '#A9B1C0', fontSize: 15, lineHeight: 22, marginBottom: 28 },
  notice: { backgroundColor: '#0E3328', borderColor: '#1F6D50', borderRadius: 12, borderWidth: 1, marginBottom: 16, padding: 14 }, noticeText: { color: '#65D6A0', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  balanceCard: { backgroundColor: '#172235', borderColor: '#34435A', borderRadius: 16, borderWidth: 1, marginBottom: 32, padding: 24 }, label: { color: '#B8C3D4', fontSize: 12, fontWeight: '700', letterSpacing: 1 }, balance: { color: '#FFF', fontSize: 38, fontWeight: '800', marginBottom: 8, marginTop: 12 }, muted: { color: '#98A5B8', fontSize: 13, marginTop: 6 },
  sectionTitle: { color: '#FFF', fontSize: 21, fontWeight: '700', marginBottom: 16 }, historyTitle: { marginTop: 28 }, paymentCard: { backgroundColor: '#111B2B', borderColor: '#26364B', borderRadius: 14, borderWidth: 1, marginBottom: 14, padding: 18 }, row: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' }, rowBottom: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, service: { color: '#FFF', flex: 1, fontSize: 16, fontWeight: '700' }, amount: { color: '#FFF', fontSize: 16, fontWeight: '800' }, status: { fontSize: 12, fontWeight: '800', letterSpacing: .5 }, paid: { color: '#20CE78' }, pending: { color: '#F5B900' }, failed: { color: '#FF8A8A' }, link: { color: '#F5B900', fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 9, marginTop: 16 }, action: { alignItems: 'center', borderColor: '#465167', borderRadius: 11, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 48, padding: 11 }, actionPrimary: { backgroundColor: '#F5B900', borderColor: '#F5B900' }, actionText: { color: '#F8FAFC', fontSize: 11, fontWeight: '900', letterSpacing: .7, textAlign: 'center' }, actionTextPrimary: { color: '#07101F' }, pressed: { opacity: .72 }, disabled: { opacity: .45 },
  empty: { backgroundColor: '#111B2B', borderColor: '#26364B', borderRadius: 12, borderWidth: 1, padding: 22 }, emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  overlay: { backgroundColor: 'rgba(0,0,0,.8)', flex: 1, justifyContent: 'center', padding: 22 }, modalScroll: { flexGrow: 1, justifyContent: 'center' }, modalCard: { alignSelf: 'center', backgroundColor: '#111827', borderColor: '#34435A', borderRadius: 18, borderWidth: 1, maxWidth: 520, padding: 22, width: '100%' }, modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, modalTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' }, close: { color: '#D5DCE7', fontSize: 32, padding: 4 }, modalIntro: { color: '#C3CDDC', fontSize: 15, lineHeight: 22, marginBottom: 14 }, payTotal: { color: '#FFF', fontSize: 40, fontWeight: '900', marginBottom: 22 },
  method: { alignItems: 'center', backgroundColor: '#0D1728', borderColor: '#2B3A52', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 14, marginBottom: 18, padding: 15 }, cardIcon: { alignItems: 'center', backgroundColor: '#102A4E', borderColor: '#1F66B6', borderRadius: 10, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }, cardIconText: { color: '#58A8FF', fontSize: 26 },
  check: { alignItems: 'center', alignSelf: 'center', borderColor: '#FFF', borderRadius: 28, borderWidth: 3, height: 56, justifyContent: 'center', marginBottom: 20, width: 56 }, checkText: { color: '#FFF', fontSize: 34 }, summary: { backgroundColor: '#0D1728', borderColor: '#2B3A52', borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 16 }, summaryTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 12 }, detailRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingVertical: 10 }, detailText: { color: '#C6D0DE', fontSize: 14 }, strong: { color: '#FFF', fontSize: 18, fontWeight: '800' }, divider: { backgroundColor: '#3B4658', height: 1 }, detailLabel: { color: '#8795AA', fontSize: 11, marginTop: 10 }, detailValue: { color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: 4 }, modalStatus: { marginBottom: 18, marginTop: 14 },
  stars: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, star: { color: '#465167', fontSize: 39 }, starSelected: { color: '#F5B900' }, reviewInput: { backgroundColor: '#0D1728', borderColor: '#34435A', borderRadius: 13, borderWidth: 1, color: '#FFF', minHeight: 130, padding: 14, textAlignVertical: 'top' }, count: { color: '#75839A', fontSize: 11, marginBottom: 16, marginTop: 6, textAlign: 'right' },
});
