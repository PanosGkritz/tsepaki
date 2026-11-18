import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../constants/theme';
import { brandIcons } from '../data/brandIcons';
import { findService } from '../data/services';
import { getLogoUrl } from '../lib/logos';

type ServiceLogoProps = {
  id: string;
  name: string;
  fallbackColor: string;
  domain?: string;
  size?: number;
};

export const ServiceLogo = ({ id, name, fallbackColor, domain, size = 42 }: ServiceLogoProps) => {
  const [remoteFailed, setRemoteFailed] = useState(false);

  const box = { width: size, height: size, borderRadius: size * 0.32 };
  const logoDomain = domain ?? findService(id)?.domain;
  const remoteUrl = logoDomain ? getLogoUrl(logoDomain, size * 3) : undefined;

  if (remoteUrl && !remoteFailed) {
    return (
      <View style={[styles.box, box, styles.imageBox]}>
        <Image
          source={{ uri: remoteUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
          cachePolicy="disk"
          transition={150}
          accessibilityLabel={name}
          onError={() => setRemoteFailed(true)}
        />
      </View>
    );
  }

  const icon = brandIcons[id];

  if (icon) {
    const glyphSize = size * 0.52;
    return (
      <View style={[styles.box, box, styles.glyphBox]} accessibilityLabel={name}>
        <Svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24">
          <Path d={icon.path} fill={icon.hex} />
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.box, box, { backgroundColor: fallbackColor }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{name.charAt(0)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  imageBox: { overflow: 'hidden', backgroundColor: colors.surfaceRaised },
  glyphBox: { backgroundColor: colors.surfaceRaised },
  initial: { color: colors.onAccent, fontFamily: fonts.semibold },
});