import { Image, StyleSheet, Text, View, type ViewProps } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  BACK_BUTTON_HEIGHT,
  CARD_HEADER_HEIGHT,
  CARD_HEIGHT_CLOSED,
  CARD_HEIGHT_OPEN,
  CARD_IMAGE_HEIGTH,
  CARD_MARGIN,
  SPRING_CONFIG,
} from '../assets/config';
import { theme } from '../assets/theme';
import { metrics } from '../constants/metrics';

import { ButtonsSection } from './ButtonsSections';

import type { CardProps } from '../assets/types';

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    position: 'absolute',
    width: '100%',
    overflow: 'hidden',
  },
  cardSubContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    height: CARD_HEIGHT_OPEN - CARD_HEADER_HEIGHT - CARD_IMAGE_HEIGTH,
    backgroundColor: 'orange',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: CARD_HEADER_HEIGHT,
    background: 'rgb(0,212,255)',
  },
  headerSubcontainer: {
    alignItems: 'center',
  },
  fieldSpacer: { marginTop: 32 },
  stContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.white,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  fieldValue: {
    fontSize: 21,
    color: theme.colors.white,
    textAlign: 'right',
  },
  image: {
    height: 40,
    width: 40,
    borderRadius: 1000,
    marginRight: 8,
  },
  qrContainer: {
    alignSelf: 'center',
    padding: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 6,
  },
  qr: { width: 140, height: 140 },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});

export const Flex = ({ children, style, ...rest }: ViewProps) => (
  <View style={[{ flex: 1 }, style]} {...rest}>
    {children}
  </View>
);

const Card = ({
  item,
  index,
  selectedCard,
  scrollY,
  swipeY,
  inTransition,
}: CardProps) => {
  const isDisabled = useSharedValue(false);
  const animatedHeight = useSharedValue(CARD_HEIGHT_CLOSED);
  const transY = useSharedValue(0);
  const scale = useSharedValue(1);
  const marginTop = index * CARD_MARGIN;
  const spread = 70 * index;
  const spreadOffset = Math.min(2.5 * index * index, spread);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    opacity: interpolate(scale.value, [0.9, 0.95], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-metrics.screenHeight, 0],
          [50 + spread - spreadOffset, 0],
          Extrapolation.CLAMP,
        ),
      },
      { translateY: transY.value },
      {
        scale: scale.value,
      },
    ],
  }));

  useAnimatedReaction(
    () => swipeY.value,
    (current, previous) => {
      if (selectedCard.value === index) {
        transY.value = transY.value + current - (previous ?? 0);
      }
    },
  );

  useAnimatedReaction(
    () => selectedCard.value,
    (currentSelection, previousSelection) => {
      if (selectedCard.value !== -1) {
        const isSelected = selectedCard.value === index;
        const slideUp = currentSelection >= index;
        const animateToValue = slideUp
          ? scrollY.value - marginTop
          : scrollY.value +
            metrics.screenHeight -
            marginTop -
            BACK_BUTTON_HEIGHT;

        transY.value = isSelected
          ? withSpring(animateToValue, SPRING_CONFIG.OPEN)
          : withTiming(animateToValue);

        if (isSelected) {
          animatedHeight.value = withTiming(CARD_HEIGHT_OPEN);
        } else if (slideUp) {
          scale.value = withTiming(0.9);
        }
      } else {
        if (previousSelection === index) {
          transY.value = withSpring(0, SPRING_CONFIG.CLOSE);
        } else {
          const wasAbove = (previousSelection ?? 0) > index;
          transY.value = withDelay(
            wasAbove ? 100 : 300,
            withTiming(0, {
              easing: Easing.out(Easing.quad),
            }),
          );
          if (wasAbove) {
            scale.value = withTiming(1);
          }
        }
        if (animatedHeight.value > CARD_HEIGHT_CLOSED) {
          animatedHeight.value = withTiming(CARD_HEIGHT_CLOSED);
        }
      }
    },
  );

  const handleCardPress = () => {
    if (selectedCard.value === -1 && !inTransition.value) {
      selectedCard.value = index;
    }
  };

  useAnimatedReaction(
    () => selectedCard.value === index,
    (shouldDisable) => {
      isDisabled.value = shouldDisable;
      console.log({ shouldDisable });
    },
  );

  return (
    <View onTouchStart={handleCardPress}>
      <Animated.View
        style={[styles.cardContainer, { marginTop }, animatedStyle]}
      >
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: 'gray',
            },
          ]}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Image
                source={{
                  uri: item.logoURI || '',
                }}
                style={styles.image}
              />
              <Text style={styles.title}>{item.name}</Text>
            </View>
            <View style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Text style={styles.fieldLabel}>Balance</Text>
              <Text style={styles.fieldValue}>
                {item.balance} {item.symbol}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardSubContainer}>
          <Flex>
            <View style={styles.fieldSpacer} />

            <View style={[styles.fieldSpacer, styles.stContainer]}>
              <View>
                <ButtonsSection />
              </View>

              <View>
                {/* <Text style={styles.fieldLabel}>
                  {item.tertiaryField.label}
                </Text>
                <Text style={[styles.fieldValue, { textAlign: 'right' }]}>
                  {item.tertiaryField.value}
                </Text> */}
              </View>
            </View>
          </Flex>

          {/* <View style={styles.qrContainer}>
            <Image
              source={require('../assets/images/qr-code.png')}
              style={styles.qr}
            />
          </View> */}
        </View>

        <View style={styles.borderOverlay} />
      </Animated.View>
    </View>
  );
};

export default Card;
