/* eslint-disable @typescript-eslint/no-use-before-define */

import { forwardRef, PropsWithChildren, ReactElement, useCallback, useImperativeHandle } from 'react';

import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS, useDerivedValue } from 'react-native-reanimated';

import { useAutoPlay } from './hooks/useAutoPlay';
import { useCarouselController } from './hooks/useCarouselController';
import { useCommonVariables } from './hooks/useCommonVariables';
import { useInitProps } from './hooks/useInitProps';
import { useLayoutConfig } from './hooks/useLayoutConfig';
import { useOnProgressChange } from './hooks/useOnProgressChange';
import { usePropsErrorBoundary } from './hooks/usePropsErrorBoundary';
import { useVisibleRanges } from './hooks/useVisibleRanges';
import { BaseLayout } from './layouts/BaseLayout';
import { ScrollViewGesture } from './ScrollViewGesture';
import { CTX } from './store';
import { computedRealIndexWithAutoFillData } from './utils/computedWithAutoFillData';

import type { ICarouselInstance, TCarouselProps } from './types';

const Carousel = forwardRef<ICarouselInstance, TCarouselProps<any>>(
  (_props, ref) => {
    const props = useInitProps(_props);

    const {
      testID,
      loop,
      autoFillData,
      // Fill data with autoFillData
      data,
      // Length of fill data
      dataLength,
      // Raw data that has not been processed
      rawData,
      // Length of raw data
      rawDataLength,
      mode,
      style,
      width,
      height,
      vertical,
      autoPlay,
      windowSize,
      autoPlayReverse,
      autoPlayInterval,
      scrollAnimationDuration,
      withAnimation,
      renderItem,
      onScrollEnd,
      onSnapToItem,
      onScrollBegin,
      onProgressChange,
      customAnimation,
      defaultIndex,
    } = props;

    const commonVariables = useCommonVariables(props);
    const { size, handlerOffset } = commonVariables;

    const offsetX = useDerivedValue(() => {
      const totalSize = size * dataLength;
      const x = handlerOffset.value % totalSize;

      if (!loop) return handlerOffset.value;

      return isNaN(x) ? 0 : x;
    }, [loop, size, dataLength]);

    usePropsErrorBoundary({ ...props, dataLength });
    useOnProgressChange({
      autoFillData,
      loop,
      size,
      offsetX,
      rawDataLength,
      onProgressChange,
    });

    const carouselController = useCarouselController({
      loop,
      size,
      dataLength,
      autoFillData,
      handlerOffset,
      withAnimation,
      defaultIndex,
      onScrollEnd: () => runOnJS(_onScrollEnd)(),
      onScrollBegin: () => !!onScrollBegin && runOnJS(onScrollBegin)(),
      duration: scrollAnimationDuration,
    });

    const { next, prev, scrollTo, getSharedIndex, getCurrentIndex } =
      carouselController;

    const { start: startAutoPlay, pause: pauseAutoPlay } = useAutoPlay({
      autoPlay,
      autoPlayInterval,
      autoPlayReverse,
      carouselController,
    });

    const _onScrollEnd = useCallback(() => {
      const _sharedIndex = Math.round(getSharedIndex());

      const realIndex = computedRealIndexWithAutoFillData({
        index: _sharedIndex,
        dataLength: rawDataLength,
        loop,
        autoFillData,
      });

      if (onSnapToItem) onSnapToItem(realIndex);

      if (onScrollEnd) onScrollEnd(realIndex);
    }, [
      loop,
      autoFillData,
      rawDataLength,
      getSharedIndex,
      onSnapToItem,
      onScrollEnd,
    ]);

    const scrollViewGestureOnScrollBegin = useCallback(() => {
      pauseAutoPlay();
      onScrollBegin?.();
    }, [onScrollBegin, pauseAutoPlay]);

    const scrollViewGestureOnScrollEnd = useCallback(() => {
      startAutoPlay();
      _onScrollEnd();
    }, [_onScrollEnd, startAutoPlay]);

    const scrollViewGestureOnTouchBegin = useCallback(pauseAutoPlay, [
      pauseAutoPlay,
    ]);

    const scrollViewGestureOnTouchEnd = useCallback(startAutoPlay, [
      startAutoPlay,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        next,
        prev,
        getCurrentIndex,
        scrollTo,
      }),
      [getCurrentIndex, next, prev, scrollTo],
    );

    const visibleRanges = useVisibleRanges({
      total: dataLength,
      viewSize: size,
      translation: handlerOffset,
      windowSize,
    });

    const layoutConfig = useLayoutConfig({ ...props, size });

    const renderLayout = useCallback(
      (item: any, i: number) => {
        const realIndex = computedRealIndexWithAutoFillData({
          index: i,
          dataLength: rawDataLength,
          loop,
          autoFillData,
        });

        return (
          <BaseLayout
            key={i}
            index={i}
            handlerOffset={offsetX}
            visibleRanges={visibleRanges}
            animationStyle={customAnimation || layoutConfig}
          >
            {({ animationValue }) =>
              renderItem({
                item,
                index: realIndex,
                animationValue,
              })
            }
          </BaseLayout>
        );
      },
      [
        loop,
        rawData,
        offsetX,
        visibleRanges,
        autoFillData,
        renderItem,
        layoutConfig,
        customAnimation,
      ],
    );

    return (
      <GestureHandlerRootView>
        <CTX.Provider value={{ props, common: commonVariables }}>
          <ScrollViewGesture
            key={mode}
            size={size}
            translation={handlerOffset}
            style={[
              styles.container,
              {
                width: width || '100%',
                height: height || '100%',
              },
              style,
              vertical ? styles.itemsVertical : styles.itemsHorizontal,
            ]}
            testID={testID}
            onScrollBegin={scrollViewGestureOnScrollBegin}
            onScrollEnd={scrollViewGestureOnScrollEnd}
            onTouchBegin={scrollViewGestureOnTouchBegin}
            onTouchEnd={scrollViewGestureOnTouchEnd}
          >
            {data.map(renderLayout)}
          </ScrollViewGesture>
        </CTX.Provider>
      </GestureHandlerRootView>
    );
  },
);

export default Carousel as <T extends any>(
  props: PropsWithChildren<TCarouselProps<T>>,
) => ReactElement;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  itemsHorizontal: {
    flexDirection: 'row',
  },
  itemsVertical: {
    flexDirection: 'column',
  },
});
