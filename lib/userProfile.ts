import { getPersistentItem, setPersistentItem } from '@/lib/persistentStorage';

const PROFILE_KEY = 'class_user_profile';

export type UserProfile = {
  studentId: string;
  studentName: string;
  studentUid: string;
};

function toUid(studentId: string): string {
  const normalized = studentId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return normalized ? `student-${normalized}` : 'student-unknown';
}

export async function getUserProfile(): Promise<UserProfile> {
  const rawValue = await getPersistentItem(PROFILE_KEY);

  if (!rawValue) {
    return {
      studentId: '',
      studentName: '',
      studentUid: 'student-unknown',
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<UserProfile>;
    const studentId = parsed.studentId?.trim() ?? '';
    const studentName = parsed.studentName?.trim() ?? '';

    return {
      studentId,
      studentName,
      studentUid: toUid(studentId),
    };
  } catch {
    return {
      studentId: '',
      studentName: '',
      studentUid: 'student-unknown',
    };
  }
}

export async function saveUserProfile(studentId: string, studentName: string): Promise<UserProfile> {
  const cleanedId = studentId.trim();
  const cleanedName = studentName.trim();

  const profile: UserProfile = {
    studentId: cleanedId,
    studentName: cleanedName,
    studentUid: toUid(cleanedId),
  };

  await setPersistentItem(
    PROFILE_KEY,
    JSON.stringify({
      studentId: profile.studentId,
      studentName: profile.studentName,
    }),
  );

  return profile;
}
