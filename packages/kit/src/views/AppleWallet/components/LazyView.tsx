import type { FC, PropsWithChildren, ReactNode } from 'react';

import { Text, View } from 'react-native';

interface Props {
  shouldUpdate: boolean;
  children?: ReactNode;
}

export const LazyView: FC<PropsWithChildren<Props>> = (props) => {
  const { shouldUpdate, children } = props;

  // eslint-disable-next-line react/jsx-no-useless-fragment
  if (!shouldUpdate) return <Text>Placeholder</Text>;

  return <View>{children}</View>;
};
