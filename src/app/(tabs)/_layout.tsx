import { Tabs } from 'expo-router';
import { Dimensions, Easing } from 'react-native';
import { BottomNavigation } from '../../parts/BottomNavigation';

const PAGE_WIDTH = Dimensions.get('window').width;

export default function CustomerTabsLayout() {
  return (
    <Tabs
      backBehavior="none"
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        lazy: false,
        sceneStyle: { backgroundColor: '#070B13' },
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-PAGE_WIDTH, 0, PAGE_WIDTH],
                }),
              },
            ],
          },
        }),
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 280,
            easing: Easing.out(Easing.cubic),
          },
        },
      }}
      tabBar={(props) => <BottomNavigation {...props} />}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="my-jobs" options={{ title: 'My Jobs' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
