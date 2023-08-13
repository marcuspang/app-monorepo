/* eslint-disable react/prop-types */
import Constants from 'expo-constants';
import { LongPressGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { SBImageItem } from './SBImageItem';
import { SBTextItem } from './SBTextItem';

import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { AnimateProps } from 'react-native-reanimated';
import { useState } from 'react';

interface Props extends AnimateProps<ViewProps> {
  style?: StyleProp<ViewStyle>;
  index?: number;
  pretty?: boolean;
}

export const SBItem: React.FC<Props> = (props) => {
  const { style, index, pretty, testID, ...animatedViewProps } = props;
  const enablePretty = Constants?.expoConfig?.extra?.enablePretty || false;
  const [isPretty, setIsPretty] = useState(pretty || enablePretty);
  return (
    <LongPressGestureHandler
      onActivated={() => {
        setIsPretty(!isPretty);
      }}
    >
      <Animated.View testID={testID} style={{ flex: 1 }} {...animatedViewProps}>
        {isPretty ? (
          <SBImageItem
            style={style}
            index={index}
            showIndex={typeof index === 'number'}
          />
        ) : (
          <SBTextItem style={style} index={index} />
        )}
      </Animated.View>
    </LongPressGestureHandler>
  );
};
