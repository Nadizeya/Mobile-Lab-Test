import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CheckinInput, ClassSession, FinishClassInput } from '../types/session';

const STORAGE_KEY = 'class_sessions_json_array';

function createSessionId(): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `session-${Date.now()}-${randomPart}`;
}

async function readSessions(): Promise<ClassSession[]> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as ClassSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSessions(sessions: ClassSession[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function sortLatestFirst(sessions: ClassSession[]): ClassSession[] {
  return [...sessions].sort((a, b) => b.checkin_timestamp.localeCompare(a.checkin_timestamp));
}

export async function createCheckinSession(input: CheckinInput): Promise<ClassSession> {
  const sessions = await readSessions();
  const generatedSessionId = createSessionId();

  const nextSession: ClassSession = {
    id: generatedSessionId,
    session_id: generatedSessionId,
    student_uid: input.student_uid,
    student_id: input.student_id,
    student_name: input.student_name,
    checkin_timestamp: new Date().toISOString(),
    checkin_gps_lat: input.checkin_gps_lat,
    checkin_gps_lng: input.checkin_gps_lng,
    qr_code_value: input.qr_code_value,
    previous_topic: input.previous_topic,
    expected_topic: input.expected_topic,
    mood_before: input.mood_before,
    status: 'checked_in',
  };

  const nextSessions = sortLatestFirst([nextSession, ...sessions]);
  await writeSessions(nextSessions);
  return nextSession;
}

export async function completeSession(input: FinishClassInput): Promise<ClassSession | null> {
  const sessions = await readSessions();
  const targetIndex = sessions.findIndex((session) => session.id === input.id);

  if (targetIndex < 0) {
    return null;
  }

  const nextSession: ClassSession = {
    ...sessions[targetIndex],
    checkout_timestamp: new Date().toISOString(),
    checkout_gps_lat: input.checkout_gps_lat,
    checkout_gps_lng: input.checkout_gps_lng,
    checkout_qr_code_value: input.checkout_qr_code_value,
    learned_today: input.learned_today,
    feedback: input.feedback,
    status: 'completed',
  };

  sessions[targetIndex] = nextSession;
  const sorted = sortLatestFirst(sessions);
  await writeSessions(sorted);
  return nextSession;
}

export async function getActiveSession(studentUid: string): Promise<ClassSession | null> {
  const sessions = await readSessions();
  const sorted = sortLatestFirst(sessions);
  return sorted.find((session) => session.student_uid === studentUid && session.status === 'checked_in') ?? null;
}

export async function getLatestSession(studentUid: string): Promise<ClassSession | null> {
  const sessions = await readSessions();
  const sorted = sortLatestFirst(sessions);
  return sorted.find((session) => session.student_uid === studentUid) ?? null;
}

export async function getSessions(): Promise<ClassSession[]> {
  const sessions = await readSessions();
  return sortLatestFirst(sessions).slice(0, 50);
}
