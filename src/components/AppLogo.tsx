import { View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useTheme } from '../providers/PreferencesProvider';

type AppLogoProps = {
  size?: number;
  color?: string;
  background?: string;
};

export const AppLogo = ({ size = 72, color = '#FFFFFF', background }: AppLogoProps) => {
  const colors = useTheme();

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Tsepaki"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.23,
        backgroundColor: background ?? colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 100 100">
        <Rect x={26} y={20} width={16} height={22} rx={5} fill={color} opacity={0.55} />
        <Rect x={44} y={13} width={16} height={29} rx={5} fill={color} />
        <Rect x={62} y={23} width={16} height={19} rx={5} fill={color} opacity={0.8} />
        <Rect x={18} y={40} width={64} height={42} rx={11} fill="none" stroke={color} strokeWidth={5} />
        <Circle cx={69} cy={61} r={4.5} fill={color} />
      </Svg>
    </View>
  );
};