import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { springs } from '@/animations/reanimated-presets';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const loginX = useSharedValue(30);
  const loginOpacity = useSharedValue(0);
  const headingY = useSharedValue(40);
  const headingOpacity = useSharedValue(0);
  const subtitleX = useSharedValue(-30);
  const subtitleOpacity = useSharedValue(0);
  const lineScaleY = useSharedValue(0);
  const buttonY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const arrowX = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animations
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, springs.smooth);
    loginX.value = withDelay(300, withSpring(0, springs.smooth));
    loginOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    headingY.value = withDelay(400, withSpring(0, springs.smooth));
    headingOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    subtitleX.value = withDelay(550, withSpring(0, springs.smooth));
    subtitleOpacity.value = withDelay(550, withTiming(1, { duration: 400 }));
    lineScaleY.value = withDelay(700, withSpring(1, springs.bouncy));
    buttonY.value = withDelay(650, withSpring(0, springs.smooth));
    buttonOpacity.value = withDelay(650, withTiming(1, { duration: 400 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const loginStyle = useAnimatedStyle(() => ({
    opacity: loginOpacity.value,
    transform: [{ translateX: loginX.value }],
  }));

  const headingStyle = useAnimatedStyle(() => ({
    opacity: headingOpacity.value,
    transform: [{ translateY: headingY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateX: subtitleX.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: lineScaleY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { translateY: buttonY.value },
      { scale: buttonScale.value },
    ],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, springs.bouncy);
    arrowX.value = withSpring(5, springs.bouncy);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, springs.bouncy);
    arrowX.value = withSpring(0, springs.bouncy);
  };

  const handleLoginPressIn = () => {
    buttonScale.value = withSpring(0.95, springs.bouncy);
  };

  const handleLoginPressOut = () => {
    buttonScale.value = withSpring(1, springs.bouncy);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../public/landing-hero.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Top gradient */}
        <LinearGradient
          colors={[
            'rgba(5,12,14,0.85)',
            'rgba(5,12,14,0.65)',
            'rgba(5,12,14,0.42)',
            'rgba(5,12,14,0.24)',
            'rgba(5,12,14,0.12)',
            'rgba(5,12,14,0.04)',
            'rgba(5,12,14,0.01)',
            'transparent',
          ]}
          locations={[0, 0.12, 0.28, 0.42, 0.58, 0.72, 0.88, 1]}
          style={styles.topGradient}
        />

        {/* Bottom gradient */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(5,12,14,0.01)',
            'rgba(5,12,14,0.06)',
            'rgba(5,12,14,0.16)',
            'rgba(5,12,14,0.32)',
            'rgba(5,12,14,0.52)',
            'rgba(5,12,14,0.72)',
            'rgba(5,12,14,0.88)',
            'rgba(5,12,14,0.96)',
          ]}
          locations={[0, 0.05, 0.14, 0.26, 0.40, 0.55, 0.70, 0.85, 1]}
          style={styles.bottomGradient}
        />

        <SafeAreaView style={styles.safeArea}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Animated.View style={logoStyle}>
              <Image
                source={require('../public/autopilot-logo-new.png')}
                style={styles.logo}
                resizeMode="contain"
                tintColor="#FFFFFF"
              />
            </Animated.View>
            
            <Animated.View style={loginStyle}>
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                onPressIn={handleLoginPressIn}
                onPressOut={handleLoginPressOut}
              >
                <Animated.View style={[styles.loginBtn, buttonScale]} >
                  <Text style={styles.loginBtnText}>LOG IN</Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          </View>

          {/* ── Bottom Content ── */}
          <View style={styles.bottomContent}>
            <Animated.Text style={[styles.heading, headingStyle]}>
              Where Autonomy Meets{'\n'}Operations.
            </Animated.Text>
            
            <Animated.View style={[styles.subtitleRow, subtitleStyle]}>
              <Animated.View style={[styles.verticalLine, lineStyle]} />
              <Text style={styles.subtitleText}>The building is the interface.</Text>
            </Animated.View>

            {/* Get Started Button */}
            <Animated.View style={[{ marginTop: 32 }, buttonStyle]}>
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
              >
                <View style={styles.getStartedBtn}>
                  <Text style={styles.getStartedText}>Get Started</Text>
                  <Animated.View style={arrowStyle}>
                    <Text style={styles.arrow}> →</Text>
                  </Animated.View>
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const STATUSBAR_HEIGHT =
  Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050C0E',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.35,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.50,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: STATUSBAR_HEIGHT,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logo: {
    height: 26,
    width: 130,
  },
  loginBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 7,
  },
  loginBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bottomContent: {
    paddingHorizontal: 26,
    paddingBottom: Platform.OS === 'ios' ? 56 : 44,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalLine: {
    width: 1.5,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginRight: 10,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '400',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#708F96',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
