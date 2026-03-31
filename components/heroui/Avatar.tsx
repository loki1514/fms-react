// components/heroui/Avatar.tsx - HeroUI Avatar component
import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type AvatarRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  color?: AvatarColor;
  radius?: AvatarRadius;
  bordered?: boolean;
  disabled?: boolean;
  isGroup?: boolean;
  fallback?: React.ReactNode;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  badge?: {
    content?: string | number;
    color?: AvatarColor;
    placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 32,
};

const colorMap: Record<AvatarColor, string> = {
  default: Colors.textSecondary,
  primary: Colors.primary,
  secondary: Colors.secondary,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.error,
};

const radiusMap: Record<AvatarRadius, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 999,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({
  src,
  name,
  size = 'md',
  color = 'default',
  radius = 'full',
  bordered = false,
  disabled = false,
  isGroup = false,
  fallback,
  icon,
  onPress,
  style,
  badge,
}: AvatarProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const sizeValue = sizeMap[size];
  const colorValue = colorMap[color];

  const [hasError, setHasError] = React.useState(false);

  const containerStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: radiusMap[radius],
    backgroundColor: src && !hasError ? 'transparent' : `${colorValue}20`,
    borderWidth: bordered ? 2 : 0,
    borderColor: bordered ? (isDark ? '#1a1a1a' : '#fff') : 'transparent',
  };

  const renderContent = () => {
    if (src && !hasError) {
      return (
        <Image
          source={{ uri: src }}
          style={[
            styles.image,
            { borderRadius: radiusMap[radius] },
          ]}
          onError={() => setHasError(true)}
        />
      );
    }

    if (icon) {
      return <View style={styles.iconContainer}>{icon}</View>;
    }

    if (fallback) {
      return <View style={styles.fallbackContainer}>{fallback}</View>;
    }

    const initials = name ? getInitials(name) : '?';

    return (
      <Text
        style={[
          styles.initials,
          {
            color: colorValue,
            fontSize: fontSizeMap[size],
            fontWeight: '600',
          },
        ]}
      >
        {initials}
      </Text>
    );
  };

  const avatarElement = (
    <View
      style={[
        styles.container,
        containerStyle,
        disabled && styles.disabled,
        isGroup && styles.group,
        style,
      ]}
    >
      {renderContent()}
    </View>
  );

  const wrappedAvatar = onPress ? (
    <Pressable onPress={onPress} disabled={disabled}>
      {avatarElement}
    </Pressable>
  ) : (
    avatarElement
  );

  if (badge) {
    return (
      <Badge
        content={badge.content}
        color={badge.color || 'primary'}
        placement={badge.placement || 'bottom-right'}
        size={size === 'xs' || size === 'sm' ? 'sm' : 'md'}
      >
        {wrappedAvatar}
      </Badge>
    );
  }

  return wrappedAvatar;
}

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  total?: number;
  size?: AvatarSize;
  color?: AvatarColor;
  radius?: AvatarRadius;
  bordered?: boolean;
  style?: ViewStyle;
}

export function AvatarGroup({
  children,
  max = 3,
  total,
  size = 'md',
  color = 'primary',
  radius = 'full',
  bordered = true,
  style,
}: AvatarGroupProps) {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = total !== undefined ? total - max : childrenArray.length - max;
  const showRemaining = remainingCount > 0;

  const sizeValue = sizeMap[size];

  return (
    <View style={[styles.groupContainer, style]}>
      {visibleChildren.map((child, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            { marginLeft: index > 0 ? -sizeValue * 0.3 : 0 },
          ]}
        >
          {React.isValidElement(child)
            ? React.cloneElement(child, {
                size,
                color,
                radius,
                bordered,
                isGroup: true,
              } as any)
            : child}
        </View>
      ))}
      {showRemaining && (
        <View
          style={[
            styles.groupItem,
            { marginLeft: -sizeValue * 0.3 },
          ]}
        >
          <Avatar
            name={`+${remainingCount}`}
            size={size}
            color={color}
            radius={radius}
            bordered={bordered}
            isGroup
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    textAlign: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  group: {
    borderWidth: 2,
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {
    position: 'relative',
  },
});

export default Avatar;
