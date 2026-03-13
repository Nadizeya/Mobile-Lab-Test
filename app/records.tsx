import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSessions } from '@/lib/sessionStorage';
import type { ClassSession } from '@/types/session';

function formatTimestamp(value?: string): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );
}

export default function RecordsScreen() {
  const router = useRouter();

  const [sessions, setSessions] = useState<ClassSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const allSessions = await getSessions();
          setSessions(allSessions);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load records.';
          Alert.alert('Load failed', message);
        }
      };

      void load();
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Recorded Data</Text>
        <Text style={styles.subtitle}>All student records from local JSON data array</Text>

        {sessions.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No records yet. Complete the workflow to see saved fields.</Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.card}>
              <Text style={styles.sessionTitle}>{session.session_id}</Text>

              <Row label="student_uid" value={session.student_uid} />
              <Row label="student_id" value={session.student_id} />
              <Row label="student_name" value={session.student_name} />
              <Row label="status" value={session.status} />
              <Row label="checkin_timestamp" value={formatTimestamp(session.checkin_timestamp)} />
              <Row
                label="checkin_gps_lat/lng"
                value={`${session.checkin_gps_lat.toFixed(6)}, ${session.checkin_gps_lng.toFixed(6)}`}
              />
              <Row label="qr_code_value" value={session.qr_code_value} />
              <Row label="previous_topic" value={session.previous_topic} />
              <Row label="expected_topic" value={session.expected_topic} />
              <Row label="mood_before" value={String(session.mood_before)} />

              <View style={styles.divider} />

              <Row label="checkout_timestamp" value={formatTimestamp(session.checkout_timestamp)} />
              <Row
                label="checkout_gps_lat/lng"
                value={
                  session.checkout_gps_lat !== undefined && session.checkout_gps_lng !== undefined
                    ? `${session.checkout_gps_lat.toFixed(6)}, ${session.checkout_gps_lng.toFixed(6)}`
                    : '-'
                }
              />
              <Row label="checkout_qr_code_value" value={session.checkout_qr_code_value ?? '-'} />
              <Row label="learned_today" value={session.learned_today ?? '-'} />
              <Row label="feedback" value={session.feedback ?? '-'} />
            </View>
          ))
        )}

        <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/home')}>
          <Text style={styles.linkButtonText}>Back to Home</Text>
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
  sessionTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    marginBottom: 8,
  },
  label: {
    color: '#8A9BB8',
    fontSize: 12,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#28305E',
    marginVertical: 10,
  },
  emptyText: {
    color: '#8A9BB8',
    fontSize: 14,
  },
  linkButton: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#8A9BB8',
    textDecorationLine: 'underline',
  },
});
