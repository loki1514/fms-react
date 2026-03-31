// components/heroui/Input.tsx - HeroUI Input component
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { springs } from '@/animations/reanimated-presets';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  disabled?: boolean;
  error?: string;
  helperText?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'flat' | 'bordered' | 'underlined';
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  disabled = false,
  error,
  helperText,
  startContent,
  endContent,
  multiline = false,
  numberOfLines = 1,
  style,
  size = 'md',
  variant = 'bordered',
}: InputProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const borderColor = useSharedValue(colors.border);
  const scale = useSharedValue(1);

  const height = multiline ? Math.max(100, numberOfLines * 24) : size === 'sm' ? 40 : size === 'lg' ? 56 : 48;

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    transform: [{ scale: scale.value }],
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(Colors.primary, { duration: 200 });
    scale.value = withSpring(1.01, springs.quick);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(error ? Colors.error : colors.border, { duration: 200 });
    scale.value = withSpring(1, springs.quick);
  };

  const getContainerStyle = () => {
    const baseStyle: any = {
      backgroundColor: isDark ? 'rgba(20, 26, 34, 0.5)' : colors.surfaceElevated,
      borderRadius: variant === 'underlined' ? 0 : Radius.md,
      height,
      minHeight: height,
    };

    if (variant === 'bordered') {
      baseStyle.borderWidth = 1.5;
      baseStyle.borderColor = error ? Colors.error : isFocused ? Colors.primary : colors.border;
    } else if (variant === 'underlined') {
      baseStyle.borderBottomWidth = 2;
      baseStyle.borderBottomColor = error ? Colors.error : isFocused ? Colors.primary : colors.border;
    }

    return baseStyle;
  };

  const sizePadding = {
    sm: { paddingHorizontal: 12, paddingVertical: 8 },
    md: { paddingHorizontal: 16, paddingVertical: 12 },
    lg: { paddingHorizontal: 20, paddingVertical: 16 },
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: error ? Colors.error : colors.textSecondary }]}>
          {label}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          getContainerStyle(),
          sizePadding[size],
          animatedContainerStyle,
          disabled && styles.disabled,
        ]}
      >
        {startContent && <View style={styles.startContent}>{startContent}</View>}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
              minHeight: multiline ? height - 24 : height - 24,
            },
            multiline && styles.textArea,
          ]}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {secureTextEntry && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </Pressable>
        )}

        {endContent && !secureTextEntry && <View style={styles.endContent}>{endContent}</View>}
      </Animated.View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? Colors.error : colors.textTertiary },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.labelMedium,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: 0,
    fontWeight: '500',
  },
  textArea: {
    paddingTop: 4,
  },
  startContent: {
    marginRight: 12,
  },
  endContent: {
    marginLeft: 12,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  helperText: {
    ...Typography.labelSmall,
    marginTop: 4,
    marginLeft: 4,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Input;
