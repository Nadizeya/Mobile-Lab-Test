import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActiveSession, getLatestSession } from '@/lib/sessionStorage';
import { getUserProfile, type UserProfile } from '@/lib/userProfile';
import type { ClassSession } from '@/types/session';

export default function HomeScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    studentId: '',
    studentName: '',
    studentUid: 'student-unknown',
  });
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [latestSession, setLatestSession] = useState<ClassSession | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const savedProfile = await getUserProfile();
        setProfile(savedProfile);

        if (!savedProfile.studentId || !savedProfile.studentName) {
          router.replace('/profile');
          return;
        }

        const [active, latest] = await Promise.all([
          getActiveSession(savedProfile.studentUid),
          getLatestSession(savedProfile.studentUid),
        ]);
        setActiveSession(active);
        setLatestSession(latest);
      };

      void load();
    }, [router]),
  );

  const isFinishClassDisabled = !activeSession;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Class Check-in</Text>
          <Text style={styles.subtitle}>1305216 Mobile Application Development</Text>
          <Text style={styles.userLine}>{profile.studentName} ({profile.studentId})</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Workflow Status</Text>
          <Text style={styles.cardValue}>{activeSession ? 'Checked In - Finish Class available' : 'Not Checked In'}</Text>
          <View style={styles.spacer} />
          <Text style={styles.cardLabel}>Latest Recorded Data</Text>
          <Text style={styles.cardMuted}>session_id: {latestSession?.session_id ?? '-'}</Text>
          <Text style={styles.cardMuted}>checkin_timestamp: {latestSession?.checkin_timestamp ?? '-'}</Text>
          <Text style={styles.cardMuted}>qr_code_value: {latestSession?.qr_code_value ?? '-'}</Text>
          <Text style={styles.cardMuted}>mood_before: {latestSession?.mood_before ?? '-'}</Text>
          <Text style={styles.cardMuted}>checkout_timestamp: {latestSession?.checkout_timestamp ?? '-'}</Text>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/checkin')}>
            <Text style={styles.primaryButtonText}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.secondaryButton, isFinishClassDisabled && styles.disabledButton]}
            disabled={isFinishClassDisabled}
            onPress={() => {
              if (isFinishClassDisabled) {
                Alert.alert('No active session', 'Please check in first.');
                return;
              }
              router.push('/finish-class');
            }}
          >
            <Text style={[styles.secondaryButtonText, isFinishClassDisabled && styles.disabledButtonText]}>
              Finish Class
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/records')}>
            <Text style={styles.linkButtonText}>View Recorded Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/profile')}>
            <Text style={styles.linkButtonText}>Edit Student Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F2C',
  },
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  headerContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8A9BB8',
  },
  userLine: {
    marginTop: 8,
    fontSize: 13,
    color: '#8A9BB8',
  },
  card: {
    backgroundColor: '#141A3C',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1D2553',
    marginBottom: 'auto',
  },
  spacer: {
    height: 16,
  },
  cardLabel: {
    fontSize: 14,
    color: '#8A9BB8',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardMuted: {
    color: '#8A9BB8',
    marginTop: 3,
    fontSize: 13,
  },
  bottomContainer: {
    marginTop: 40,
  },
  primaryButton: {
    backgroundColor: '#2D6BE4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#2D6BE4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2D6BE4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    borderColor: '#3A4B6B',
    backgroundColor: '#121935',
  },
  disabledButtonText: {
    color: '#3A4B6B',
  },
  linkButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#8A9BB8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
