import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { Grayscale } from 'react-native-color-matrix-image-filters';

export type DesaturatedImageProps = {
  uri: string;
  style?: StyleProp<ViewStyle>;
};

type ImageSize = {
  width: number;
  height: number;
};

/**
 * Imagem em PB (cancelamento efetivado).
 * Usa color-matrix nativo — `filter: grayscale` do RN não funciona com New Arch off.
 * O wrapper precisa de width/height explícitos para o filtro nativo desenhar.
 */
export function DesaturatedImage({ uri, style }: DesaturatedImageProps) {
  const [size, setSize] = useState<ImageSize>({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) {
      return;
    }
    setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
  };

  const hasSize = size.width > 0 && size.height > 0;

  return (
    <View style={[styles.fill, style]} pointerEvents='none' onLayout={handleLayout}>
      {hasSize ? (
        <Grayscale style={{ width: size.width, height: size.height, backgroundColor: '#fff0' }}>
          <Image source={{ uri }} style={{ width: size.width, height: size.height }} resizeMode='cover' />
        </Grayscale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});

export default DesaturatedImage;
