import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import TechnicianScreen from '../components/TechnicianScreen';

type Period = 'Today' | 'This Week' | 'This Month';

type CompletedJob = {
  id: string;
  issueType: string;
  technicianEarnings: number;
  laborHours: number;
  completedAt: Date;
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Sample completed jobs until technician earnings are available.
const sampleJobs: CompletedJob[] = [
  {
    id: '1',
    issueType: 'Outlet Repair',
    technicianEarnings: 125,
    laborHours: 1.5,
    completedAt: daysAgo(0),
  },
  {
    id: '2',
    issueType: 'Breaker Replacement',
    technicianEarnings: 210,
    laborHours: 2,
    completedAt: daysAgo(0),
  },
  {
    id: '3',
    issueType: 'Lighting Installation',
    technicianEarnings: 180,
    laborHours: 2.5,
    completedAt: daysAgo(1),
  },
  {
    id: '4',
    issueType: 'Electrical Troubleshooting',
    technicianEarnings: 150,
    laborHours: 2,
    completedAt: daysAgo(3),
  },
  {
    id: '5',
    issueType: 'Panel Upgrade',
    technicianEarnings: 350,
    laborHours: 4,
    completedAt: daysAgo(10),
  },
];

const periods: Period[] = [
  'Today',
  'This Week',
  'This Month',
];

function getPeriodStart(period: Period) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (period === 'This Week') {
    date.setDate(date.getDate() - date.getDay());
  } else if (period === 'This Month') {
    date.setDate(1);
  }

  return date;
}

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default function TechnicianEarnings() {
  const [period, setPeriod] = useState<Period>('Today');

  // Calculate the summary from jobs in the selected period.
  const startDate = getPeriodStart(period);

  const visibleJobs = sampleJobs.filter(
    job => job.completedAt >= startDate
  );

  const totalEarnings = visibleJobs.reduce(
    (total, job) => total + job.technicianEarnings,
    0
  );

  const totalHours = visibleJobs.reduce(
    (total, job) => total + job.laborHours,
    0
  );

  return (
    <TechnicianScreen
      title="Earnings"
      subtitle="Track your earnings, completed jobs and logged hours."
    >
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>DEMO EARNINGS</Text>
        <Text style={styles.detail}>
          Sample job records are shown until live earnings data
          becomes available.
        </Text>
      </View>

      <View style={styles.filters}>
        {periods.map(item => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: period === item }}
            onPress={() => setPeriod(item)}
            style={[
              styles.filter,
              period === item && styles.activeFilter,
            ]}
          >
            <Text style={[
              styles.filterText,
              period === item && styles.activeFilterText,
            ]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.label}>TOTAL EARNINGS</Text>

        <Text style={styles.amount}>
          {formatMoney(totalEarnings)}
        </Text>

        <Text style={styles.detail}>
          Earnings from completed jobs · {period}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.label}>COMPLETED JOBS</Text>
          <Text style={styles.number}>
            {visibleJobs.length}
          </Text>
          <Text style={styles.green}>✓ Completed</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.label}>HOURS WORKED</Text>
          <Text style={styles.number}>
            {totalHours.toFixed(1)}
          </Text>
          <Text style={styles.detail}>Logged hours</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Earnings History
        </Text>
        <Text style={styles.detail}>
          {visibleJobs.length} jobs
        </Text>
      </View>

      {visibleJobs.length === 0 ? (
        <View style={styles.stat}>
          <Text style={styles.jobTitle}>
            No completed jobs
          </Text>
          <Text style={styles.detail}>
            Earnings for this period will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleJobs.map(job => (
            <View key={job.id} style={styles.job}>
              <View style={styles.icon}>
                <Text style={styles.iconText}>$</Text>
              </View>

              <View style={styles.jobBody}>
                <Text style={styles.jobTitle}>
                  {job.issueType}
                </Text>

                <Text style={styles.detail}>
                  {job.completedAt.toLocaleDateString()} ·{' '}
                  {job.laborHours} hrs
                </Text>

                <Text style={styles.green}>
                  Completed
                </Text>
              </View>

              <Text style={styles.jobAmount}>
                {formatMoney(job.technicianEarnings)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TechnicianScreen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: '#142139',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  noticeTitle: {
    color: '#20CC79',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filter: {
    backgroundColor: '#101827',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  activeFilter: {
    backgroundColor: '#F5B900',
    borderColor: '#F5B900',
  },
  filterText: {
    color: '#94A2B8',
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#07101F',
  },
  earningsCard: {
    backgroundColor: '#101827',
    borderColor: '#20CC79',
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    gap: 12,
  },
  label: {
    color: '#94A2B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  amount: {
    color: '#20CC79',
    fontSize: 44,
    fontWeight: '900',
  },
  detail: {
    color: '#94A2B8',
    fontSize: 13,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: '#101827',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 19,
    padding: 20,
    gap: 10,
  },
  number: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  green: {
    color: '#53E49A',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  list: {
    backgroundColor: '#101827',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  job: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
    borderBottomColor: '#293244',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 42,
    height: 42,
    backgroundColor: '#142139',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#20CC79',
    fontSize: 22,
    fontWeight: '800',
  },
  jobBody: {
    flex: 1,
    gap: 5,
  },
  jobTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  jobAmount: {
    color: '#20CC79',
    fontSize: 16,
    fontWeight: '800',
  },
});