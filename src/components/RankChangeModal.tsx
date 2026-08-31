import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { RankTierInfo } from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { Haptics } from '../utils/haptics';

interface RankChangeModalProps {
  visible: boolean;
  fromRank: RankTierInfo | null;
  toRank: RankTierInfo | null;
  eloDelta: number;
  onDismiss: () => void;
}

// Particle component for floating dots in the animation
const Particle: React.FC<{
  color: string;
  delay: number;
  startX: number;
  size: number;
}> = ({ color, delay, startX, size }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: -120 - Math.random() * 80,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true
      })
    ]);

    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: startX,
          opacity,
          transform: [{ translateY }, { scale }]
        }
      ]}
    />
  );
};

export const RankChangeModal: React.FC<RankChangeModalProps> = ({
  visible,
  fromRank,
  toRank,
  eloDelta,
  onDismiss
}) => {
  const { theme } = useAppTheme();

  const isRankUp = eloDelta >= 0;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.4)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-300)).current;
  const arrowY = useRef(new Animated.Value(20)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const eloCountAnim = useRef(new Animated.Value(0)).current;

  const accentColor = toRank?.color || (isRankUp ? '#22C55E' : '#EF4444');

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.4);
      cardOpacity.setValue(0);
      iconScale.setValue(0);
      iconRotate.setValue(0);
      shimmerX.setValue(-300);
      arrowY.setValue(20);
      arrowOpacity.setValue(0);
      eloCountAnim.setValue(0);
      return;
    }

    // Trigger haptics
    setTimeout(() => {
      if (isRankUp) {
        Haptics.notification('success');
      } else {
        Haptics.notification('error');
      }
    }, 200);

    // Enter animations
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      })
    ]).start(() => {
      // Icon bounce in
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true
        }),
        Animated.timing(iconRotate, {
          toValue: isRankUp ? 1 : -1,
          duration: 600,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true
        })
      ]).start();

      // Arrow fade in
      Animated.parallel([
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true
        }),
        Animated.spring(arrowY, {
          toValue: 0,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
          delay: 200
        } as any)
      ]).start();

      // ELO counter shimmer sweep
      Animated.loop(
        Animated.timing(shimmerX, {
          toValue: 300,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ).start();
    });
  }, [visible]);

  if (!fromRank || !toRank) return null;

  const iconRotateDeg = iconRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg']
  });

  // Generate particles
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    color: [accentColor, '#FFFFFF', toRank.color, '#FCD34D'][i % 4],
    delay: i * 60,
    startX: 40 + (i % 9) * 28,
    size: 4 + (i % 4) * 3
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
            backgroundColor: isRankUp
              ? 'rgba(0,0,0,0.88)'
              : 'rgba(20,0,0,0.90)'
          }
        ]}
      >
        {/* Floating particles */}
        {visible && (
          <View style={styles.particlesContainer} pointerEvents="none">
            {particles.map((p) => (
              <Particle
                key={p.id}
                color={p.color}
                delay={p.delay}
                startX={p.startX}
                size={p.size}
              />
            ))}
          </View>
        )}

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: accentColor,
              shadowColor: accentColor,
              transform: [{ scale: cardScale }],
              opacity: cardOpacity
            }
          ]}
        >
          {/* Shimmer line across card */}
          <Animated.View
            style={[
              styles.shimmerBar,
              {
                backgroundColor: accentColor,
                transform: [{ translateX: shimmerX }]
              }
            ]}
          />

          {/* Header: RANK UP / RANK DOWN */}
          <View style={[styles.headerBadge, { backgroundColor: isRankUp ? '#16A34A' : '#DC2626' }]}>
            <Text style={styles.headerBadgeText}>
              {isRankUp ? '⬆ RANK UP' : '⬇ RANK DOWN'}
            </Text>
          </View>

          {/* Main tier icon — animated bounce */}
          <Animated.View
            style={[
              styles.tierIconWrap,
              {
                borderColor: accentColor,
                shadowColor: accentColor,
                transform: [{ scale: iconScale }, { rotate: iconRotateDeg }]
              }
            ]}
          >
            <Text style={styles.tierIcon}>{toRank.icon}</Text>
          </Animated.View>

          {/* Rank name */}
          <Text style={[styles.rankName, { color: accentColor }]}>
            {toRank.name}
          </Text>

          {/* Rank transition FROM → TO */}
          <Animated.View
            style={[
              styles.transitionRow,
              {
                opacity: arrowOpacity,
                transform: [{ translateY: arrowY }]
              }
            ]}
          >
            <View style={[styles.fromPill, { borderColor: fromRank.color, backgroundColor: theme.colors.surfaceSubtle }]}>
              <Text style={{ fontSize: 16 }}>{fromRank.icon}</Text>
              <Text style={[styles.fromPillText, { color: fromRank.color }]}>{fromRank.name}</Text>
            </View>

            <Text style={[styles.transitionArrow, { color: isRankUp ? '#22C55E' : '#EF4444' }]}>
              {isRankUp ? '→' : '→'}
            </Text>

            <View style={[styles.toPill, { borderColor: accentColor, backgroundColor: isRankUp ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)' }]}>
              <Text style={{ fontSize: 16 }}>{toRank.icon}</Text>
              <Text style={[styles.toPillText, { color: accentColor }]}>{toRank.name}</Text>
            </View>
          </Animated.View>

          {/* ELO Delta display */}
          <Animated.View style={[styles.eloDeltaRow, { opacity: arrowOpacity }]}>
            <Text
              style={[
                styles.eloDeltaText,
                { color: isRankUp ? '#22C55E' : '#EF4444' }
              ]}
            >
              {eloDelta >= 0 ? '+' : ''}{eloDelta} MMR
            </Text>
          </Animated.View>

          {/* Motivational message */}
          <Text style={[styles.motivationText, { color: theme.colors.textSecondary }]}>
            {isRankUp
              ? `Outstanding performance! You've climbed to ${toRank.name}. Keep pushing your limits.`
              : `Tough session. You've dropped to ${toRank.name}. Consistency will bring you back.`}
          </Text>

          {/* Dismiss button */}
          <TouchableOpacity
            style={[styles.dismissBtn, { backgroundColor: accentColor }]}
            onPress={() => {
              Haptics.impact('medium');
              onDismiss();
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.dismissBtnText}>
              {isRankUp ? 'Claim Your Rank! 🏆' : 'Accept & Train Harder'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-start',
    justifyContent: 'flex-end'
  },
  particle: {
    position: 'absolute',
    bottom: '42%'
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 2,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 2,
    opacity: 0.7
  },
  headerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 9999,
    marginBottom: 20
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5
  },
  tierIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12
  },
  tierIcon: {
    fontSize: 52
  },
  rankName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 16
  },
  transitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  fromPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5
  },
  fromPillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  transitionArrow: {
    fontSize: 22,
    fontWeight: '900'
  },
  toPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2
  },
  toPillText: {
    fontSize: 13,
    fontWeight: '800'
  },
  eloDeltaRow: {
    marginBottom: 14
  },
  eloDeltaText: {
    fontSize: 22,
    fontWeight: '900'
  },
  motivationText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
    paddingHorizontal: 6
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  }
});
