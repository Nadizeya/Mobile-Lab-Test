import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUserProfile, saveUserProfile } from '@/lib/userProfile';

export default function ProfileScreen() {
  const router = useRouter();

  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const profile = await getUserProfile();
        setStudentNameInput(profile.studentName);
        setStudentIdInput(profile.studentId);
      };

      void load();
    }, []),
  );

  const handleSaveProfile = async () => {
    if (!studentIdInput.trim() || !studentNameInput.trim()) {
      Alert.alert('Missing profile data', 'Please fill in both Student Name and Student ID.');
      return;
    }

    await saveUserProfile(studentIdInput, studentNameInput);
    Alert.alert('Profile saved', 'Student profile is ready.', [
      {
        text: 'Continue',
        onPress: () => router.replace('/home'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Student Profile</Text>
        <Text style={styles.subtitle}>Enter student details before using check-in workflow</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Student Name</Text>
          <TextInput
            value={studentNameInput}
            onChangeText={setStudentNameInput}
            style={styles.input}
            placeholder="Enter student name"
            placeholderTextColor="#8A9BB8"
          />

          <Text style={styles.cardLabel}>Student ID</Text>
          <TextInput
            value={studentIdInput}
            onChangeText={setStudentIdInput}
            style={styles.input}
            placeholder="Enter student ID"
            placeholderTextColor="#8A9BB8"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile}>
            <Text style={styles.primaryButtonText}>Save and Continue</Text>
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
    justifyContent: 'center',
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#141A3C',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1D2553',
  },
  cardLabel: {
    fontSize: 14,
    color: '#8A9BB8',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#101634',
    borderColor: '#2C3569',
    borderWidth: 1,
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#2D6BE4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
