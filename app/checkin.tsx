import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';

import { createCheckinSession } from '@/lib/sessionStorage';
import { getUserProfile, type UserProfile } from '@/lib/userProfile';
import type { MoodScore } from '@/types/session';

const moodOptions: Array<{ score: MoodScore; emoji: string; label: string }> = [
  { score: 1, emoji: '😡', label: 'Very Negative' },
  { score: 2, emoji: '🙁', label: 'Negative' },
  { score: 3, emoji: '😐', label: 'Neutral' },
  { score: 4, emoji: '🙂', label: 'Positive' },
  { score: 5, emoji: '😄', label: 'Very Positive' },
];

function isHttpLink(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export default function CheckinScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    studentId: '',
    studentName: '',
    studentUid: 'student-unknown',
  });

  const [previousTopic, setPreviousTopic] = useState('');
  const [expectedTopic, setExpectedTopic] = useState('');
  const [moodBefore, setMoodBefore] = useState<MoodScore>(3);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [manualQrValue, setManualQrValue] = useState('');
  const [checkinLat, setCheckinLat] = useState<number | null>(null);
  const [checkinLng, setCheckinLng] = useState<number | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(true);

  useEffect(() => {
    const setup = async () => {
      const savedProfile = await getUserProfile();
      setProfile(savedProfile);

      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status !== 'granted') {
        setCheckinLat(0);
        setCheckinLng(0);
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCheckinLat(current.coords.latitude);
        setCheckinLng(current.coords.longitude);
      } catch {
        setCheckinLat(0);
        setCheckinLng(0);
      }
    };

    void setup();
  }, [cameraPermission?.granted, requestCameraPermission]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (qrCodeValue) {
      return;
    }
    setQrCodeValue(result.data);
    setShowScanner(false);
  };

  const handleSubmitCheckin = async () => {
    if (!profile.studentId || !profile.studentName) {
      Alert.alert('Profile required', 'Please set Student Name and Student ID on Home screen first.');
      router.replace('/profile');
      return;
    }

    if (!previousTopic.trim() || !expectedTopic.trim()) {
      Alert.alert('Missing form data', 'Please complete the pre-class reflection fields.');
      return;
    }

    const finalQrValue = qrCodeValue.trim() || manualQrValue.trim();
    if (!finalQrValue) {
      Alert.alert('QR code required', 'Please scan a class QR code or enter it manually before submitting.');
      return;
    }

    const finalLat = checkinLat ?? 0;
    const finalLng = checkinLng ?? 0;

    setIsSubmitting(true);
    try {
      await createCheckinSession({
        student_uid: profile.studentUid,
        student_id: profile.studentId,
        student_name: profile.studentName,
        checkin_gps_lat: finalLat,
        checkin_gps_lng: finalLng,
        qr_code_value: finalQrValue,
        previous_topic: previousTopic.trim(),
        expected_topic: expectedTopic.trim(),
        mood_before: moodBefore,
      });

      if (Platform.OS === 'web') {
        router.replace('/home');
        return;
      }

      Alert.alert('Check-in complete', 'Your check-in data has been saved locally.', [
        {
          text: 'OK',
          onPress: () => router.replace('/home'),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save check-in data.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scannedOrManualValue = qrCodeValue || manualQrValue;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Check-in</Text>
        <Text style={styles.subtitle}>Record GPS, scan QR, and submit pre-class reflection</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Student</Text>
          <Text style={styles.cardValue}>
            {profile.studentId && profile.studentName
              ? `${profile.studentId} - ${profile.studentName}`
              : 'Profile not set'}
          </Text>

          <Text style={styles.cardLabel}>GPS (auto captured)</Text>
          <Text style={styles.cardValue}>
            {checkinLat !== null && checkinLng !== null
              ? `${checkinLat.toFixed(6)}, ${checkinLng.toFixed(6)}`
              : 'Waiting for GPS...'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Scan Class QR</Text>
          {qrCodeValue && !showScanner ? (
            <View>
              <Text style={styles.helperText}>Scanned Link</Text>
              <TouchableOpacity
                disabled={!isHttpLink(qrCodeValue)}
                onPress={() => {
                  if (isHttpLink(qrCodeValue)) {
                    void Linking.openURL(qrCodeValue);
                  }
                }}
              >
                <Text style={styles.linkText}>{qrCodeValue}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => {
                  setQrCodeValue('');
                  setShowScanner(true);
                }}
              >
                <Text style={styles.scanAgainButtonText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          ) : cameraPermission?.granted === false ? (
            <Text style={styles.helperText}>Camera permission denied. Use manual QR field below.</Text>
          ) : (
            <CameraView
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              style={styles.scanner}
            />
          )}

          {!qrCodeValue && (
            <TextInput
              value={manualQrValue}
              onChangeText={setManualQrValue}
              style={styles.input}
              placeholder="Manual QR value (fallback)"
              placeholderTextColor="#8A9BB8"
            />
          )}

          {!!scannedOrManualValue && !qrCodeValue && (
            <Text style={styles.helperText}>QR value: {scannedOrManualValue}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pre-Class Reflection</Text>
          <TextInput
            value={previousTopic}
            onChangeText={setPreviousTopic}
            style={styles.input}
            placeholder="Previous class topic"
            placeholderTextColor="#8A9BB8"
          />
          <TextInput
            value={expectedTopic}
            onChangeText={setExpectedTopic}
            style={styles.input}
            placeholder="Expected topic today"
            placeholderTextColor="#8A9BB8"
          />

          <Text style={styles.cardLabel}>Mood before class</Text>
          <View style={styles.moodRow}>
            {moodOptions.map((option) => (
              <TouchableOpacity
                key={option.score}
                onPress={() => setMoodBefore(option.score)}
                style={[styles.moodButton, moodBefore === option.score && styles.moodButtonActive]}
              >
                <Text style={styles.emojiText}>{option.emoji}</Text>
                <Text style={[styles.moodText, moodBefore === option.score && styles.moodTextActive]}>
                  {option.score}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>Selected: {moodOptions.find((m) => m.score === moodBefore)?.label}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} disabled={isSubmitting} onPress={handleSubmitCheckin}>
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving...' : 'Submit Check-in'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F2C',
  },
  container: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A9BB8',
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#141A3C',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1D2553',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardLabel: {
    color: '#8A9BB8',
    fontSize: 13,
    marginTop: 4,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 4,
  },
  scanner: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
  },
  helperText: {
    marginTop: 10,
    color: '#8A9BB8',
    fontSize: 12,
  },
  linkText: {
    marginTop: 6,
    color: '#7FB3FF',
    textDecorationLine: 'underline',
  },
  scanAgainButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2C3569',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  scanAgainButtonText: {
    color: '#8A9BB8',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#101634',
    borderColor: '#2C3569',
    borderWidth: 1,
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  moodButton: {
    borderWidth: 1,
    borderColor: '#2C3569',
    backgroundColor: '#101634',
    width: 52,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonActive: {
    borderColor: '#2D6BE4',
    backgroundColor: '#2D6BE4',
  },
  emojiText: {
    fontSize: 18,
  },
  moodText: {
    color: '#8A9BB8',
    fontWeight: '700',
    marginTop: 4,
  },
  moodTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    marginTop: 2,
    backgroundColor: '#2D6BE4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
