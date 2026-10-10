import { palette, type TypeVariant } from '@mycoach/brand'
import { greetingName } from '@mycoach/core/profile/contracts'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { avatarUrl } from '../lib/avatar'
import { useI18n } from '../lib/i18n'
import { useMe } from '../lib/me'
import { font, tabular, textStyles, weightToFont } from '../lib/typography'
import { radius, space, useColors, type Colors } from '../theme'

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/**
 * All text goes through Txt: a variant from the brand type scale, a semantic color, optional
 * tabular figures. A `fontWeight` in `style` picks the matching face of the variant's font.
 */
export function Txt({
  variant = 'body',
  color,
  muted,
  tabularNums,
  style,
  children,
  numberOfLines,
}: {
  variant?: TypeVariant
  color?: keyof Colors
  muted?: boolean
  /** Align digits (lists, logs, stats). Display number styles already have it. */
  tabularNums?: boolean
  style?: StyleProp<TextStyle>
  children: ReactNode
  numberOfLines?: number
}) {
  const colors = useColors()
  const { fontWeight, ...rest } = StyleSheet.flatten(style) ?? {}
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        textStyles[variant],
        { color: colors[color ?? (muted ? 'textSecondary' : 'textPrimary')] },
        tabularNums && tabular,
        rest,
        weightToFont(variant, fontWeight),
      ]}
    >
      {children}
    </Text>
  )
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

/**
 * The basic container: a calm surface with a hairline border. `elevated` lifts it with a soft
 * shadow instead (sheets, highlighted cards).
 */
export function Card({
  style,
  elevated = false,
  children,
}: {
  style?: StyleProp<ViewStyle>
  elevated?: boolean
  children: ReactNode
}) {
  const colors = useColors()
  return (
    <View
      style={[
        styles.card,
        elevated
          ? [styles.cardElevated, { backgroundColor: colors.surfaceElevated }]
          : { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  )
}

/**
 * Safe-area padding a tab screen must add itself. Each platform handles a different part:
 * - iOS: native tabs force automatic content-inset adjustment on a tab's first ScrollView, so
 *   iOS already insets for the status bar and the floating tab bar. Adding them again leaves a
 *   blank band (the status bar height) at the top.
 * - Android: native tabs wrap the screen in a SafeAreaView for the bottom (tab bar) only; the top
 *   is ours.
 * - Web (dev preview): nothing is automatic; the custom tab bar is 64 px tall.
 */
function screenPadding(insets: { top: number; bottom: number }) {
  if (Platform.OS === 'ios') return { top: space.md, bottom: space.xxl }
  if (Platform.OS === 'android') return { top: insets.top + space.md, bottom: space.xxl }
  return { top: insets.top + space.md, bottom: 64 + space.xxl }
}

/**
 * A scrolling tab screen. Starts with a header row (title left, avatar linking to Profile right)
 * that scrolls with the content. Screens with their own header (Home) pass neither.
 */
export function Screen({
  children,
  title,
  showAvatar = true,
  headerRight,
  onRefresh,
  refreshing = false,
}: {
  children: ReactNode
  title?: string
  showAvatar?: boolean
  /** Buttons at the right of the title (e.g. settings); shown instead of the avatar. */
  headerRight?: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
}) {
  const colors = useColors()
  const padding = screenPadding(useSafeAreaInsets())
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingTop: padding.top,
        paddingHorizontal: space.lg,
        paddingBottom: padding.bottom,
        gap: space.xl,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        ) : undefined
      }
    >
      {(title !== undefined || showAvatar || headerRight) && (
        <View style={styles.header}>
          <Txt variant="displayL" numberOfLines={1} style={styles.screenTitle}>
            {title ?? ''}
          </Txt>
          {headerRight ?? (showAvatar && <ProfileAvatarLink />)}
        </View>
      )}
      {children}
    </ScrollView>
  )
}

export function ProfileAvatarLink() {
  const { me } = useMe()
  const { t } = useI18n()
  return (
    <Link href="/profile" asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={t('nav.profile')} hitSlop={8}>
        <Avatar
          name={me ? greetingName(me.profile) : null}
          path={me?.profile.avatarPath ?? null}
          size={40}
        />
      </Pressable>
    </Link>
  )
}

export function Avatar({
  name,
  path,
  size,
}: {
  name: string | null
  path: string | null
  size: number
}) {
  const colors = useColors()
  const initials =
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  const src = avatarUrl(path)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text style={[font('display', 800), { color: colors.accentText, fontSize: size * 0.34 }]}>
          {initials}
        </Text>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

/**
 * Buttons are pills. Primary is signal orange with graphite text (white on orange fails AA);
 * secondary is a quiet neutral; ghost is orange text for low-emphasis actions. Disabled buttons
 * turn neutral rather than faded orange, so they never look tappable.
 */
export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  trailingIcon,
  style,
}: {
  children: ReactNode
  onPress: () => void
  variant?: ButtonVariant
  size?: 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  /** Shown after the label, e.g. an arrow on a call to action. */
  trailingIcon?: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const colors = useColors()
  const inactive = disabled && !loading
  const fg = inactive
    ? colors.textDisabled
    : variant === 'primary'
      ? colors.onAccent
      : variant === 'ghost'
        ? colors.accentText
        : colors.textPrimary
  const background = (pressed: boolean) => {
    if (inactive) return variant === 'ghost' ? 'transparent' : colors.surfaceMuted
    if (variant === 'primary') return pressed ? colors.accentPressed : colors.accent
    if (variant === 'ghost') return pressed ? colors.accentSoft : 'transparent'
    return pressed ? colors.border : colors.surfaceMuted
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && styles.buttonLg,
        { backgroundColor: background(pressed), transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon}
      <Text style={[textStyles.label, font('ui', 700), styles.buttonLabel, { color: fg }]}>
        {children}
      </Text>
      {!loading && trailingIcon}
    </Pressable>
  )
}

type ChipTone = 'neutral' | 'accent' | 'recovery'

/** A small rounded tag (status, filter, metadata). */
export function Chip({
  icon,
  tone = 'neutral',
  children,
  style,
}: {
  icon?: ReactNode
  tone?: ChipTone
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const colors = useColors()
  const toneColors = {
    neutral: { bg: colors.surfaceMuted, fg: colors.textPrimary },
    accent: { bg: colors.accentSoft, fg: colors.accentText },
    recovery: { bg: colors.recoverySoft, fg: colors.recoveryText },
  }[tone]
  return (
    <View style={[styles.chip, { backgroundColor: toneColors.bg }, style]}>
      {icon}
      {typeof children === 'string' ? (
        <Txt variant="label" style={{ color: toneColors.fg }}>
          {children}
        </Txt>
      ) : (
        children
      )}
    </View>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <Txt variant="label" color="error">
      {children}
    </Txt>
  )
}

export function Skeleton({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  const colors = useColors()
  return (
    <View
      style={[{ height, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted }, style]}
    />
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xl,
    gap: space.md,
  },
  cardElevated: {
    borderWidth: 0,
    shadowColor: palette.graphite,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  screenTitle: { flex: 1, fontSize: 28, lineHeight: 34 },
  button: {
    height: 48,
    borderRadius: radius.full,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    alignSelf: 'flex-start',
  },
  buttonLg: { height: 56, paddingHorizontal: space.xxl },
  buttonLabel: { fontSize: 16, lineHeight: 22 },
  chip: {
    height: 32,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
})

/** A labelled text field; the border turns orange while it has focus. */
export function Input({
  label,
  hint,
  prefix,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label: string; hint?: string; prefix?: string }) {
  const colors = useColors()
  const [focused, setFocused] = useState(false)
  return (
    <View style={{ gap: space.sm }}>
      <Txt variant="label">{label}</Txt>
      <View
        style={[
          inputStyles.box,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: focused ? colors.accentIcon : colors.border,
          },
        ]}
      >
        {prefix && <Txt muted>{prefix}</Txt>}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accentIcon}
          cursorColor={colors.accentIcon}
          {...props}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          style={[inputStyles.input, { color: colors.textPrimary }]}
        />
      </View>
      {hint && (
        <Txt variant="caption" muted>
          {hint}
        </Txt>
      )}
    </View>
  )
}

/** A row of mutually exclusive options (like iOS segmented controls). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const colors = useColors()
  return (
    <View
      accessibilityRole="radiogroup"
      style={[inputStyles.segmented, { backgroundColor: colors.surfaceMuted }]}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(option.value)
            }}
            style={[
              inputStyles.segment,
              selected && [
                inputStyles.segmentSelected,
                { backgroundColor: colors.controlSelected, borderColor: colors.border },
              ],
            ]}
          >
            <Txt
              variant="label"
              tabularNums
              muted={!selected}
              style={{ fontWeight: selected ? '700' : '500' }}
            >
              {option.label}
            </Txt>
          </Pressable>
        )
      })}
    </View>
  )
}

const inputStyles = StyleSheet.create({
  box: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  input: { flex: 1, fontSize: 16, height: '100%', ...font('ui', 500) },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: space.xs, gap: space.xs },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  segmentSelected: {
    shadowColor: palette.graphite,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
})
