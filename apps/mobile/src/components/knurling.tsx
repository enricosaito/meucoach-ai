import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg'

/**
 * A barbell-knurling texture: a fine diamond crosshatch, drawn very faintly behind content
 * (celebrations, hero cards). Purely decorative, so it's hidden from screen readers and never
 * strong enough to compete with text.
 */
export function Knurling({
  color,
  opacity = 0.06,
  cell = 10,
  style,
}: {
  color: string
  opacity?: number
  /** Size of one diamond in px. */
  cell?: number
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, style]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="knurl" width={cell} height={cell} patternUnits="userSpaceOnUse">
            <Path
              d={`M0 0L${String(cell)} ${String(cell)}M${String(cell)} 0L0 ${String(cell)}`}
              stroke={color}
              strokeWidth={1}
              strokeOpacity={opacity}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#knurl)" />
      </Svg>
    </View>
  )
}
