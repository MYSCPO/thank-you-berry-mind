import React, { useState } from 'react';
import { Student } from '../types';
import { getAdminPassword } from '../utils/storage';
import { User, Shield, Sparkles, Check, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  students: Student[];
  onLoginStudent: (student: Student) => void;
  onLoginTeacher: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  students,
  onLoginStudent,
  onLoginTeacher
}) => {
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  // Student manual input
  const [grade, setGrade] = useState('2');
  const [classroom, setClassroom] = useState('3');
  const [number, setNumber] = useState('7');
  const [name, setName] = useState('김하은');

  // Teacher input
  const [password, setPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const student: Student = {
      grade: grade.trim(),
      classroom: classroom.trim(),
      number: number.trim(),
      name: name.trim()
    };
    onLoginStudent(student);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPw = getAdminPassword();
    if (password === correctPw) {
      setTeacherError('');
      onLoginTeacher();
    } else {
      setTeacherError('비밀번호가 일치하지 않습니다. (기본값: admin1234)');
    }
  };

  const selectPresetStudent = (preset: Student) => {
    setGrade(preset.grade);
    setClassroom(preset.classroom);
    setNumber(preset.number);
    setName(preset.name);
    onLoginStudent(preset);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-stone-200 space-y-6">
        {/* App Title & Greeting */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-3xl shadow-inner">
            🍓
          </div>
          <h2 className="text-2xl font-black text-[#123b5d] tracking-tight">
            땡큐베리마인드
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            오늘 나의 마음 날씨를 살피고 감사일기를 기록해요
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="bg-stone-100 p-1 rounded-2xl flex items-center">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setTeacherError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition ${
              role === 'student'
                ? 'bg-white text-[#123b5d] shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>학생 입장</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              setTeacherError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition ${
              role === 'teacher'
                ? 'bg-white text-[#123b5d] shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>선생님 (교사용)</span>
          </button>
        </div>

        {role === 'student' ? (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">학년</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none"
                >
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">반</label>
                <select
                  value={classroom}
                  onChange={e => setClassroom(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(c => (
                    <option key={c} value={String(c)}>
                      {c}반
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">번호</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-500 block mb-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="학생 이름을 입력하세요"
                className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none"
                required
              />
            </div>

            {/* Quick Demo Preset Students */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-stone-400 block mb-1.5">
                빠른 체험용 예시 학생:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => selectPresetStudent({ grade: '2', classroom: '3', number: '7', name: '김하은' })}
                  className="text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 transition"
                >
                  2-3 7번 김하은 (기록 풍부)
                </button>
                <button
                  type="button"
                  onClick={() => selectPresetStudent({ grade: '2', classroom: '3', number: '8', name: '장민서' })}
                  className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 font-bold transition"
                >
                  2-3 8번 장민서
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-[#f16e7e] to-[#e85c6c] text-white shadow-md hover:shadow-rose-300/60 transition cursor-pointer"
            >
              마음 날씨 시작하기 🍓
            </button>
          </form>
        ) : (
          <form onSubmit={handleTeacherSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1">
                선생님 인증 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호 입력 (기본: admin1234)"
                className="w-full text-sm font-bold p-3 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                required
              />
              <span className="text-[11px] text-stone-400 block mt-1">
                체험용 비밀번호: <strong className="text-emerald-700">admin1234</strong>
              </span>
            </div>

            {teacherError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{teacherError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-extrabold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer"
            >
              선생님 대시보드 입장 🌿
            </button>

            <button
              type="button"
              onClick={() => {
                setPassword('admin1234');
                onLoginTeacher();
              }}
              className="w-full py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition"
            >
              원클릭 교사 로그인 바로가기
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
