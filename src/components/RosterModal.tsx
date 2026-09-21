import React, { useState } from 'react';
import { Student } from '../types';
import {
  fetchStudentsFromGoogleSheets,
  getGoogleSheetsUrl
} from '../utils/googleSheets';
import { INITIAL_STUDENTS } from '../data/mockData';
import {
  X,
  Users,
  RefreshCw,
  ClipboardPaste,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSaveStudents: (newStudents: Student[]) => void;
  onOpenSheetsSettings: () => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  students,
  onSaveStudents,
  onOpenSheetsSettings
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'paste' | 'list' | 'guide'>('sync');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Batch paste state
  const [pasteText, setPasteText] = useState('');
  const [pasteResult, setPasteResult] = useState<{ count: number; error?: string } | null>(null);

  // Single student manual add state
  const [newGrade, setNewGrade] = useState('2');
  const [newClassroom, setNewClassroom] = useState('3');
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');

  // Class filter for student list view
  const [filterClass, setFilterClass] = useState<string>('all');

  if (!isOpen) return null;

  const currentSheetsUrl = getGoogleSheetsUrl();

  // Handle sync from Google Sheets
  const handleSyncFromSheets = async () => {
    if (!currentSheetsUrl) {
      setSyncStatus('error');
      setSyncMessage('구글 시트 연동 URL이 아직 설정되지 않았습니다. [구글 시트 연동 설정]에서 먼저 URL을 등록해 주세요.');
      return;
    }

    setSyncStatus('loading');
    setSyncMessage('구글 시트에서 학생명렬표를 불러오는 중입니다...');

    const result = await fetchStudentsFromGoogleSheets();
    if (result.success && result.students) {
      if (result.students.length === 0) {
        setSyncStatus('error');
        setSyncMessage('구글 시트의 [학생명렬표] 탭에서 학생 데이터를 찾지 못했습니다. 2행부터 학년, 반, 번호, 이름이 올바르게 입력되어 있는지 확인해 주세요.');
      } else {
        onSaveStudents(result.students);
        setSyncStatus('success');
        setSyncMessage(`성공! 구글 시트에서 총 ${result.students.length}명의 학생 명렬표를 동기화했습니다. 🎉`);
      }
    } else {
      setSyncStatus('error');
      setSyncMessage(result.error || '명렬표를 불러오지 못했습니다. Apps Script 최신 코드를 배포했는지 확인해 주세요.');
    }
  };

  // Parse pasted text from Excel or NEIS
  const handleBatchPaste = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split('\n');
    const parsed: Student[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Ignore header lines like "학년 반 번호 이름"
      if (line.includes('학년') && line.includes('이름')) continue;

      // Support tab, comma, or space delimiters
      let tokens: string[] = [];
      if (line.includes('\t')) {
        tokens = line.split('\t').map(t => t.trim()).filter(Boolean);
      } else if (line.includes(',')) {
        tokens = line.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        tokens = line.split(/\s+/).map(t => t.trim()).filter(Boolean);
      }

      if (tokens.length >= 4) {
        const grade = tokens[0].replace(/[^0-9]/g, '') || '1';
        const classroom = tokens[1].replace(/[^0-9]/g, '') || '1';
        const number = tokens[2].replace(/[^0-9]/g, '') || '1';
        const name = tokens[3].replace(/[0-9]/g, '').trim() || tokens[3];

        if (name) {
          parsed.push({ grade, classroom, number, name });
        }
      } else if (tokens.length === 2) {
        // e.g., "1 김철수" -> assumes current newGrade & newClassroom
        const number = tokens[0].replace(/[^0-9]/g, '');
        const name = tokens[1];
        if (number && name) {
          parsed.push({ grade: newGrade, classroom: newClassroom, number, name });
        }
      }
    }

    if (parsed.length === 0) {
      setPasteResult({ count: 0, error: '인식된 학생 데이터가 없습니다. 한 줄에 "학년 반 번호 이름" 형식으로 입력해 주세요.' });
      return;
    }

    // Merge or replace
    onSaveStudents(parsed);
    setPasteResult({ count: parsed.length });
    setPasteText('');
  };

  // Add single student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim() || !newName.trim()) return;

    const newStudent: Student = {
      grade: newGrade.trim(),
      classroom: newClassroom.trim(),
      number: newNumber.trim(),
      name: newName.trim()
    };

    // Remove if already exists with exact same grade/class/number
    const updated = [
      ...students.filter(
        s => !(s.grade === newStudent.grade && s.classroom === newStudent.classroom && s.number === newStudent.number)
      ),
      newStudent
    ].sort((a, b) => {
      if (a.grade !== b.grade) return Number(a.grade) - Number(b.grade);
      if (a.classroom !== b.classroom) return Number(a.classroom) - Number(b.classroom);
      return Number(a.number) - Number(b.number);
    });

    onSaveStudents(updated);
    setNewNumber('');
    setNewName('');
  };

  // Delete single student
  const handleDeleteStudent = (target: Student) => {
    const updated = students.filter(
      s => !(s.grade === target.grade && s.classroom === target.classroom && s.number === target.number)
    );
    onSaveStudents(updated);
  };

  // Reset to initial mock students
  const handleResetToDemo = () => {
    if (window.confirm('학생 명단을 기본 예시 학생(12명)으로 재설정하시겠습니까?')) {
      onSaveStudents(INITIAL_STUDENTS);
    }
  };

  // Compute class summaries
  const classBreakdown: { [key: string]: number } = {};
  students.forEach(s => {
    const key = `${s.grade}학년 ${s.classroom}반`;
    classBreakdown[key] = (classBreakdown[key] || 0) + 1;
  });

  const filteredStudents = students.filter(s => {
    if (filterClass === 'all') return true;
    return `${s.grade}-${s.classroom}` === filterClass;
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-700">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#123b5d] flex items-center gap-2">
                <span>학생 명렬표 관리 및 연동</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  총 {students.length}명
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                실제 학생 명단을 연동하여 학생 로그인 시 간편하고 정확하게 입장하도록 설정합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl overflow-x-auto text-xs font-black">
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>구글 시트 실시간 동기화</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
            <span>엑셀/나이스 붙여넣기</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>등록된 명단 조회 ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>시트 작성 가이드</span>
          </button>
        </div>

        {/* Current Class Enrolled Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-stone-400 mr-1">등록 학급 현황:</span>
          {Object.entries(classBreakdown).length > 0 ? (
            Object.entries(classBreakdown).map(([cls, count]) => (
              <span
                key={cls}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold border border-blue-200/80"
              >
                {cls} ({count}명)
              </span>
            ))
          ) : (
            <span className="text-[11px] text-amber-600 font-bold">등록된 학생이 없습니다.</span>
          )}
        </div>

        {/* TAB 1: Google Sheets Direct Sync */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50/70 to-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-blue-200/70 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-[#123b5d] flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>구글 스프레드시트에서 학생 명렬표 불러오기</span>
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    구글 시트의 <strong>[학생명렬표]</strong> 탭에 적어둔 학생 명단을 원클릭으로 웹앱에 동기화합니다.
                  </p>
                </div>
                <button
                  onClick={onOpenSheetsSettings}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-[11px] font-bold text-stone-700 whitespace-nowrap shadow-2xs cursor-pointer"
                >
                  시트 연동 URL 설정
                </button>
              </div>

              {/* URL Status Banner */}
              <div className="flex items-center gap-2 text-xs font-bold p-2.5 rounded-xl bg-white/90 border border-stone-200/80">
                <span className="text-stone-500">연동 상태:</span>
                {currentSheetsUrl ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    구글 시트 웹앱 URL 연결됨
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    ⚠️ URL 미설정 (먼저 연동 URL을 등록해 주세요)
                  </span>
                )}
              </div>

              {/* Sync Action Button */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  onClick={handleSyncFromSheets}
                  disabled={syncStatus === 'loading'}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black shadow-md hover:shadow-blue-300 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus === 'loading' ? 'animate-spin' : ''}`} />
                  <span>{syncStatus === 'loading' ? '명렬표 동기화 중...' : '지금 구글 시트에서 명렬표 불러오기'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('guide')}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-blue-200 text-blue-700 text-xs font-bold text-center transition cursor-pointer"
                >
                  시트에 어떻게 적어야 하나요? 📖
                </button>
              </div>

              {/* Status Notice */}
              {syncStatus === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{syncMessage}</span>
                </div>
              )}
              {syncStatus === 'error' && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-900 text-xs font-bold flex items-start gap-2 border border-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p>{syncMessage}</p>
                    <p className="text-[11px] font-normal text-rose-800">
                      💡 <strong>팁:</strong> [시트 작성 가이드] 탭의 지침에 따라 Apps Script를 최신 코드로 재배포했는지 확인해 주세요.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Preview of sync structure */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
              <span className="font-black text-stone-800 block">💡 동기화 원리 요약</span>
              <p className="text-stone-600 leading-relaxed">
                1. 구글 스프레드시트 하단 <strong>[+]</strong> 버튼으로 <strong>'학생명렬표'</strong> 탭을 만듭니다.<br />
                2. 1행에 <strong>학년, 반, 번호, 이름</strong>을 적고 2행부터 학생들을 입력합니다.<br />
                3. 위 파란 버튼을 누르면 브라우저에 학생 명단이 저장되어, 학생들이 로그인할 때 본인 이름이 목록에 뜨거나 번호 입력 시 이름이 자동 완성됩니다!
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Batch Paste (NEIS/Excel) */}
        {activeTab === 'paste' && (
          <div className="space-y-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#123b5d] flex items-center gap-1.5">
                  <ClipboardPaste className="w-4 h-4 text-blue-600" />
                  <span>나이스(NEIS) 또는 엑셀 명단 붙여넣기</span>
                </label>
                <span className="text-[11px] text-stone-500 font-bold">
                  형식: 학년 반 번호 이름
                </span>
              </div>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={`엑셀이나 나이스에서 복사한 학생 명단을 그대로 붙여넣으세요 (Ctrl+V)&#10;&#10;예시:&#10;1  1  1  강민우&#10;1  1  2  김서연&#10;2  3  1  고동현&#10;2  3  2  곽민재`}
                rows={7}
                className="w-full p-3 bg-white text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <button
                  onClick={handleBatchPaste}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  명렬표 일괄 등록하기
                </button>

                {pasteResult && (
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    pasteResult.count > 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {pasteResult.count > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> {pasteResult.count}명의 학생이 성공적으로 등록되었습니다!
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" /> {pasteResult.error}
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Manual Single Student Add Form */}
            <form onSubmit={handleAddSingleStudent} className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2.5">
              <span className="text-xs font-black text-[#123b5d] flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>학생 1명 직접 추가하기</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">학년</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newGrade}
                    onChange={e => setNewGrade(e.target.value)}
                    placeholder="학년"
                    className="w-full text-xs font-bold p-2 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">반</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newClassroom}
                    onChange={e => setNewClassroom(e.target.value)}
                    placeholder="반"
                    className="w-full text-xs font-bold p-2 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">번호</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newNumber}
                    onChange={e => setNewNumber(e.target.value)}
                    placeholder="번호"
                    className="w-full text-xs font-bold p-2 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">이름</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="이름"
                    className="w-full text-xs font-bold p-2 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  학생 추가
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: Registered Student List */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            {/* Filter & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">학급 필터:</span>
                <select
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  className="text-xs font-bold p-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">전체 학급 ({students.length}명)</option>
                  {Object.keys(classBreakdown).map(clsKey => {
                    const match = clsKey.match(/(\d+)학년 (\d+)반/);
                    const val = match ? `${match[1]}-${match[2]}` : clsKey;
                    return (
                      <option key={clsKey} value={val}>
                        {clsKey} ({classBreakdown[clsKey]}명)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToDemo}
                  className="text-xs font-bold text-stone-500 hover:text-stone-800 px-2.5 py-1 rounded-lg hover:bg-stone-200/70 transition cursor-pointer"
                >
                  기본 예시 학생 복원
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('모든 학생 명단을 초기화하시겠습니까?')) {
                      onSaveStudents([]);
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                >
                  전체 삭제
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 sticky top-0 font-black border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">학년</th>
                    <th className="py-2.5 px-3">반</th>
                    <th className="py-2.5 px-3">번호</th>
                    <th className="py-2.5 px-3">이름</th>
                    <th className="py-2.5 px-3 text-right">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s, idx) => (
                      <tr key={`${s.grade}-${s.classroom}-${s.number}-${idx}`} className="hover:bg-stone-50/80">
                        <td className="py-2 px-3 font-bold text-stone-700">{s.grade}학년</td>
                        <td className="py-2 px-3 font-bold text-stone-700">{s.classroom}반</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{s.number}번</td>
                        <td className="py-2 px-3 font-black text-stone-900">{s.name}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400 font-bold">
                        선택된 학급에 등록된 학생이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Visual Step-by-Step Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs text-stone-700">
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 space-y-3">
              <h4 className="font-black text-[#123b5d] text-sm flex items-center gap-1.5">
                <span>📑 구글 스프레드시트 탭 설정 방법 (2분 완성)</span>
              </h4>

              <div className="space-y-2 leading-relaxed text-stone-600">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                  <p>
                    선생님의 구글 스프레드시트 화면 아래쪽의 <strong>[+] (시트 추가)</strong> 버튼을 누릅니다.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                  <p>
                    새로 생긴 시트 탭의 이름을 더블클릭하여 <strong>학생명렬표</strong> 로 변경합니다. (또는 <strong>명렬표</strong>)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                  <p>
                    <strong>1행(헤더)</strong>에 다음과 같이 정확하게 4개 열 제목을 적어주세요:
                  </p>
                </div>
              </div>

              {/* Visual Table Mock */}
              <div className="bg-white rounded-xl border border-amber-300/80 p-2.5 font-mono text-[11px] overflow-x-auto shadow-2xs">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-blue-100 text-blue-950 font-black">
                      <th className="border border-blue-200 py-1.5 px-3">A열</th>
                      <th className="border border-blue-200 py-1.5 px-3">B열</th>
                      <th className="border border-blue-200 py-1.5 px-3">C열</th>
                      <th className="border border-blue-200 py-1.5 px-3">D열</th>
                    </tr>
                    <tr className="bg-amber-100 text-amber-950 font-black">
                      <th className="border border-amber-300 py-1 px-3">학년</th>
                      <th className="border border-amber-300 py-1 px-3">반</th>
                      <th className="border border-amber-300 py-1 px-3">번호</th>
                      <th className="border border-amber-300 py-1 px-3">이름</th>
                    </tr>
                  </thead>
                  <tbody className="text-stone-700">
                    <tr>
                      <td className="border border-stone-200 py-1">1</td>
                      <td className="border border-stone-200 py-1">1</td>
                      <td className="border border-stone-200 py-1">1</td>
                      <td className="border border-stone-200 py-1 font-bold text-stone-900">강민우</td>
                    </tr>
                    <tr>
                      <td className="border border-stone-200 py-1">1</td>
                      <td className="border border-stone-200 py-1">1</td>
                      <td className="border border-stone-200 py-1">2</td>
                      <td className="border border-stone-200 py-1 font-bold text-stone-900">김서연</td>
                    </tr>
                    <tr>
                      <td className="border border-stone-200 py-1">2</td>
                      <td className="border border-stone-200 py-1">3</td>
                      <td className="border border-stone-200 py-1">7</td>
                      <td className="border border-stone-200 py-1 font-bold text-stone-900">김하은</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 leading-relaxed text-stone-600">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black flex items-center justify-center flex-shrink-0 text-[11px]">4</span>
                  <p>
                    나이스(NEIS)의 학생 명렬표를 복사하여 2행부터 그대로 붙여넣으면 됩니다!
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black flex items-center justify-center flex-shrink-0 text-[11px]">5</span>
                  <p>
                    작성 후 [구글 시트 실시간 동기화] 탭에서 <strong>[지금 구글 시트에서 명렬표 불러오기]</strong> 버튼을 누르면 앱에 즉시 반영됩니다!
                  </p>
                </div>
              </div>
            </div>

            {/* Note on Sheet Tab Names */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-stone-600 space-y-1">
              <span className="font-bold text-stone-900">📌 전체 시트 탭 권장 구성:</span>
              <ul className="list-disc list-inside pl-1 space-y-0.5 text-[11px]">
                <li><strong>탭 1: 감사일기_수집</strong> (학생들이 제출한 일기가 실시간으로 1행씩 차곡차곡 쌓입니다)</li>
                <li><strong>탭 2: 학생명렬표</strong> (선생님께서 관리하시는 학생 명단)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer Close */}
        <div className="pt-2 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
