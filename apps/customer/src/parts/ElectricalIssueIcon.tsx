import { StyleSheet, Text, View } from 'react-native';
import type { ElectricalIssue } from '../helpers/CommonElectricalProblems';

type ElectricalIssueIconProps = {
  color?: string;
  issue: ElectricalIssue;
  size?: number;
};

export function ElectricalIssueIcon({ color = '#F5B900', issue, size = 28 }: ElectricalIssueIconProps) {
  const scale = size / 28;
  const icon = (() => {
    switch (issue) {
      case 'Power outage':
        return (
          <View style={iconStyles.canvas}>
            <Text style={[iconStyles.lightning, { color }]}>ϟ</Text>
            <View style={[iconStyles.outageSlash, { backgroundColor: color }]} />
          </View>
        );
      case 'Breaker keeps tripping':
        return (
          <View style={[iconStyles.breakerPanel, { borderColor: color }]}>
            <View style={[iconStyles.breakerSlot, { borderColor: color }]}><View style={[iconStyles.breakerSwitchTop, { backgroundColor: color }]} /></View>
            <View style={[iconStyles.breakerSlot, { borderColor: color }]}><View style={[iconStyles.breakerSwitchBottom, { backgroundColor: color }]} /></View>
          </View>
        );
      case 'Outlet not working':
        return (
          <View style={iconStyles.canvas}>
            <View style={[iconStyles.plugProngLeft, { backgroundColor: color }]} />
            <View style={[iconStyles.plugProngRight, { backgroundColor: color }]} />
            <View style={[iconStyles.plugBody, { borderColor: color }]} />
            <View style={[iconStyles.plugCord, { backgroundColor: color }]} />
          </View>
        );
      case 'Lighting issue':
        return (
          <View style={iconStyles.canvas}>
            <View style={[iconStyles.bulb, { borderColor: color }]} />
            <View style={[iconStyles.bulbNeck, { backgroundColor: color }]} />
            <View style={[iconStyles.bulbBase, { borderColor: color }]} />
          </View>
        );
      case 'EV charger issue':
        return (
          <View style={iconStyles.canvas}>
            <View style={[iconStyles.chargerBody, { borderColor: color }]}>
              <Text style={[iconStyles.chargerBolt, { color }]}>ϟ</Text>
            </View>
            <View style={[iconStyles.chargerCable, { borderColor: color }]} />
            <View style={[iconStyles.chargerPlug, { backgroundColor: color }]} />
          </View>
        );
      case 'Electrical panel issue':
        return (
          <View style={[iconStyles.electricalPanel, { borderColor: color }]}>
            <View style={[iconStyles.panelDividerVertical, { backgroundColor: color }]} />
            <View style={[iconStyles.panelDividerHorizontal, { backgroundColor: color }]} />
            <View style={[iconStyles.panelDotTop, { backgroundColor: color }]} />
            <View style={[iconStyles.panelDotBottom, { backgroundColor: color }]} />
          </View>
        );
      case 'Emergency electrical':
        return (
          <View style={iconStyles.canvas}>
            <Text style={[iconStyles.warningTriangle, { color }]}>△</Text>
            <Text style={[iconStyles.warningMark, { color }]}>!</Text>
          </View>
        );
      case 'Other':
        return <Text style={[iconStyles.other, { borderColor: color, color }]}>?</Text>;
    }
  })();

  return (
    <View accessible={false} style={[iconStyles.container, { height: size, width: size }]}>
      <View style={{ transform: [{ scale }] }}>{icon}</View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  canvas: { height: 28, position: 'relative', width: 28 },
  lightning: { fontSize: 30, fontWeight: '800', left: 5, lineHeight: 30, position: 'absolute', top: -2 },
  outageSlash: { height: 2, left: 3, position: 'absolute', top: 13, transform: [{ rotate: '-45deg' }], width: 23 },
  breakerPanel: { alignItems: 'center', borderRadius: 3, borderWidth: 2, flexDirection: 'row', gap: 4, height: 23, justifyContent: 'center', width: 27 },
  breakerSlot: { borderRadius: 4, borderWidth: 1.5, height: 14, position: 'relative', width: 6 },
  breakerSwitchTop: { borderRadius: 2, height: 4, left: 1, position: 'absolute', top: 1, width: 2 },
  breakerSwitchBottom: { borderRadius: 2, bottom: 1, height: 4, left: 1, position: 'absolute', width: 2 },
  plugProngLeft: { height: 7, left: 8, position: 'absolute', top: 1, width: 2 },
  plugProngRight: { height: 7, position: 'absolute', right: 8, top: 1, width: 2 },
  plugBody: { borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderWidth: 2, height: 14, left: 5, position: 'absolute', top: 7, width: 18 },
  plugCord: { bottom: 1, height: 7, left: 13, position: 'absolute', width: 2 },
  bulb: { borderRadius: 9, borderWidth: 2, height: 18, left: 5, position: 'absolute', top: 0, width: 18 },
  bulbNeck: { height: 4, left: 12, position: 'absolute', top: 17, width: 4 },
  bulbBase: { borderBottomWidth: 2, borderTopWidth: 2, bottom: 1, height: 6, left: 9, position: 'absolute', width: 10 },
  chargerBody: { alignItems: 'center', borderRadius: 3, borderWidth: 2, height: 27, justifyContent: 'center', left: 1, position: 'absolute', top: 0, width: 18 },
  chargerBolt: { fontSize: 18, fontWeight: '800', lineHeight: 20 },
  chargerCable: { borderBottomRightRadius: 8, borderBottomWidth: 2, borderRightWidth: 2, height: 19, position: 'absolute', right: 2, top: 4, width: 8 },
  chargerPlug: { height: 6, position: 'absolute', right: 0, top: 1, width: 4 },
  electricalPanel: { borderRadius: 3, borderWidth: 2, height: 27, position: 'relative', width: 23 },
  panelDividerVertical: { height: 19, left: 9, position: 'absolute', top: 2, width: 1 },
  panelDividerHorizontal: { height: 1, left: 2, position: 'absolute', top: 11, width: 15 },
  panelDotTop: { borderRadius: 2, height: 3, position: 'absolute', right: 1, top: 4, width: 3 },
  panelDotBottom: { borderRadius: 2, bottom: 4, height: 3, position: 'absolute', right: 1, width: 3 },
  warningTriangle: { fontSize: 34, fontWeight: '700', left: -1, lineHeight: 32, position: 'absolute', top: -4 },
  warningMark: { fontSize: 15, fontWeight: '900', left: 11, position: 'absolute', top: 8 },
  other: { borderRadius: 14, borderWidth: 2, fontSize: 18, fontWeight: '800', height: 27, lineHeight: 23, textAlign: 'center', width: 27 },
});
