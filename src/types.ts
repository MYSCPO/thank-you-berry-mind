export type MoodType = 'A형' | 'B형' | 'C형' | 'D형';

export interface Student {
  grade: string;
  classroom: string;
  number: string;
  name: string;
}

export interface DiaryEntry {
  id: string;
  timestamp: string; // ISO string
  dateStr: string;   // 'YYYY-MM-DD'
  grade: string;
  classroom: string;
  number: string;
  studentName: string;
  moodType: MoodType;
  emotionWord: string;
  gratitude1: string;
  gratitude2: string;
  gratitude3: string;
  message: string;
}

export interface Quote {
  author: string;
  quote: string;
  source?: string;
}

export interface Meditation {
  emoji: string;
  title: string;
  desc: string;
  duration: string;
  url: string;
}

export interface WordFrequency {
  word: string;
  count: number;
}

export type QuadrantId = 'A' | 'B' | 'C' | 'D';

export interface QuadrantConfig {
  id: QuadrantId;
  type: MoodType;
  name: string;
  concept: string; // 해, 새싹, 구름, 빗방울
  icon: string;
  energyMood: string; // e.g., '에너지↑ 기분↑'
  bgGradient: string;
  cardBg: string;
  borderColor: string;
  accentColor: string;
  activeBorder: string;
  label: string;
  description: string;
  interpret: string;
  emotions: string[];
}
