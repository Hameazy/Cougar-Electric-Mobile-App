import { Text, View } from 'react-native';
import { styles } from '../styles/PageStyle';

export function Logo() {
  return (
    <View style={styles.brand}>
      <View style={styles.logo}><Text style={styles.bolt}>ϟ</Text></View>
      <View style={styles.flex}>
        <Text style={styles.brandName}>COUGAR</Text>
        <Text style={styles.brandElectric}>ELECTRIC INC.</Text>
        <Text style={styles.brandCaption}>POWERING SOLUTIONS. BUILDING FUTURES.</Text>
      </View>
    </View>
  );
}
