/* eslint-disable react/prop-types */
import { useRef } from 'react';

import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import type { ImageURISource, StyleProp, ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
  index?: number;
  showIndex?: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export const SBImageItem: React.FC<Props> = ({
  style,
  index: _index,
  showIndex = true,
}) => {
  const index = (_index || 0) + 1;
  const source = useRef<ImageURISource>({
    uri: `https://picsum.photos/id/${index}/400/300`,
  }).current;

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="small" />
      <Image key={index} style={styles.image} source={source} />
      <Text
        style={{
          position: 'absolute',
          color: 'white',
          fontSize: 40,
          backgroundColor: '#333333',
          borderRadius: 5,
          overflow: 'hidden',
          paddingHorizontal: 10,
          paddingTop: 2,
        }}
      >
        {showIndex ? index : ''}
      </Text>
    </View>
  );
};
