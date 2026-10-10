import type { TypeVariant } from '@mycoach/brand'
import { greetingName } from '@mycoach/core/profile/contracts'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import type { ReactNode } from 'react'
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

export function Card({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const colors = useColors()
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
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
          <Txt variant="title" numberOfLines={1} style={{ flex: 1 }}>
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

export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  trailingIcon,
  style,
}: {
  children: ReactNode
  onPress: () => void
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  /** Shown after the label, e.g. an arrow on a call to action. */
  trailingIcon?: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const colors = useColors()
  const primary = variant === 'primary'
  const fg = primary ? colors.onAccent : colors.textPrimary
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? colors.accent : colors.surfaceMuted,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon}
      <Text
        style={[textStyles.label, font('ui', 700), { color: fg, fontSize: 16, lineHeight: 22 }]}
      >
        {children}
      </Text>
      {!loading && trailingIcon}
    </Pressable>
  )
}

export function Chip({
  icon,
  children,
  style,
}: {
  icon?: ReactNode
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const colors = useColors()
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceMuted }, style]}>
      {icon}
      {children}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 40 },
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
  chip: {
    height: 40,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
})

export function Input({
  label,
  hint,
  prefix,
  ...props
}: TextInputProps & { label: string; hint?: string; prefix?: string }) {
  const colors = useColors()
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label">{label}</Txt>
      <View
        style={[inputStyles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {prefix && <Txt muted>{prefix}</Txt>}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          {...props}
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
    <View style={[inputStyles.segmented, { backgroundColor: colors.surfaceMuted }]}>
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
              selected && { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Txt variant="label" style={{ fontWeight: selected ? '600' : '400' }} muted={!selected}>
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
    borderWidth: 1,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  input: { flex: 1, fontSize: 16, height: '100%', ...font('ui', 500) },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3, gap: 3 },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
})
