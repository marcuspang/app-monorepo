import { Dimensions, Platform } from 'react-native';

import type { ScaledSize } from 'react-native';

export const HEADER_HEIGHT = 100;

export const ElementsText = {
  AUTOPLAY: 'AutoPlay',
};

export const window: ScaledSize =
  Platform.OS === 'web'
    ? {
        ...Dimensions.get('window'),
        width: 700,
      }
    : Dimensions.get('window');
