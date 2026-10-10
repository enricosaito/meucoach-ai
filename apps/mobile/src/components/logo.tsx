import { View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { useColors } from '../theme'

/** The app mark (same drawing as the web LogoMark). */
export function LogoMark({ size = 32 }: { size?: number }) {
  const colors = useColors()
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 15.5 8.5 11l3.5 3.5L20 6.5"
          stroke={colors.accentFg}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={20} cy={6.5} r={1.6} fill={colors.accentFg} />
      </Svg>
    </View>
  )
}
