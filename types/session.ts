export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type ClassSession = {
  id: string;
  session_id: string;
  student_uid: string;
  student_id: string;
  student_name: string;
  checkin_timestamp: string;
  checkin_gps_lat: number;
  checkin_gps_lng: number;
  qr_code_value: string;
  previous_topic: string;
  expected_topic: string;
  mood_before: MoodScore;
  status: 'checked_in' | 'completed';
  checkout_timestamp?: string;
  checkout_gps_lat?: number;
  checkout_gps_lng?: number;
  checkout_qr_code_value?: string;
  learned_today?: string;
  feedback?: string;
};

export type CheckinInput = {
  student_uid: string;
  student_id: string;
  student_name: string;
  checkin_gps_lat: number;
  checkin_gps_lng: number;
  qr_code_value: string;
  previous_topic: string;
  expected_topic: string;
  mood_before: MoodScore;
};

export type FinishClassInput = {
  id: string;
  checkout_gps_lat: number;
  checkout_gps_lng: number;
  checkout_qr_code_value: string;
  learned_today: string;
  feedback: string;
};
