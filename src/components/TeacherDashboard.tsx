import React, { useState, useEffect, useMemo } from 'react';
import { Student, DiaryEntry, MoodType } from '../types';
import {
  computeParticipationRate,
  computeMoodDistribution,
  computeWeeklyTrend,
  computeEmotionWordCloud,
  computeGratitudeKeywordCloud,
  formatShortDate,
  formatKoreanDate,
  isDefaultAdminPassword,
  cleanDigits,
  filterDiaries
} from '../utils/storage';
import {
  getGoogleSheetsUrl,
  setGoogleSheetsUrl,
  testGoogleSheetsConnection,
  buildDistributionUrl,
  GAS_CODE_TEMPLATE
} from '../utils/googleSheets';
import { QUADRANT_CONFIGS } from '../data/mockData';
import { WordCloud } from './WordCloud';
import { RosterModal } from './RosterModal';
import { PasswordModal } from './PasswordModal';
import {
  Users,
  CheckCircle2,
  PieChart,
  BarChart3,
  Search,
  Maximize2,
  X,
  Sparkles,
  Filter,
  ShieldCheck,
  Lock,
  ArrowRight,
  Database,
  ExternalLink,
  Copy,
  Check,
  Send,
  Share2,
  RefreshCw
} from 'lucide-react';

interface TeacherDashboardProps {
  students: Student[];
  diaries: DiaryEntry[];
  onUpdateStudents?: (students: Student[]) => void;
  onUpdateDiaries?: (diaries: DiaryEntry[]) => void;
  onSyncGoogleSheets?: () => Promise<{ success: boolean; studentCount: number; diaryCount: number; message: string }>;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  diaries,
  onUpdateStudents,
  onUpdateDiaries,
  onSyncGoogleSheets
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('전체');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('이번달');
  const [wordCloudTab, setWordCloudTab] = useState<'emotion' | 'gratitude'>('emotion');
  const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);

  // Google Sheets integration state
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [sheetsUrlInput, setSheetsUrlInput] = useState('');
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedDistributionLink, setIsCopiedDistributionLink] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Teacher Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isInitialPasswordCheck, setIsInitialPasswordCheck] = useState(false);

  useEffect(() => {
    setSheetsUrlInput(getGoogleSheetsUrl());
    // If still using default password 'admin1234', prompt to set a custom password
    if (isDefaultAdminPassword()) {
      setIsInitialPasswordCheck(true);
      setIsPasswordModalOpen(true);
    }
  }, []);

  const handleTriggerSync = async () => {
    if (!onSyncGoogleSheets) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await onSyncGoogleSheets();
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch {
      setSyncFeedback('동기화 중 오류가 발생했습니다.');
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyDistributionLink = () => {
    if (!sheetsUrlInput.trim()) {
      alert('먼저 Google Apps Script 웹 앱 URL을 입력하고 저장해 주세요.');
      return;
    }
    const distUrl = buildDistributionUrl(sheetsUrlInput);
    navigator.clipboard.writeText(distUrl);
    setIsCopiedDistributionLink(true);
    setTimeout(() => setIsCopiedDistributionLink(false), 2500);
  };

  const handleSaveSheetsUrl = () => {
    setGoogleSheetsUrl(sheetsUrlInput);
    alert('구글 시트 연동 URL이 저장되었습니다! 이제 학생이 일기를 저장하면 시트로 실시간 전송됩니다.');
  };

  const handleTestSheets = async () => {
    if (!sheetsUrlInput.trim()) {
      alert('먼저 Google Apps Script 웹 앱 URL을 입력해주세요.');
      return;
    }
    setTestStatus('testing');
    const ok = await testGoogleSheetsConnection(sheetsUrlInput);
    if (ok) {
      setTestStatus('success');
    } else {
      setTestStatus('fail');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_CODE_TEMPLATE);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2500);
  };

  // Class options dynamically generated from imported roster students and existing diaries!
  const classOptions = useMemo(() => {
    const classSet = new Set<string>();

    students.forEach(s => {
      const g = cleanDigits(s.grade);
      const c = cleanDigits(s.classroom);
      if (g && c) {
        classSet.add(`${g}학년 ${c}반`);
      }
    });

    diaries.forEach(d => {
      const g = cleanDigits(d.grade);
      const c = cleanDigits(d.classroom);
      if (g && c) {
        classSet.add(`${g}학년 ${c}반`);
      }
    });

    const sorted = Array.from(classSet).sort((a, b) => {
      const ma = a.match(/(\d+)학년\s*(\d+)반/);
      const mb = b.match(/(\d+)학년\s*(\d+)반/);
      if (!ma || !mb) return a.localeCompare(b);
      const ga = parseInt(ma[1], 10);
      const gb = parseInt(mb[1], 10);
      if (ga !== gb) return ga - gb;
      return parseInt(ma[2], 10) - parseInt(mb[2], 10);
    });

    if (sorted.length === 0) {
      return ['전체', '1학년 1반', '1학년 2반', '2학년 1반', '2학년 3반', '3학년 1반'];
    }

    return ['전체', ...sorted];
  }, [students, diaries]);

  // Student search state
  const [searchClassSelect, setSearchClassSelect] = useState<string>('전체');
  const [searchGrade, setSearchGrade] = useState('1');
  const [searchClassroom, setSearchClassroom] = useState('1');
  const [searchNumber, setSearchNumber] = useState('1');
  const [searchNameInput, setSearchNameInput] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<{
    student: Student | null;
    entries: DiaryEntry[];
  } | null>(null);

  // Auto-initialize searched student from students or diaries on load
  useEffect(() => {
    if (students.length > 0) {
      const first = students[0];
      const g = cleanDigits(first.grade) || '1';
      const c = cleanDigits(first.classroom) || '1';
      const num = cleanDigits(first.number) || '1';
      setSearchGrade(g);
      setSearchClassroom(c);
      setSearchNumber(num);
      setSearchClassSelect(`${g}학년 ${c}반`);

      const entries = diaries.filter(d => {
        const matchNum = cleanDigits(d.grade) === g && cleanDigits(d.classroom) === c && cleanDigits(d.number) === num;
        const matchName = Boolean(d.studentName && first.name && d.studentName.trim() === first.name.trim() && cleanDigits(d.grade) === g);
        return matchNum || matchName;
      });
      setSearchedStudent({ student: first, entries });
    } else if (diaries.length > 0) {
      const firstD = diaries[0];
      const g = cleanDigits(firstD.grade) || '1';
      const c = cleanDigits(firstD.classroom) || '1';
      const num = cleanDigits(firstD.number) || '1';
      setSearchGrade(g);
      setSearchClassroom(c);
      setSearchNumber(num);
      const entries = diaries.filter(d => cleanDigits(d.grade) === g && cleanDigits(d.classroom) === c && cleanDigits(d.number) === num);
      setSearchedStudent({ student: null, entries });
    }
  }, [students, diaries]);

  // Students available for the selected search class dropdown
  const filteredStudentsForSearch = useMemo(() => {
    if (searchClassSelect === '전체') {
      return students.slice(0, 100);
    }
    const match = searchClassSelect.match(/(\d+)학년\s*(\d+)반/);
    if (!match) return students;
    const g = match[1];
    const c = match[2];
    return students
      .filter(s => cleanDigits(s.grade) === g && cleanDigits(s.classroom) === c)
      .sort((a, b) => (parseInt(cleanDigits(a.number) || '0', 10) - parseInt(cleanDigits(b.number) || '0', 10)));
  }, [students, searchClassSelect]);

  const handleSelectStudentFromDropdown = (studentIdKey: string) => {
    if (!studentIdKey) return;
    const [g, c, num] = studentIdKey.split('-');
    const found = students.find(
      s => cleanDigits(s.grade) === g && cleanDigits(s.classroom) === c && cleanDigits(s.number) === num
    ) || null;

    setSearchGrade(g);
    setSearchClassroom(c);
    setSearchNumber(num);
    if (found) {
      setSearchClassSelect(`${g}학년 ${c}반`);
    }

    const entries = diaries.filter(d => {
      const matchNum = cleanDigits(d.grade) === g && cleanDigits(d.classroom) === c && cleanDigits(d.number) === num;
      const matchName = Boolean(found && d.studentName && found.name && d.studentName.trim() === found.name.trim() && cleanDigits(d.grade) === g);
      return matchNum || matchName;
    });

    setSearchedStudent({ student: found, entries });
  };

  const handleSearchStudent = () => {
    const g = cleanDigits(searchGrade);
    const c = cleanDigits(searchClassroom);
    const num = cleanDigits(searchNumber);
    const trimmedName = searchNameInput.trim().toLowerCase();

    let found: Student | null = null;
    if (trimmedName) {
      found = students.find(s => s.name.toLowerCase().includes(trimmedName)) || null;
      if (found) {
        setSearchGrade(cleanDigits(found.grade) || g);
        setSearchClassroom(cleanDigits(found.classroom) || c);
        setSearchNumber(cleanDigits(found.number) || num);
        setSearchClassSelect(`${cleanDigits(found.grade)}학년 ${cleanDigits(found.classroom)}반`);
      }
    }

    if (!found) {
      found = students.find(
        s => cleanDigits(s.grade) === g && cleanDigits(s.classroom) === c && cleanDigits(s.number) === num
      ) || null;
    }

    const curG = found ? cleanDigits(found.grade) : g;
    const curC = found ? cleanDigits(found.classroom) : c;
    const curNum = found ? cleanDigits(found.number) : num;
    const curName = found ? found.name : trimmedName;

    const entries = diaries.filter(d => {
      const dG = cleanDigits(d.grade);
      const dC = cleanDigits(d.classroom);
      const dNum = cleanDigits(d.number);
      const matchNum = dG === curG && dC === curC && dNum === curNum;
      const matchName = Boolean(curName && d.studentName && d.studentName.trim().toLowerCase() === curName.toLowerCase() && (!curG || dG === curG));
      return matchNum || matchName;
    });

    setSearchedStudent({ student: found, entries });
  };

  // Calculate metrics
  const participation = computeParticipationRate(students, diaries, selectedClass, selectedPeriod);
  const moodDistribution = computeMoodDistribution(diaries, selectedClass, selectedPeriod);
  const weeklyTrend = computeWeeklyTrend(diaries, selectedClass);

  const emotionWords = computeEmotionWordCloud(diaries, selectedClass, selectedPeriod);
  const gratitudeWords = computeGratitudeKeywordCloud(diaries, selectedClass, selectedPeriod);

  const totalMoodCount = Object.values(moodDistribution).reduce((a, b) => a + b, 0);

  // Period analysis check (e.g. 9월 vs 전체/6월)
  const currentPeriodDiaries = useMemo(() => {
    return filterDiaries(diaries, selectedClass, selectedPeriod);
  }, [diaries, selectedClass, selectedPeriod]);

  const allPeriodDiaries = useMemo(() => {
    return filterDiaries(diaries, selectedClass, '전체');
  }, [diaries, selectedClass]);

  return (
    <div className="space-y-6">
      {/* Default Password Reminder Banner */}
      {isDefaultAdminPassword() && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <span className="font-black text-sm block text-amber-950">
                현재 교사 인증 초기 비밀번호(admin1234)를 사용 중입니다
              </span>
              <span className="text-xs text-amber-800 leading-snug">
                학생들의 대시보드 무단 접근을 방지하고 학급 데이터를 안전하게 보호하기 위해 선생님만의 비밀번호로 변경해 주세요.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition shadow-xs cursor-pointer flex-shrink-0"
          >
            비밀번호 설정하기 🔒
          </button>
        </div>
      )}

      {/* Top Banner & Filters */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#123b5d] flex items-center gap-2">
                <span>교사용 학급 마음 대시보드</span>
              </h2>
              <p className="text-xs text-stone-500">
                학생들의 일상적인 마음 상태와 감사의 씨앗을 따뜻하게 모니터링합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSyncGoogleSheets && (
              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                title="구글 시트(명렬표 및 DiaryData) 최신 데이터를 즉시 동기화합니다"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? '동기화 중...' : '시트 즉시 동기화'}</span>
              </button>
            )}

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
                isDefaultAdminPassword()
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-stone-600" />
              <span>비밀번호 관리</span>
              {isDefaultAdminPassword() && (
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                  초기값
                </span>
              )}
            </button>

            <button
              onClick={() => setIsRosterModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer bg-white hover:bg-stone-50 border-blue-300 text-blue-800"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>학생 명렬표 관리 ({students.length}명)</span>
            </button>

            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer bg-white hover:bg-stone-50 border-emerald-300 text-emerald-800"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>구글 시트 연동 설정</span>
              {sheetsUrlInput ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="연동 활성화됨" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-stone-300" title="미연동" />
              )}
            </button>
            <span className="text-[11px] font-bold text-stone-400 hidden sm:inline">실시간 분석</span>
          </div>
        </div>

        {/* Sync Feedback Toast */}
        {syncFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-2xl border border-stone-200/70">
            <Filter className="w-4 h-4 text-stone-400 ml-2" />
            <span className="text-xs font-bold text-stone-600">학급 선택:</span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="flex-1 bg-white text-xs sm:text-sm font-bold p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              {classOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-stone-50 p-1.5 rounded-2xl border border-stone-200/70">
            {['오늘', '이번주', '이번달', '3개월', '전체'].map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  selectedPeriod === p
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Period Notice (e.g. 9월 vs 6월 DiaryData 이전 데이터) */}
        {currentPeriodDiaries.length === 0 && allPeriodDiaries.length > 0 && (
          <div className="p-3.5 bg-blue-50/90 border border-blue-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700 flex-shrink-0 text-base">
                📅
              </span>
              <div>
                <span className="font-black block">
                  선택하신 기간({selectedPeriod})에는 작성된 기록이 없습니다.
                </span>
                <span className="text-blue-800 text-[11px]">
                  구글 시트(DiaryData)에 보관된 과거 기록(6월 등 총 {allPeriodDiaries.length}건)을 보시려면 기간을 변경해 주세요.
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedPeriod('전체')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-2xs cursor-pointer whitespace-nowrap self-end sm:self-center"
            >
              전체 기간으로 보기 ➡️
            </button>
          </div>
        )}
      </div>

      {/* Row 1: Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-400 block mb-1">전체 학생 수</span>
            <div className="text-2xl font-black text-[#123b5d]">{participation.total}명</div>
          </div>
          <span className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Users className="w-5 h-5" />
          </span>
        </div>

        {/* Submitted */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-400 block mb-1">기록 완료 학생</span>
            <div className="text-2xl font-black text-rose-600">{participation.written}명</div>
          </div>
          <span className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>

        {/* Participation Rate */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-400">참여율</span>
            <span className="text-lg font-black text-emerald-600">{participation.rate}%</span>
          </div>
          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(participation.rate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Mood Distribution & Weekly Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mood Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-[#123b5d]">마음 날씨 분포</h3>
            </div>
            <span className="text-xs text-stone-400 font-medium">총 {totalMoodCount}건</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { type: 'A형', label: 'A형 (해 ☀️)', count: moodDistribution['A형'], bg: 'bg-[#fff9e6]', border: 'border-amber-200', text: 'text-amber-900', bar: 'bg-amber-400' },
              { type: 'B형', label: 'B형 (새싹 🌱)', count: moodDistribution['B형'], bg: 'bg-[#f0faf0]', border: 'border-emerald-200', text: 'text-emerald-900', bar: 'bg-emerald-500' },
              { type: 'C형', label: 'C형 (구름 ☁️)', count: moodDistribution['C형'], bg: 'bg-[#fff0f0]', border: 'border-rose-200', text: 'text-rose-900', bar: 'bg-rose-400' },
              { type: 'D형', label: 'D형 (빗방울 💧)', count: moodDistribution['D형'], bg: 'bg-[#eef2ff]', border: 'border-sky-200', text: 'text-sky-900', bar: 'bg-sky-400' }
            ].map(item => {
              const pct = totalMoodCount > 0 ? Math.round((item.count / totalMoodCount) * 100) : 0;
              return (
                <div
                  key={item.type}
                  className={`p-3.5 rounded-2xl border ${item.bg} ${item.border} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${item.text}`}>{item.label}</span>
                    <span className="text-xs font-black text-stone-700">{item.count}명</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${item.bar} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-stone-500 font-bold mt-1">
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Trend (Stacked Bar) */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-[#123b5d]">주간 마음 변화 추이</h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="text-amber-600">■ A형</span>
              <span className="text-emerald-600">■ B형</span>
              <span className="text-rose-600">■ C형</span>
              <span className="text-sky-600">■ D형</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {weeklyTrend.map(week => {
              const wTotal = Object.values(week.counts).reduce((a, b) => a + b, 0);
              return (
                <div key={week.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                    <span>{week.label}</span>
                    <span className="text-stone-400 font-normal">총 {wTotal}건</span>
                  </div>
                  <div className="w-full h-5 bg-stone-100 rounded-xl overflow-hidden flex shadow-inner">
                    {wTotal === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                        기록 없음
                      </div>
                    ) : (
                      <>
                        <div
                          style={{ width: `${(week.counts['A형'] / wTotal) * 100}%` }}
                          className="h-full bg-amber-400 transition-all"
                          title={`A형: ${week.counts['A형']}건`}
                        />
                        <div
                          style={{ width: `${(week.counts['B형'] / wTotal) * 100}%` }}
                          className="h-full bg-emerald-500 transition-all"
                          title={`B형: ${week.counts['B형']}건`}
                        />
                        <div
                          style={{ width: `${(week.counts['C형'] / wTotal) * 100}%` }}
                          className="h-full bg-rose-400 transition-all"
                          title={`C형: ${week.counts['C형']}건`}
                        />
                        <div
                          style={{ width: `${(week.counts['D형'] / wTotal) * 100}%` }}
                          className="h-full bg-sky-400 transition-all"
                          title={`D형: ${week.counts['D형']}건`}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Mentimeter-style Interactive Word Cloud */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">☁️</span>
              <h3 className="text-base font-extrabold text-[#123b5d]">
                우리 반 인터랙티브 마음 클라우드 (Mentimeter 스타일)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              단어에 마우스를 올리면 정확한 빈도수를 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="bg-stone-100 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setWordCloudTab('emotion')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  wordCloudTab === 'emotion'
                    ? 'bg-white text-[#123b5d] shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                😊 감정 단어
              </button>
              <button
                onClick={() => setWordCloudTab('gratitude')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  wordCloudTab === 'gratitude'
                    ? 'bg-white text-[#123b5d] shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                🍓 감사 키워드
              </button>
            </div>

            {/* Full screen button specifically requested by user */}
            <button
              onClick={() => setIsFullScreenModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#123b5d] hover:bg-[#1a4d77] text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="교실 TV/프로젝터 전용 전체 화면"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">전체 화면으로 크게 보기</span>
            </button>
          </div>
        </div>

        {/* Word Cloud View */}
        <div className="bg-[#fcfbf9] rounded-2xl border border-stone-200/60 p-2">
          <WordCloud
            words={wordCloudTab === 'emotion' ? emotionWords : gratitudeWords}
            mode={wordCloudTab}
          />
        </div>
      </div>

      {/* Row 4: Personal Student Mind Trend Search */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-[#123b5d]">
              개인별 학생 마음 변화 조회
            </h3>
          </div>
          <p className="text-xs text-rose-600 font-semibold mt-1">
            ※ 일기 본문은 표시되지 않으며, 감정 변화 추이만 확인할 수 있습니다.
          </p>
        </div>

        {/* Roster & Search Controls */}
        <div className="space-y-3 bg-stone-50/70 p-4 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Class Roster Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-500 block">
                1. 학급 선택 (명렬표 연동)
              </label>
              <select
                value={searchClassSelect}
                onChange={e => {
                  const val = e.target.value;
                  setSearchClassSelect(val);
                  const m = val.match(/(\d+)학년\s*(\d+)반/);
                  if (m) {
                    setSearchGrade(m[1]);
                    setSearchClassroom(m[2]);
                  }
                }}
                className="w-full bg-white text-xs font-bold p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              >
                {classOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Student Select from Roster */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-500 block">
                2. 명렬표 학생 선택 ({filteredStudentsForSearch.length}명)
              </label>
              <select
                value={
                  searchedStudent?.student
                    ? `${cleanDigits(searchedStudent.student.grade)}-${cleanDigits(searchedStudent.student.classroom)}-${cleanDigits(searchedStudent.student.number)}`
                    : `${cleanDigits(searchGrade)}-${cleanDigits(searchClassroom)}-${cleanDigits(searchNumber)}`
                }
                onChange={e => handleSelectStudentFromDropdown(e.target.value)}
                className="w-full bg-white text-xs font-bold p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              >
                <option value="">-- 학생을 선택해 주세요 --</option>
                {filteredStudentsForSearch.map(s => {
                  const sG = cleanDigits(s.grade);
                  const sC = cleanDigits(s.classroom);
                  const sNum = cleanDigits(s.number);
                  const recCount = diaries.filter(d => {
                    const matchNum = cleanDigits(d.grade) === sG && cleanDigits(d.classroom) === sC && cleanDigits(d.number) === sNum;
                    const matchName = Boolean(d.studentName && s.name && d.studentName.trim() === s.name.trim() && cleanDigits(d.grade) === sG);
                    return matchNum || matchName;
                  }).length;

                  return (
                    <option key={`${sG}-${sC}-${sNum}`} value={`${sG}-${sC}-${sNum}`}>
                      {s.grade}학년 {s.classroom}반 {s.number}번 {s.name} (기록 {recCount}건)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 3. Quick Name or Number Search Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/60">
            <div className="flex-1 min-w-[140px] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="학생 이름으로 직접 검색..."
                value={searchNameInput}
                onChange={e => setSearchNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearchStudent();
                }}
                className="w-full text-xs font-bold bg-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400">학년</span>
                <input
                  type="text"
                  value={searchGrade}
                  onChange={e => setSearchGrade(e.target.value)}
                  className="w-7 text-xs font-bold text-center outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400">반</span>
                <input
                  type="text"
                  value={searchClassroom}
                  onChange={e => setSearchClassroom(e.target.value)}
                  className="w-7 text-xs font-bold text-center outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400">번</span>
                <input
                  type="text"
                  value={searchNumber}
                  onChange={e => setSearchNumber(e.target.value)}
                  className="w-8 text-xs font-bold text-center outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSearchStudent}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-2xs transition cursor-pointer"
            >
              조회하기
            </button>
          </div>
        </div>

        {/* Search Result */}
        {searchedStudent && (
          <div className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
              <div>
                <span className="text-xs font-bold text-stone-400">
                  {searchGrade}학년 {searchClassroom}반 {searchNumber}번
                </span>
                <h4 className="text-lg font-black text-[#123b5d] flex items-center gap-2">
                  <span>{searchedStudent.student ? `${searchedStudent.student.name} 학생` : '미등록 학생'}</span>
                  {searchedStudent.student && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      명렬표 연동됨
                    </span>
                  )}
                </h4>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-2xs">
                  총 기록: <strong>{searchedStudent.entries.length}일</strong>
                </span>
              </div>
            </div>

            {/* Individual student trend & entries */}
            {searchedStudent.entries.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 bg-white rounded-xl border border-stone-200 space-y-1">
                <p className="font-bold text-stone-600">해당 학생의 작성된 마음일기 기록이 없습니다.</p>
                <p className="text-[11px] text-stone-400">학생이 일기를 작성하거나 구글 시트(DiaryData)에 이전 기록이 연동되면 이곳에 나타납니다.</p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600 block">
                    마음 날씨 히스토리 ({searchedStudent.entries.length}건)
                  </span>
                  <span className="text-[11px] text-stone-400 font-medium">
                    최근 작성순 정렬
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {searchedStudent.entries
                    .sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''))
                    .map(entry => {
                      const q = (entry.moodType?.charAt(0) || 'B') as 'A' | 'B' | 'C' | 'D';
                      const conf = QUADRANT_CONFIGS[q] || QUADRANT_CONFIGS.B;

                      return (
                        <div
                          key={entry.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-2xs ${conf.cardBg} ${conf.borderColor}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg flex-shrink-0">{conf.icon}</span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-black text-stone-500">
                                {formatKoreanDate(entry.dateStr)}
                              </span>
                              <span className="text-sm font-extrabold text-[#123b5d] truncate">
                                {entry.emotionWord}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.cardBg} ${conf.borderColor} text-stone-700`}>
                            {entry.moodType}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Google Sheets Integration Modal */}
      {isSheetsModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#123b5d]">
                    구글 스프레드시트 실시간 연동
                  </h3>
                  <p className="text-xs text-stone-500">
                    학생들의 감사일기 제출 시 선생님의 구글 시트에 자동으로 1줄씩 기록됩니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSheetsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* URL Input Form */}
            <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <label className="text-xs font-black text-[#123b5d] flex items-center justify-between">
                <span>Google Apps Script 웹 앱 URL:</span>
                {sheetsUrlInput ? (
                  <span className="text-[11px] text-emerald-600 font-bold">🟢 URL 설정됨</span>
                ) : (
                  <span className="text-[11px] text-amber-600 font-bold">⚠️ URL 미설정</span>
                )}
              </label>
              <input
                type="url"
                value={sheetsUrlInput}
                onChange={e => setSheetsUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-white px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveSheetsUrl}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    URL 저장하기
                  </button>
                  <button
                    onClick={handleTestSheets}
                    disabled={testStatus === 'testing'}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-stone-500" />
                    <span>{testStatus === 'testing' ? '전송 중...' : '테스트 전송'}</span>
                  </button>
                </div>
                {testStatus === 'success' && (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 테스트 데이터가 전송되었습니다! 시트를 확인해보세요.
                  </span>
                )}
                {testStatus === 'fail' && (
                  <span className="text-xs text-rose-600 font-bold">
                    ⚠️ 전송 실패. URL을 다시 확인해 주세요.
                  </span>
                )}
              </div>
            </div>

            {/* Shareable Link Box for Teachers & Students */}
            {sheetsUrlInput && (
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/90 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                    <Share2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>우리 반 학생 배포용 링크 (시트 자동연동)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyDistributionLink}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isCopiedDistributionLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>링크 복사완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>학생 공유 링크 복사</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  💡 <strong>다른 선생님이나 반별로 사용할 때 어떻게 하나요?</strong><br />
                  이 링크를 복사하여 학생들에게 전달하시면, 학생 기기에서 별도 입력 없이 선생님의 구글 시트로 자동 연결되어 데이터가 100% 분리 수집됩니다. 다른 선생님도 본인 구글 시트 URL을 넣고 해당 반 전용 링크를 만들어 배포하시면 학생들의 데이터가 서로 절대 엉키지 않습니다!
                </p>
              </div>
            )}

            {/* Quick 1-minute Step by Step Guide */}
            <div className="space-y-2.5 text-xs text-stone-700">
              <h4 className="font-black text-stone-900 text-sm flex items-center gap-1.5">
                <span>📋 1분 연동 가이드</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-stone-600 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80">
                <li>
                  구글 드라이브에서 새 <strong>구글 스프레드시트</strong>를 만듭니다.
                </li>
                <li>
                  (선택) 하단 [+]로 새 시트를 만들어 이름을 <strong>'학생명렬표'</strong>로 두고 [A]학년 [B]반 [C]번호 [D]이름을 적으면 학생 명렬표도 함께 연동됩니다.
                </li>
                <li>
                  상단 메뉴 <strong>[확장 프로그램] &gt; [Apps Script]</strong>를 클릭합니다.
                </li>
                <li>
                  기존 코드를 모두 지우고, 아래의 <strong>[Apps Script 코드 복사]</strong>를 눌러 붙여넣습니다.
                </li>
                <li>
                  우측 상단 파란색 <strong>[배포] &gt; [새 배포]</strong>를 클릭합니다. (기존 배포가 있다면 [배포 관리]에서 수정 &gt; 새 버전 선택)
                </li>
                <li>
                  유형(톱니바퀴)에서 <strong>[웹 앱]</strong>을 선택하고, 액세스 권한을 반드시 <strong>'모든 사용자(Anyone)'</strong>로 설정 후 배포합니다.
                </li>
                <li>
                  생성된 <strong>웹 앱 URL (https://script.google.com/.../exec)</strong>을 위 입력칸에 넣고 저장하면 완료됩니다!
                </li>
              </ol>
            </div>

            {/* Student Roster Banner inside Sheets Modal */}
            <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700 flex-shrink-0" />
                <span className="text-xs text-blue-900 font-bold">
                  학생들의 명렬표(이름/번호)도 구글 시트에서 관리하고 싶으신가요?
                </span>
              </div>
              <button
                onClick={() => {
                  setIsSheetsModalOpen(false);
                  setIsRosterModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black whitespace-nowrap shadow-2xs transition cursor-pointer"
              >
                학생 명렬표 관리 열기
              </button>
            </div>

            {/* Code Copy Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Code.gs에 붙여넣을 스크립트:</span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-[#123b5d] hover:bg-[#1a4d77] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {isCopiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedCode ? '복사 완료!' : 'Apps Script 코드 복사'}</span>
                </button>
              </div>
              <pre className="p-3 bg-stone-900 text-stone-200 text-[11px] font-mono rounded-xl max-h-36 overflow-y-auto leading-relaxed selection:bg-emerald-700">
                {GAS_CODE_TEMPLATE}
              </pre>
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setIsSheetsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Roster Management Modal */}
      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        students={students}
        onSaveStudents={newStudents => {
          if (onUpdateStudents) {
            onUpdateStudents(newStudents);
          }
        }}
        onOpenSheetsSettings={() => {
          setIsRosterModalOpen(false);
          setIsSheetsModalOpen(true);
        }}
      />

      {/* Full-screen TV / Projector Modal */}
      {isFullScreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#123b5d] text-white p-6 sm:p-10 flex flex-col justify-between animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">☁️</span>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  우리 반 마음 클라우드 (수업 / TV 화면)
                </h2>
                <p className="text-xs sm:text-sm text-blue-200 font-medium">
                  {selectedClass === '전체' ? '전체 학급' : selectedClass} · {selectedPeriod} 마음 지도
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-2xl flex items-center">
                <button
                  onClick={() => setWordCloudTab('emotion')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                    wordCloudTab === 'emotion'
                      ? 'bg-white text-[#123b5d] shadow-md'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  😊 감정 단어
                </button>
                <button
                  onClick={() => setWordCloudTab('gratitude')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                    wordCloudTab === 'gratitude'
                      ? 'bg-white text-[#123b5d] shadow-md'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  🍓 감사 키워드
                </button>
              </div>

              <button
                onClick={() => setIsFullScreenModalOpen(false)}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Modal Content - Giant Word Cloud */}
          <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 my-2 sm:my-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md overflow-hidden">
            <WordCloud
              words={wordCloudTab === 'emotion' ? emotionWords : gratitudeWords}
              mode={wordCloudTab}
              isLarge={true}
            />
          </div>

          {/* Modal Footer */}
          <div className="text-center text-xs text-blue-200/80 font-medium border-t border-white/10 pt-3">
            땡큐베리마인드 (ThankYouBerryMind) · 학생들의 감정 단어와 감사 표현은 모두 익명으로 집계됩니다 🌱
          </div>
        </div>
      )}

      {/* Password Management Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setIsInitialPasswordCheck(false);
        }}
        isInitialPrompt={isInitialPasswordCheck}
      />
    </div>
  );
};
