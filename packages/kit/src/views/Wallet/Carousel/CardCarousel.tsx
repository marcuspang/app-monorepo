/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import * as React from 'react';

import { Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { HStack } from '@onekeyhq/components/src';

import { useAccountTokens, useActiveWalletAccount } from '../../../hooks';
import Carousel from '../../AppleWallet/components/Carousel';

import { Card } from './Card';

function CardCarousel() {
  const { width, height } = useWindowDimensions();
  const progressValue = useSharedValue<number>(0);
  const baseOptions = {
    vertical: false,
    width,
    height: height * 0.5,
  } as const;
  const { accountId, networkId, walletId } = useActiveWalletAccount();
  const { data: accountTokens, loading } = useAccountTokens({
    networkId,
    accountId,
    useFilter: true,
    limitSize: 5,
  });
  console.log({ accountTokens });

  return (
    <View
      style={{
        alignItems: 'center',
      }}
    >
      <Carousel
        {...baseOptions}
        style={{
          width,
        }}
        loop
        snapEnabled
        onProgressChange={(a, absoluteProgress) => {
          if (a !== 0 && absoluteProgress !== 0) {
            progressValue.value = absoluteProgress;
          }
        }}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.8,
          parallaxAdjacentItemScale: 0.5,
          // parallaxScrollingOffset: 50,
        }}
        data={accountTokens}
        renderItem={({ index, item }) => <Card index={index} item={item} />}
      />
      {!!progressValue && (
        <HStack
          style={{
            justifyContent: 'space-between',
            width: 100,
          }}
        >
          {accountTokens.map((_, index) => (
            <PaginationItem
              backgroundColor="black"
              animValue={progressValue}
              index={index}
              key={index}
              isRotate={false}
              length={accountTokens.length}
            />
          ))}
        </HStack>
      )}
    </View>
  );
}

const PaginationItem: React.FC<{
  index: number;
  backgroundColor: string;
  length: number;
  animValue: Animated.SharedValue<number>;
  isRotate?: boolean;
}> = (props) => {
  const { animValue, index, length, backgroundColor, isRotate } = props;
  const width = 10;

  const animStyle = useAnimatedStyle(() => {
    let inputRange = [index - 1, index, index + 1];
    let outputRange = [-width, 0, width];

    if (index === 0 && animValue?.value > length - 1) {
      inputRange = [length - 1, length, length + 1];
      outputRange = [-width, 0, width];
    }

    return {
      transform: [
        {
          translateX: interpolate(
            animValue?.value,
            inputRange,
            outputRange,
            Extrapolate.CLAMP,
          ),
        },
      ],
    };
  }, [animValue, index, length]);
  return (
    <View
      style={{
        backgroundColor: 'white',
        width,
        height: width,
        borderRadius: 50,
        overflow: 'hidden',
        transform: [
          {
            rotateZ: isRotate ? '90deg' : '0deg',
          },
        ],
      }}
    >
      <Animated.View
        style={[
          {
            borderRadius: 50,
            backgroundColor,
            flex: 1,
          },
          animStyle,
        ]}
      />
    </View>
  );
};

export default CardCarousel;
