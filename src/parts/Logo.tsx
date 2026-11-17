import { Image, Text, View } from 'react-native';
import { styles } from '../styles/PageStyle';

export function Logo() {
  return (
    <View style={styles.brand}>
      <Image
        accessibilityLabel="Cougar Electric logo"
        resizeMode="contain"
        source={require('../../assets/cougar-electric-mascot.png')}
        style={styles.logoImage}
      />
      <View style={styles.flex}>
        <Text style={styles.brandName}>COUGAR</Text>
        <Text style={styles.brandElectric}>ELECTRIC INC.</Text>
        <Text style={styles.brandCaption}>POWERING SOLUTIONS. BUILDING FUTURES.</Text>
      </View>
    </View>
  );
}
