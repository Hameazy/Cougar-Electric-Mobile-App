import { Pressable, StyleSheet, Text, View } from 'react-native';

export const ELECTRICAL_ISSUES = [
  'Power outage',
  'Outlet not working',
  'Circuit breaker issue',
  'Electrical wiring problem',
  'Flickering lights',
  'Other electrical issue',
] as const;

export type ElectricalIssue = (typeof ELECTRICAL_ISSUES)[number];

export type ElectricalIssueSelectorProps = {
  selectedIssue: ElectricalIssue | null;
  onSelectIssue: (issue: ElectricalIssue) => void;
};

export default function ElectricalIssueSelector({
  selectedIssue,
  onSelectIssue,
}: ElectricalIssueSelectorProps) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        What electrical issue are you experiencing?
      </Text>

      <View
        accessibilityLabel="Electrical issue"
        accessibilityRole="radiogroup"
        style={styles.options}
      >
        {ELECTRICAL_ISSUES.map((issue) => {
          const isSelected = selectedIssue === issue;

          return (
            <Pressable
              key={issue}
              accessibilityLabel={issue}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => onSelectIssue(issue)}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.selectedOption,
                pressed && styles.pressedOption,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}
              >
                {issue}
              </Text>
              <View
                accessible={false}
                style={[
                  styles.radio,
                  isSelected && styles.selectedRadio,
                ]}
              >
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 18,
  },
  options: {
    gap: 12,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#0A101B',
    borderColor: '#3A4250',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedOption: {
    backgroundColor: '#1C1C12',
    borderColor: '#F5B900',
  },
  pressedOption: {
    opacity: 0.7,
  },
  optionText: {
    color: '#E0E5EF',
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  radio: {
    alignItems: 'center',
    borderColor: '#7F8BA0',
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginLeft: 12,
    width: 22,
  },
  selectedRadio: {
    borderColor: '#F5B900',
  },
  radioDot: {
    backgroundColor: '#F5B900',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
