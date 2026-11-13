import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ELECTRICAL_ISSUES, ELECTRICAL_ISSUE_DESCRIPTIONS, type ElectricalIssue } from '../helpers/CommonElectricalProblems';
import { ElectricalIssueIcon } from './ElectricalIssueIcon';

export { ELECTRICAL_ISSUES, type ElectricalIssue } from '../helpers/CommonElectricalProblems';

export type ElectricalIssueSelectorProps = {
  selectedIssue: ElectricalIssue | null;
  onSelectIssue: (issue: ElectricalIssue) => void;
};

export default function ElectricalIssueSelector({ selectedIssue, onSelectIssue }: ElectricalIssueSelectorProps) {
  return (
    <View accessibilityLabel="Electrical issue" accessibilityRole="radiogroup" style={selectorStyles.list}>
      {ELECTRICAL_ISSUES.map((issue) => {
        const selected = selectedIssue === issue;
        const emergency = issue === 'Power outage' || issue === 'Emergency electrical';
        return (
          <Pressable
            key={issue}
            accessibilityLabel={`${issue}. ${ELECTRICAL_ISSUE_DESCRIPTIONS[issue]}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onSelectIssue(issue)}
            style={({ pressed }) => [selectorStyles.row, selected && selectorStyles.selected, pressed && selectorStyles.pressed]}
          >
            <View style={[selectorStyles.icon, emergency && selectorStyles.emergencyIcon]}>
              <ElectricalIssueIcon color={emergency ? '#FF526A' : '#F5B900'} issue={issue} size={24} />
            </View>
            <View style={selectorStyles.copy}>
              <Text style={[selectorStyles.title, emergency && issue === 'Emergency electrical' && selectorStyles.emergencyTitle]}>{issue}</Text>
              {(issue === 'Power outage' || issue === 'Emergency electrical') && (
                <Text style={selectorStyles.detail}>{issue === 'Power outage' ? 'Whole house or partial' : 'Urgent'}</Text>
              )}
            </View>
            <Text accessible={false} style={selectorStyles.chevron}>›</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  list: { backgroundColor: '#0D1727', borderColor: '#263349', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { alignItems: 'center', borderBottomColor: '#263349', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 72, paddingHorizontal: 14, paddingVertical: 10 },
  selected: { backgroundColor: '#14213A' },
  pressed: { opacity: 0.7 },
  icon: { alignItems: 'center', backgroundColor: '#12213A', borderColor: '#243B5F', borderRadius: 11, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  emergencyIcon: { backgroundColor: '#341B2A', borderColor: '#743144' },
  copy: { flex: 1, marginLeft: 14 },
  title: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  emergencyTitle: { color: '#FF6B7F' },
  detail: { color: '#8997AC', fontSize: 11, marginTop: 4 },
  chevron: { color: '#D7DFEC', fontSize: 27, fontWeight: '300', marginLeft: 12 },
});
