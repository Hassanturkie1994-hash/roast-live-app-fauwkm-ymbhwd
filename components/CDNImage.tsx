
import React from 'react';
import { Image, ImageProps } from 'react-native';

interface CDNImageProps extends ImageProps {
  cdnUrl?: string;
}

export default function CDNImage({ cdnUrl, ...props }: CDNImageProps) {
  return <Image {...props} source={{ uri: cdnUrl }} />;
}
