// The card that sits over the bottom of the map (like DoorDash / Uber).
// Drag the top part up or down, or tap the little handle, to open or close it.
// Built with plain React Native Animated and touch handlers, so we don't need
// any extra gesture libraries.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { MAP_COLORS } from './ServiceMapTypes';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MapBottomSheet({
  expanded,
  onExpandedChange,
  expandedHeight,
  bottomPadding,
  header,
  children,
  onPeekHeightChange,
  variant = 'sheet',
  panelTop = 0,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  expandedHeight: number;
  bottomPadding: number;
  header: ReactNode;
  children: ReactNode;
  onPeekHeightChange?: (height: number) => void;
  // 'panel' = a fixed card down the left side, used on wide screens (laptops)
  variant?: 'sheet' | 'panel';
  panelTop?: number;
}) {
  // the closed sheet shows exactly the header, however tall it ends up
  const [headerHeight, setHeaderHeight] = useState(220);
  const peekHeight = Math.min(expandedHeight, headerHeight + bottomPadding);
  const travel = Math.max(0, expandedHeight - peekHeight);

  // useState (not useRef) so the same Animated.Value is kept between renders
  const [translateY] = useState(() => new Animated.Value(travel));
  // where the finger started and how fast it's moving, only used inside the touch handlers
  const drag = useRef({ startX: 0, startY: 0, offset: 0, lastY: 0, lastTime: 0, speed: 0 });

  useEffect(() => {
    onPeekHeightChange?.(peekHeight);
  }, [peekHeight, onPeekHeightChange]);

  useEffect(() => {
    slideTo(expanded ? 0 : travel);
    // slideTo only uses translateY, which never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, travel]);

  function slideTo(position: number) {
    Animated.spring(translateY, { toValue: position, useNativeDriver: USE_NATIVE_DRIVER, bounciness: 0, speed: 16 }).start();
  }

  function isVerticalDrag(event: GestureResponderEvent) {
    const dx = event.nativeEvent.pageX - drag.current.startX;
    const dy = event.nativeEvent.pageY - drag.current.startY;
    return Math.abs(dy) > 6 && Math.abs(dy) > Math.abs(dx);
  }

  // React Native's touch "responder" props. We only take over clearly up/down
  // drags, so taps on the buttons and side-scrolling the filter chips still work.
  const dragHandlers = {
    onStartShouldSetResponderCapture: (event: GestureResponderEvent) => {
      drag.current.startX = event.nativeEvent.pageX;
      drag.current.startY = event.nativeEvent.pageY;
      return false;
    },
    onMoveShouldSetResponderCapture: isVerticalDrag,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event: GestureResponderEvent) => {
      translateY.stopAnimation((value) => {
        drag.current.offset = value;
      });
      drag.current.lastY = event.nativeEvent.pageY;
      drag.current.lastTime = Date.now();
      drag.current.speed = 0;
    },
    onResponderMove: (event: GestureResponderEvent) => {
      const y = event.nativeEvent.pageY;
      const now = Date.now();
      if (now > drag.current.lastTime) drag.current.speed = (y - drag.current.lastY) / (now - drag.current.lastTime);
      drag.current.lastY = y;
      drag.current.lastTime = now;
      translateY.setValue(clamp(drag.current.offset + y - drag.current.startY, 0, travel));
    },
    onResponderRelease: (event: GestureResponderEvent) => {
      const position = clamp(drag.current.offset + event.nativeEvent.pageY - drag.current.startY, 0, travel);
      let open = position < travel / 2;
      // a quick flick wins over where the sheet was let go
      if (drag.current.speed < -0.4) open = true;
      if (drag.current.speed > 0.4) open = false;

      if (open === expanded) slideTo(open ? 0 : travel);
      else onExpandedChange(open);
    },
  };

  if (variant === 'panel') {
    return (
      <View style={[sheetStyles.panel, { top: panelTop }]}>
        <View>{header}</View>
        <ScrollView
          style={sheetStyles.body}
          contentContainerStyle={[sheetStyles.bodyContent, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <Animated.View style={[sheetStyles.sheet, { height: expandedHeight, transform: [{ translateY }] }]}>
      <View
        {...dragHandlers}
        onLayout={(event) => setHeaderHeight(Math.ceil(event.nativeEvent.layout.height))}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less' : 'Show more'}
          hitSlop={{ top: 10, bottom: 10, left: 60, right: 60 }}
          onPress={() => onExpandedChange(!expanded)}
          style={sheetStyles.handleTarget}
        >
          <View style={sheetStyles.handle} />
        </Pressable>
        {header}
      </View>

      <ScrollView
        style={sheetStyles.body}
        contentContainerStyle={[sheetStyles.bodyContent, { paddingBottom: bottomPadding + 20 }]}
        scrollEnabled={expanded}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const sheetStyles = StyleSheet.create({
  sheet: {
    backgroundColor: MAP_COLORS.night,
    borderColor: MAP_COLORS.line,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 5,
  },
  panel: {
    backgroundColor: MAP_COLORS.night,
    borderColor: MAP_COLORS.line,
    borderRadius: 24,
    borderWidth: 1,
    bottom: 16,
    left: 16,
    overflow: 'hidden',
    paddingTop: 18,
    position: 'absolute',
    width: 420,
    zIndex: 5,
  },
  handleTarget: { alignItems: 'center', paddingBottom: 6, paddingTop: 10 },
  handle: { backgroundColor: '#4A5363', borderRadius: 3, height: 5, width: 44 },
  body: { flex: 1 },
  bodyContent: { gap: 12, paddingHorizontal: 18 },
});
