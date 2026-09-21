import React, { useState, useEffect } from 'react';
import { Student, DiaryEntry, MoodType } from '../types';
import {
  computeParticipationRate,
  computeMoodDistribution,
  computeWeeklyTrend,
  computeEmotionWordCloud,
  computeGratitudeKeywordCloud,
  formatShortDate,
  formatKoreanDate,
  isDefaultAdminPassword
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
  Share2
} from 'lucide-react';

interface TeacherDashboardProps {
  students: Student[];
  diaries: DiaryEntry[];
  onUpdateStudents?: (students: Student[]) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  diaries,
  onUpdateStudents
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

  // Student search state
  const [searchGrade, setSearchGrade] = useState('2');
  const [searchClassroom, setSearchClassroom] = useState('3');
  const [searchNumber, setSearchNumber] = useState('7');
  const [searchedStudent, setSearchedStudent] = useState<{
    student: Student | null;
    entries: DiaryEntry[];
  } | null>(() => {
    // default demo student
    const defaultStudent = students.find(s => s.grade === '2' && s.classroom === '3' && s.number === '7') || null;
    const entries = diaries.filter(d => d.grade === '2' && d.classroom === '3' && d.number === '7');
    return defaultStudent ? { student: defaultStudent, entries } : null;
  });

  // Calculate metrics
  const participation = computeParticipationRate(students, diaries, selectedClass, selectedPeriod);
  const moodDistribution = computeMoodDistribution(diaries, selectedClass, selectedPeriod);
  const weeklyTrend = computeWeeklyTrend(diaries, selectedClass);

  const emotionWords = computeEmotionWordCloud(diaries, selectedClass, selectedPeriod);
  const gratitudeWords = computeGratitudeKeywordCloud(diaries, selectedClass, selectedPeriod);

  const totalMoodCount = Object.values(moodDistribution).reduce((a, b) => a + b, 0);

  // Class options derived from students list
  const classOptions = [
    '전체',
    '1학년 1반',
    '1학년 2반',
    '2학년 1반',
    '2학년 3반',
    '3학년 1반',
    '3학년 2반'
  ];

  const handleSearchStudent = () => {
    const found = students.find(
      s => s.grade === searchGrade && s.classroom === searchClassroom && s.number === searchNumber
    ) || null;

    const entries = diaries.filter(
      d => d.grade === searchGrade && d.classroom === searchClassroom && d.number === searchNumber
    );

    setSearchedStudent({ student: found, entries });
  };

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

        {/* Search Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500">학년</span>
            <input
              type="text"
              value={searchGrade}
              onChange={e => setSearchGrade(e.target.value)}
              className="w-10 text-xs font-bold p-1 text-center bg-white border border-stone-300 rounded-md"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500">반</span>
            <input
              type="text"
              value={searchClassroom}
              onChange={e => setSearchClassroom(e.target.value)}
              className="w-10 text-xs font-bold p-1 text-center bg-white border border-stone-300 rounded-md"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500">번호</span>
            <input
              type="text"
              value={searchNumber}
              onChange={e => setSearchNumber(e.target.value)}
              className="w-12 text-xs font-bold p-1 text-center bg-white border border-stone-300 rounded-md"
            />
          </div>

          <button
            onClick={handleSearchStudent}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition"
          >
            조회하기
          </button>
        </div>

        {/* Search Result */}
        {searchedStudent && (
          <div className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-400">
                  {searchGrade}학년 {searchClassroom}반 {searchNumber}번
                </span>
                <h4 className="text-base font-extrabold text-[#123b5d]">
                  {searchedStudent.student ? `${searchedStudent.student.name} 학생` : '미등록 학생'}
                </h4>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700">
                기록 총 {searchedStudent.entries.length}일
              </span>
            </div>

            {/* Individual student trend chart */}
            {searchedStudent.entries.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-white rounded-xl border border-stone-200">
                해당 학생의 기록된 마음 데이터가 없습니다.
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-stone-600 block">
                  마음 날씨 히스토리
                </span>
                <div className="flex flex-wrap gap-2">
                  {searchedStudent.entries.map(entry => {
                    const q = entry.moodType?.charAt(0) as 'A' | 'B' | 'C' | 'D';
                    const conf = QUADRANT_CONFIGS[q] || QUADRANT_CONFIGS.B;

                    return (
                      <div
                        key={entry.id}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${conf.cardBg} ${conf.borderColor}`}
                      >
                        <span>{conf.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-stone-400">
                            {formatShortDate(entry.dateStr)}
                          </span>
                          <span className="text-[#123b5d]">{entry.emotionWord} ({entry.moodType})</span>
                        </div>
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
