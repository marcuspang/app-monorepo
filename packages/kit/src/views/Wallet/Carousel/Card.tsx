/* eslint-disable react/prop-types */

import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LongPressGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import platformEnv from '@onekeyhq/shared/src/platformEnv';

import {
  FormatBalance,
  FormatCurrencyNumber,
} from '../../../components/Format';
import { CARD_HEADER_HEIGHT } from '../../AppleWallet/assets/config';
import { ButtonsSection } from '../../AppleWallet/components/ButtonsSections';
import { bgImgUrls, linearGradients } from '../../AppleWallet/components/Card';

import type { CardProps } from '../../AppleWallet/assets/types';

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    border: 0,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    color: 'lightgrey',
  },
  cardSubContainer: {
    paddingHorizontal: 16,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 12,
    // height: CARD_HEIGHT_OPEN - CARD_HEADER_HEIGHT,
    // backgroundColor: '#FDC921',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#13070C',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: CARD_HEADER_HEIGHT,
    border: 0,
    backgroundColor: 'transparent',
  },
  headerSubcontainer: {
    alignItems: 'center',
  },
  fieldSpacer: { marginTop: 16 },
  stContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#13070C',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  fieldValue: {
    fontSize: 21,
    color: '#13070C',
    textAlign: 'right',
  },
  image: {
    height: 40,
    width: 40,
    borderRadius: 1000,
    marginRight: 8,
    borderWidth: 1,
  },
  bgImg: {
    resizeMode: 'cover',
    height: '100%',
  },
});

export const Card: React.FC<
  Omit<CardProps, 'selectedCard' | 'scrollY' | 'swipeY' | 'inTransition'>
> = (props) => {
  const { index, item } = props;

  const linearGradient = linearGradients[index % linearGradients.length];
  const bgImgUrl = bgImgUrls[index % bgImgUrls.length];

  return (
    <LongPressGestureHandler>
      <View
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              shadowColor: 'black',
              shadowOffset: {
                width: 0,
                height: 8,
              },
              shadowRadius: 4,
              shadowOpacity: 0.1,
              height: '100%',
              backgroundImage: linearGradient,
            },
          ]}
        >
          <ImageBackground source={{ uri: bgImgUrl }} style={styles.bgImg}>
            <View style={styles.headerContainer}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                  height: '100%',
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
                <View
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <FormatBalance
                    balance={item.balance}
                    suffix={item.symbol}
                    formatOptions={{
                      fixed: 4,
                    }}
                    render={(ele) => (
                      <Text style={styles.fieldValue}>{ele}</Text>
                    )}
                  />
                  <Text style={styles.fieldLabel}>
                    <FormatCurrencyNumber
                      decimals={2}
                      value={0}
                      convertValue={+item.usdValue}
                    />
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.cardSubContainer,
                {
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingBottom: 76,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: platformEnv.isNativeIOS ? 'Menlo' : 'monospace',
                }}
              >
                4242 4242 4242 4242
              </Text>
            </View>
          </ImageBackground>
        </Animated.View>
        <ButtonsSection {...item} />
      </View>
    </LongPressGestureHandler>
  );
};
