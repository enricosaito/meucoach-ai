import { Check } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { haptics } from '../../lib/haptics'
import { radius, space, useColors } from '../../theme'
import { Txt } from '../ui'

/** A radio group rendered as full-width cards with a label and a description. */
export function OptionCards<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string
  value: T
  options: { value: T; label: string; description: string }[]
  onChange: (value: T) => void
}) {
  const colors = useColors()
  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup" accessibilityLabel={legend}>
      <Txt variant="label">{legend}</Txt>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) haptics.tap()
              onChange(option.value)
            }}
            style={[
              styles.option,
              selected
                ? { backgroundColor: colors.accentSoft, borderColor: colors.accentIcon }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Txt style={{ fontWeight: '600' }}>{option.label}</Txt>
              <Txt variant="caption" muted>
                {option.description}
              </Txt>
            </View>
            <View
              style={[
                styles.radio,
                selected
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { borderColor: colors.border },
              ]}
            >
              {selected && <Check size={12} color={colors.onAccent} strokeWidth={3.5} />}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  const colors = useColors()
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        haptics.tap()
        onChange(!checked)
      }}
      style={styles.checkRow}
    >
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: colors.accent, borderColor: colors.accent }
            : { borderColor: colors.border },
        ]}
      >
        {checked && <Check size={13} color={colors.onAccent} strokeWidth={3.5} />}
      </View>
      <Txt style={{ flex: 1 }}>{children}</Txt>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
})
