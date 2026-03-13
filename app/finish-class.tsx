import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

import { completeSession, getActiveSession } from '@/lib/sessionStorage';
import { getUserProfile, type UserProfile } from '@/lib/userProfile';
import type { ClassSession } from '@/types/session';

function isHttpLink(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export default function FinishClassScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    studentId: '',
    studentName: '',
    studentUid: 'student-unknown',
  });

  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [learnedToday, setLearnedToday] = useState('');
  const [feedback, setFeedback] = useState('');
  const [checkoutQr, setCheckoutQr] = useState('');
  const [manualQrValue, setManualQrValue] = useState('');
  const [checkoutLat, setCheckoutLat] = useState<number | null>(null);
  const [checkoutLng, setCheckoutLng] = useState<number | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadActive = async () => {
        const savedProfile = await getUserProfile();
        setProfile(savedProfile);

        if (!savedProfile.studentId || !savedProfile.studentName) {
          setActiveSession(null);
          return;
        }

        const session = await getActiveSession(savedProfile.studentUid);
        setActiveSession(session);
      };

      void loadActive();
    }, []),
  );

  useEffect(() => {
    const setup = async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status !== 'granted') {
        setCheckoutLat(0);
        setCheckoutLng(0);
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCheckoutLat(current.coords.latitude);
        setCheckoutLng(current.coords.longitude);
      } catch {
        setCheckoutLat(0);
        setCheckoutLng(0);
      }
    };

    void setup();
  }, [cameraPermission?.granted, requestCameraPermission]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (checkoutQr) {
      return;
    }
    setCheckoutQr(result.data);
    setShowScanner(false);
  };

  const handleSubmitFinish = async () => {
    if (!profile.studentId || !profile.studentName) {
      Alert.alert('Profile required', 'Please set Student Name and Student ID on Home screen first.');
      router.replace('/profile');
      return;
    }

    if (!activeSession) {
      Alert.alert('No active session', 'Please complete check-in before finishing class.');
      return;
    }

    if (!learnedToday.trim() || !feedback.trim()) {
      Alert.alert('Missing form data', 'Please complete learned today and feedback fields.');
      return;
    }

    const finalQrValue = checkoutQr.trim() || manualQrValue.trim();
    if (!finalQrValue) {
      Alert.alert('QR code required', 'Please scan the class QR code or enter it manually.');
      return;
    }

    const finalLat = checkoutLat ?? 0;
    const finalLng = checkoutLng ?? 0;

    setIsSubmitting(true);
    try {
      await completeSession({
        id: activeSession.id,
        checkout_gps_lat: finalLat,
        checkout_gps_lng: finalLng,
        checkout_qr_code_value: finalQrValue,
        learned_today: learnedToday.trim(),
        feedback: feedback.trim(),
      });

      if (Platform.OS === 'web') {
        router.replace('/records');
        return;
      }

      Alert.alert('Class finished', 'Check-out and post-class reflection were saved locally.', [
        {
          text: 'View Recorded Data',
          onPress: () => router.replace('/records'),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete class.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scannedOrManualValue = checkoutQr || manualQrValue;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Finish Class</Text>
        <Text style={styles.subtitle}>Scan QR again, capture GPS, and submit post-class reflection</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Active Session</Text>
          <Text style={styles.cardValue}>
            {activeSession ? `${activeSession.student_id} - ${activeSession.session_id}` : 'No active check-in session'}
          </Text>

          <Text style={styles.cardLabel}>GPS (auto captured)</Text>
          <Text style={styles.cardValue}>
            {checkoutLat !== null && checkoutLng !== null
              ? `${checkoutLat.toFixed(6)}, ${checkoutLng.toFixed(6)}`
              : 'Waiting for GPS...'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Scan Class QR</Text>
          {checkoutQr && !showScanner ? (
            <View>
              <Text style={styles.helperText}>Scanned Link</Text>
              <TouchableOpacity
                disabled={!isHttpLink(checkoutQr)}
                onPress={() => {
                  if (isHttpLink(checkoutQr)) {
                    void Linking.openURL(checkoutQr);
                  }
                }}
              >
                <Text style={styles.linkText}>{checkoutQr}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => {
                  setCheckoutQr('');
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

          {!checkoutQr && (
            <TextInput
              value={manualQrValue}
              onChangeText={setManualQrValue}
              style={styles.input}
              placeholder="Manual QR value (fallback)"
              placeholderTextColor="#8A9BB8"
            />
          )}

          {!!scannedOrManualValue && !checkoutQr && (
            <Text style={styles.helperText}>QR value: {scannedOrManualValue}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Post-Class Reflection</Text>
          <TextInput
            value={learnedToday}
            onChangeText={setLearnedToday}
            style={[styles.input, styles.multilineInput]}
            placeholder="What did you learn today?"
            placeholderTextColor="#8A9BB8"
            multiline
          />
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            style={[styles.input, styles.multilineInput]}
            placeholder="Feedback about class/instructor"
            placeholderTextColor="#8A9BB8"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !activeSession && styles.disabledButton]}
          disabled={isSubmitting || !activeSession}
          onPress={handleSubmitFinish}
        >
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving...' : 'Submit Finish Class'}</Text>
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
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
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
  disabledButton: {
    backgroundColor: '#3A4B6B',
  },
});
