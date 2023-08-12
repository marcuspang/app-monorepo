import { useCallback } from 'react';

import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, ScrollView } from '@onekeyhq/components';
import type { HomeRoutes } from '@onekeyhq/kit/src/routes/routesEnum';
import {
  ManageTokenModalRoutes,
  ModalRoutes,
  RootRoutes,
} from '@onekeyhq/kit/src/routes/routesEnum';
import type {
  HomeRoutesParams,
  RootRoutesParams,
} from '@onekeyhq/kit/src/routes/types';

import {
  useAccountTokens,
  useActiveWalletAccount,
  useNavigation,
} from '../../hooks';

import {
  BACK_BUTTON_HEIGHT,
  CARD_HEIGHT_CLOSED,
  CARD_MARGIN,
} from './assets/config';
import Card from './components/Card';
import SwipeGesture from './components/SwipeGesture';
import { metrics } from './constants/metrics';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProps = NativeStackNavigationProp<
  RootRoutesParams,
  RootRoutes.Main
> &
  NativeStackNavigationProp<HomeRoutesParams, HomeRoutes.FullTokenListScreen>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

// Example taken from https://github.com/mxm87/rnui/tree/master/src/screens/apple-wallet-screen
const AppleWalletScreen = () => {
  const insets = useSafeAreaInsets();
  const selectedCard = useSharedValue(-1);
  const swipeY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(
    (e) => (scrollY.value = e.contentOffset.y),
  );
  const inTransition = useSharedValue(0);
  const { accountId, networkId, walletId } = useActiveWalletAccount();
  const { data: accountTokens, loading } = useAccountTokens({
    networkId,
    accountId,
    useFilter: true,
    limitSize: 5,
  });

  const scrollContainerStyle = useAnimatedStyle(() => {
    if (metrics.isIOS) return {};
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-metrics.screenHeight / 2, 0],
            [-metrics.screenHeight / 2, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const navigation = useNavigation<NavigationProps>();
  const onNavigate = useCallback(() => {
    navigation.navigate(RootRoutes.Modal, {
      screen: ModalRoutes.ManageToken,
      params: { screen: ManageTokenModalRoutes.Listing },
    });
  }, [navigation]);

  return (
    <ScrollView>
      <IconButton
        onPress={onNavigate}
        size="sm"
        name="PlusMini"
        type="plain"
        ml="auto"
        mr={3}
      />
      <SwipeGesture {...{ selectedCard, swipeY, inTransition }}>
        <Animated.ScrollView
          style={styles.container}
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom:
              CARD_HEIGHT_CLOSED +
              CARD_MARGIN * (accountTokens.length - 1) +
              insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          scrollEnabled={selectedCard.value === -1}
          decelerationRate="fast"
        >
          <Animated.View style={[metrics.isIOS && scrollContainerStyle]}>
            {accountTokens.map((accountToken, i) => (
              <Card
                key={i}
                item={accountToken}
                index={i}
                {...{ selectedCard, scrollY, swipeY, inTransition }}
              />
            ))}
          </Animated.View>
        </Animated.ScrollView>
      </SwipeGesture>
    </ScrollView>
  );
};

export default AppleWalletScreen;
