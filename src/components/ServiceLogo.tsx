import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../constants/theme';
import { brandIcons } from '../data/brandIcons';
import { findService } from '../data/services';
import { getLogoUrl } from '../lib/logos';
import { useTheme } from '../providers/PreferencesProvider';

type ServiceLogoProps = {
  id: string;
  name: string;
  fallbackColor: string;
  domain?: string;
  size?: number;
};

const toHex = (value: string) => (value.startsWith('#') ? value : `#${value}`);

export const ServiceLogo = ({ id, name, fallbackColor, domain, size = 42 }: ServiceLogoProps) => {
  const colors = useTheme();
  const [remoteFailed, setRemoteFailed] = useState(false);
  const service = findService(id);
  const boxStyle = { width: size, height: size, borderRadius: size * 0.32 };

  if (service?.icon) {
    return (
      <View
        style={[styles.box, boxStyle, { backgroundColor: service.color }]}
        accessibilityLabel={name}
      >
        <Ionicons name={service.icon} size={size * 0.52} color="#FFFFFF" />
      </View>
    );
  }

  const logoDomain = domain ?? service?.domain;
  const logoUrl = logoDomain ? getLogoUrl(logoDomain, size * 3) : undefined;

  if (logoUrl && !remoteFailed) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={boxStyle}
        cachePolicy="disk"
        contentFit="cover"
        onError={() => setRemoteFailed(true)}
        accessibilityLabel={name}
      />
    );
  }

  const brandIcon = brandIcons[id];

  if (brandIcon) {
    return (
      <View
        style={[styles.box, boxStyle, { backgroundColor: colors.surfaceRaised }]}
        accessibilityLabel={name}
      >
        <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
          <Path d={brandIcon.path} fill={toHex(brandIcon.hex)} />
        </Svg>
      </View>
    );
  }

  return (
    <View
      style={[styles.box, boxStyle, { backgroundColor: fallbackColor }]}
      accessibilityLabel={name}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { color: '#FFFFFF', fontFamily: fonts.semibold },
});