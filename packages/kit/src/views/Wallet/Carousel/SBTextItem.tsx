/* eslint-disable react/prop-types */
import { StyleSheet, Text, View } from 'react-native';

import type { StyleProp, ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
  index?: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'red',
  },
});

export const SBTextItem: React.FC<Props> = ({ style, index }) => (
  <View style={[styles.container, style]}>
    {typeof index === 'number' && (
      <Text style={{ fontSize: 30, color: 'black' }}>{index}</Text>
    )}
  </View>
);
