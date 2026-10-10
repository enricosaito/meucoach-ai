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
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { avatarUrl } from '../lib/avatar'
import { useMe } from '../lib/me'
import { radius, space, useColors, type Colors } from '../theme'

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

const TEXT_VARIANTS = {
  display: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 14, fontWeight: '500' },
  caption: { fontSize: 13, fontWeight: '400' },
} satisfies Record<string, TextStyle>

export function Txt({
  variant = 'body',
  color,
  muted,
  style,
  children,
  numberOfLines,
}: {
  variant?: keyof typeof TEXT_VARIANTS
  color?: keyof Colors
  muted?: boolean
  style?: StyleProp<TextStyle>
  children: ReactNode
  numberOfLines?: number
}) {
  const colors = useColors()
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[TEXT_VARIANTS[variant], { color: colors[color ?? (muted ? 'muted' : 'fg')] }, style]}
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
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }, style]}
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
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingTop: padding.top,
        paddingHorizontal: space.lg,
        paddingBottom: padding.bottom,
        gap: space.xl,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} />
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
  return (
    <Link href="/profile" asChild>
      <Pressable accessibilityRole="link" accessibilityLabel="Perfil" hitSlop={8}>
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
        <Text style={{ color: colors.accentStrong, fontWeight: '600', fontSize: size * 0.36 }}>
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
  style,
}: {
  children: ReactNode
  onPress: () => void
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const colors = useColors()
  const primary = variant === 'primary'
  const fg = primary ? colors.accentFg : colors.fg
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? colors.accent : colors.surface2,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon}
      <Text style={{ color: fg, fontSize: 15, fontWeight: '600' }}>{children}</Text>
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
    <View style={[styles.chip, { backgroundColor: colors.surface2 }, style]}>
      {icon}
      {children}
    </View>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <Txt variant="label" color="danger">
      {children}
    </Txt>
  )
}

export function Skeleton({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  const colors = useColors()
  return (
    <View style={[{ height, borderRadius: radius.lg, backgroundColor: colors.surface2 }, style]} />
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
