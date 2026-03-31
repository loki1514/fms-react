// components/heroui/Modal.tsx - HeroUI Modal component
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal as RNModal,
  ModalProps as RNModalProps,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { springs } from '@/animations/reanimated-presets';
import { Button } from './Button';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  placement?: 'center' | 'top' | 'bottom';
  hideCloseButton?: boolean;
  backdrop?: 'opaque' | 'blur' | 'transparent';
  scrollBehavior?: 'normal' | 'inside' | 'outside';
  motionProps?: {
    initial?: any;
    animate?: any;
    exit?: any;
  };
}

const sizeMap: Record<string, string | number> = {
  xs: '90%',
  sm: '90%',
  md: '90%',
  lg: '90%',
  xl: '95%',
  full: '100%',
};

const maxWidthMap: Record<string, number> = {
  xs: 320,
  sm: 400,
  md: 500,
  lg: 600,
  xl: 800,
  full: SCREEN_HEIGHT,
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  placement = 'center',
  hideCloseButton = false,
  backdrop = 'opaque',
  scrollBehavior = 'normal',
  motionProps,
}: ModalProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (isOpen) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, springs.smooth);
      translateY.value = withSpring(0, springs.smooth);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.95, { duration: 150 });
      translateY.value = withTiming(50, { duration: 150 });
    }
  }, [isOpen]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const getBackdropColor = () => {
    switch (backdrop) {
      case 'opaque':
        return 'rgba(0, 0, 0, 0.5)';
      case 'blur':
        return 'rgba(0, 0, 0, 0.3)';
      case 'transparent':
        return 'transparent';
      default:
        return 'rgba(0, 0, 0, 0.5)';
    }
  };

  const getPlacementStyle = (): ViewStyle => {
    switch (placement) {
      case 'top':
        return { justifyContent: 'flex-start', paddingTop: 50 };
      case 'bottom':
        return { justifyContent: 'flex-end', paddingBottom: 50 };
      case 'center':
      default:
        return { justifyContent: 'center' };
    }
  };

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: getBackdropColor() },
          backdropAnimatedStyle,
          getPlacementStyle(),
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              borderRadius: size === 'full' ? 0 : Radius['2xl'],
              maxWidth: maxWidthMap[size],
              width: sizeMap[size] as any,
            },
            isDark ? Shadows.lg : Shadows.glass,
            contentAnimatedStyle,
          ]}
        >
          {title && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {title}
              </Text>
              {!hideCloseButton && (
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          )}
          
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

interface ModalHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ModalHeader({ children, style }: ModalHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.title, { color: colors.textPrimary }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

interface ModalBodyProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ModalBody({ children, style }: ModalBodyProps) {
  return <View style={[styles.body, style]}>{children}</View>;
}

interface ModalFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ModalFooter({ children, style }: ModalFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

interface ModalContentProps {
  children: React.ReactNode;
}

export function ModalContent({ children }: ModalContentProps) {
  return <>{children}</>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    overflow: 'hidden',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  title: {
    ...Typography.headlineMedium,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
});

export default Modal;
