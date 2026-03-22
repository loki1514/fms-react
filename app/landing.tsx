import React from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../public/landing-hero.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/*
         * TOP gradient — cinematic dark vignette from the top edge.
         * Covers ~35% of screen height for a smooth, premium look.
         * Uses 8 color stops with eased opacity for buttery transitions.
         */}
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

        {/*
         * BOTTOM gradient — deep scrim rising from the base.
         * Covers ~50% of screen height for maximum text readability.
         * Heavier opacity at base blends seamlessly into container bg.
         */}
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
            <Image
              source={require('../public/autopilot-logo-new.png')}
              style={styles.logo}
              resizeMode="contain"
              tintColor="#FFFFFF"
            />
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>LOG IN</Text>
            </TouchableOpacity>
          </View>

          {/* ── Bottom Content ── */}
          <View style={styles.bottomContent}>
            <Text style={styles.heading}>
              Where Autonomy Meets{'\n'}Operations.
            </Text>
            <View style={styles.subtitleRow}>
              <View style={styles.verticalLine} />
              <Text style={styles.subtitleText}>The building is the interface.</Text>
            </View>
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
});
