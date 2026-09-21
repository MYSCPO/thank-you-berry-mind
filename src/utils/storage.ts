import { Student, DiaryEntry, WordFrequency, MoodType } from '../types';
import { INITIAL_STUDENTS, INITIAL_DIARIES, STOPWORDS } from '../data/mockData';
import { extractContextualKeywords } from './gratitudeExtractor';

const STORAGE_KEYS = {
  STUDENTS: 'tybm_students_v1',
  DIARIES: 'tybm_diaries_v1',
  ADMIN_PW: 'tybm_admin_pw_v1',
  CURRENT_USER: 'tybm_current_student_v1'
};

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_STUDENTS;
  }
}

export function saveStoredStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students to localStorage', e);
  }
}

// Helper to clean numeric values (e.g. "2학년" -> "2", "03" -> "3")
export function cleanDigits(val?: string | number | null): string {
  if (val == null) return '';
  const str = String(val).replace(/[^0-9]/g, '');
  return str ? String(parseInt(str, 10)) : '';
}

// Clean legacy mock entries that might be lingering in student or teacher localStorage
export function cleanLegacyMockEntries(entries: DiaryEntry[]): DiaryEntry[] {
  return entries.filter(e => {
    if (!e) return false;
    // Hardcoded mock diary lines from earlier prototypes
    if (e.gratitude1 === '다치지 않고 건강하게 뛰어놀 수 있어서 감사.') return false;
    if (e.gratitude2 === '새로 사귄 짝꿍과 취미가 같아서 대화가 잘 통했다.') return false;
    if (e.gratitude3 === '아침 일찍 일어나 지각하지 않고 일찍 도착했다.') return false;
    if (e.id && String(e.id).startsWith('mock-')) return false;
    return true;
  });
}

export function getStoredDiaries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DIARIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(INITIAL_DIARIES));
      return INITIAL_DIARIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_DIARIES;
    const cleaned = cleanLegacyMockEntries(parsed);
    // If cleaned filtered out old mock data, update storage
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return INITIAL_DIARIES;
  }
}

export function saveStoredDiaries(diaries: DiaryEntry[]): void {
  try {
    const cleaned = cleanLegacyMockEntries(diaries);
    localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Failed to save diaries to localStorage', e);
  }
}

export function clearAllDiaries(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear diaries in localStorage', e);
  }
}

export function saveDiary(entry: DiaryEntry): DiaryEntry[] {
  const current = getStoredDiaries();
  // Filter out duplicate for exact date & student if re-editing on same day
  const updated = [
    entry,
    ...current.filter(d => !(
      d.grade === entry.grade &&
      d.classroom === entry.classroom &&
      d.number === entry.number &&
      d.dateStr === entry.dateStr
    ))
  ];
  try {
    localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  return updated;
}

export function getAdminPassword(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PW) || 'admin1234';
  } catch (e) {
    return 'admin1234';
  }
}

export function setAdminPassword(newPassword: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PW, newPassword.trim());
  } catch (e) {
    console.error('Failed to update admin password', e);
  }
}

export function isDefaultAdminPassword(): boolean {
  return getAdminPassword() === 'admin1234';
}

// Clean date formatting without ugly ISO or timezone strings
export function formatShortDate(dateVal?: string | Date | null): string {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  
  // If already 'YYYY-MM-DD'
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // If string contains English date format or complex timestamp
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch (e) {
    // fallback
  }

  return str.slice(0, 10);
}

// Korean friendly format e.g. "9월 17일 (목)"
export function formatKoreanDate(dateVal?: string | Date | null): string {
  const clean = formatShortDate(dateVal);
  if (!clean) return '';
  try {
    const [y, m, d] = clean.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dowList = ['일', '월', '화', '수', '목', '금', '토'];
    const dow = dowList[dateObj.getDay()];
    return `${m}월 ${d}일 (${dow})`;
  } catch (e) {
    return clean;
  }
}

// Today formatted as YYYY-MM-DD
export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseClassFilter(classFilter?: string): { grade: string; classroom: string } | null {
  if (!classFilter || classFilter === '전체' || classFilter === '전체 학급') return null;
  // Support "1학년 2반", "1-2", "1학년2반", "1학년 2반 (30명)" etc.
  const match = classFilter.match(/(\d+)\s*학년\s*(\d+)\s*반/);
  if (!match) return null;
  return { grade: cleanDigits(match[1]), classroom: cleanDigits(match[2]) };
}

export function getPeriodCutoff(period: string): Date | null {
  const now = new Date();
  if (period === '오늘') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === '이번주') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const d = new Date(now.getFullYear(), now.getMonth(), diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === '이번달') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === '3개월') {
    return new Date(now.getFullYear(), now.getMonth() - 3, 1);
  }
  return null; // 전체
}

// Filter diary entries based on class & period
export function filterDiaries(
  diaries: DiaryEntry[],
  classFilter: string,
  period: string
): DiaryEntry[] {
  const cFilter = parseClassFilter(classFilter);
  const cutoff = getPeriodCutoff(period);

  return diaries.filter(d => {
    if (cFilter) {
      const dGrade = cleanDigits(d.grade);
      const dClass = cleanDigits(d.classroom);
      if (dGrade !== cFilter.grade || dClass !== cFilter.classroom) return false;
    }
    if (cutoff) {
      const rowDate = new Date(d.dateStr || d.timestamp);
      if (isNaN(rowDate.getTime()) || rowDate < cutoff) return false;
    }
    return true;
  });
}

// Word frequency for emotions
export function computeEmotionWordCloud(
  diaries: DiaryEntry[],
  classFilter: string,
  period: string
): WordFrequency[] {
  const filtered = filterDiaries(diaries, classFilter, period);
  const freq: Record<string, number> = {};

  filtered.forEach(d => {
    const w = (d.emotionWord || '').trim();
    if (w) freq[w] = (freq[w] || 0) + 1;
  });

  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 35);
}

// Word frequency for gratitude keywords with contextual extraction and particle removal
export function computeGratitudeKeywordCloud(
  diaries: DiaryEntry[],
  classFilter: string,
  period: string
): WordFrequency[] {
  const filtered = filterDiaries(diaries, classFilter, period);
  const freq: Record<string, number> = {};

  filtered.forEach(d => {
    // Extract contextual keywords from each gratitude item
    [d.gratitude1, d.gratitude2, d.gratitude3].forEach(sentence => {
      if (!sentence || !sentence.trim()) return;
      const keywords = extractContextualKeywords(sentence);
      keywords.forEach(kw => {
        freq[kw] = (freq[kw] || 0) + 1;
      });
    });
  });

  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 45);
}

// Participation rate calculation
export function computeParticipationRate(
  students: Student[],
  diaries: DiaryEntry[],
  classFilter: string,
  period: string
) {
  const cFilter = parseClassFilter(classFilter);
  const targetStudents = students.filter(s => {
    if (!cFilter) return true;
    return cleanDigits(s.grade) === cFilter.grade && cleanDigits(s.classroom) === cFilter.classroom;
  });

  const studentKeySet = new Set(
    targetStudents.map(s => `${cleanDigits(s.grade)}-${cleanDigits(s.classroom)}-${cleanDigits(s.number)}`)
  );
  const filteredDiaries = filterDiaries(diaries, classFilter, period);

  const writtenKeys = new Set<string>();
  filteredDiaries.forEach(d => {
    const key = `${cleanDigits(d.grade)}-${cleanDigits(d.classroom)}-${cleanDigits(d.number)}`;
    if (studentKeySet.has(key)) {
      writtenKeys.add(key);
    }
  });

  const total = targetStudents.length;
  const written = writtenKeys.size;
  const rate = total > 0 ? Math.round((written / total) * 100) : 0;

  return { total, written, rate };
}

// Mood distribution counts
export function computeMoodDistribution(
  diaries: DiaryEntry[],
  classFilter: string,
  period: string
): Record<MoodType, number> {
  const filtered = filterDiaries(diaries, classFilter, period);
  const counts: Record<MoodType, number> = {
    'A형': 0,
    'B형': 0,
    'C형': 0,
    'D형': 0
  };

  filtered.forEach(d => {
    if (d.moodType && counts[d.moodType] !== undefined) {
      counts[d.moodType]++;
    }
  });

  return counts;
}

// Weekly trend
export function computeWeeklyTrend(
  diaries: DiaryEntry[],
  classFilter: string
) {
  const cFilter = parseClassFilter(classFilter);
  const classDiaries = diaries.filter(d => {
    if (!cFilter) return true;
    return cleanDigits(d.grade) === cFilter.grade && cleanDigits(d.classroom) === cFilter.classroom;
  });

  const now = new Date();
  const weeks: { label: string; start: Date; end: Date; counts: Record<MoodType, number> }[] = [];

  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1) - (w * 7);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekNum = Math.ceil((weekStart.getDate() + new Date(weekStart.getFullYear(), weekStart.getMonth(), 1).getDay()) / 7);
    const weekLabel = `${weekStart.getMonth() + 1}월 ${weekNum}주`;

    weeks.push({
      label: weekLabel,
      start: weekStart,
      end: weekEnd,
      counts: { 'A형': 0, 'B형': 0, 'C형': 0, 'D형': 0 }
    });
  }

  classDiaries.forEach(d => {
    const rowDate = new Date(d.dateStr || d.timestamp);
    for (const week of weeks) {
      if (rowDate >= week.start && rowDate < week.end) {
        if (d.moodType && week.counts[d.moodType] !== undefined) {
          week.counts[d.moodType]++;
        }
        break;
      }
    }
  });

  return weeks.map(w => ({ label: w.label, counts: w.counts }));
}
