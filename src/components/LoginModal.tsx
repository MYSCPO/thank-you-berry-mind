import React, { useState, useMemo, useEffect } from 'react';
import { Student } from '../types';
import { getAdminPassword } from '../utils/storage';
import { AlertCircle } from 'lucide-react';

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
  const [grade, setGrade] = useState(() => (students[0]?.grade || '1'));
  const [classroom, setClassroom] = useState(() => (students[0]?.classroom || '1'));
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');

  // Auto-adjust grade & classroom when students prop changes
  useEffect(() => {
    if (students.length > 0) {
      const grades = Array.from(new Set(students.map(s => s.grade))).sort();
      if (!grades.includes(grade) && grades[0]) {
        setGrade(grades[0]);
      }
    }
  }, [students, grade]);

  // Available grades across all registered students
  const availableGrades = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.grade))).sort();
    return grades.length > 0 ? grades : ['1', '2', '3'];
  }, [students]);

  // Available classes for current grade
  const availableClasses = useMemo(() => {
    const classes = Array.from(
      new Set(students.filter(s => s.grade === grade).map(s => s.classroom))
    ).sort((a, b) => Number(a) - Number(b));
    return classes.length > 0 ? classes : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  }, [students, grade]);

  // Available numbers: from class roster or standard 1~35 list
  const availableNumbers = useMemo(() => {
    const classStudents = students.filter(s => s.grade === grade && s.classroom === classroom);
    const numbersFromRoster = classStudents.map(s => Number(s.number)).filter(n => !isNaN(n) && n > 0);
    const maxNum = numbersFromRoster.length > 0 ? Math.max(35, ...numbersFromRoster) : 35;
    return Array.from({ length: maxNum }, (_, i) => String(i + 1));
  }, [students, grade, classroom]);

  // Handle number select change
  const handleNumberSelect = (val: string) => {
    setNumber(val);
    // If student exists in roster with matching grade, classroom, and number, auto-populate name
    const found = students.find(
      s => s.grade === grade && s.classroom === classroom && s.number === val
    );
    if (found) {
      setName(found.name);
    }
  };

  // Teacher input
  const [password, setPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const student: Student = {
      grade: grade.trim() || '1',
      classroom: classroom.trim() || '1',
      number: number.trim() || '1',
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
      setTeacherError('비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-xl border border-stone-200/80">
        {/* App Title & Greeting */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl mb-3 shadow-xs">
            🍓
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#123b5d] tracking-tight mb-2">
            땡큐베리마인드
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
            오늘의 마음 날씨를 기록하고<br />
            감사의 씨앗을 키워보세요
          </p>

          {/* Sprout divider */}
          <div className="flex items-center justify-center my-4">
            <div className="h-px bg-stone-200 w-16"></div>
            <span className="px-2 text-base">🌱</span>
            <div className="h-px bg-stone-200 w-16"></div>
          </div>
        </div>

        {/* Role Toggle Tabs */}
        <div className="bg-[#f0f3f4] p-1 rounded-2xl flex items-center mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setTeacherError('');
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center ${
              role === 'student'
                ? 'bg-white text-[#123b5d] shadow-sm'
                : 'text-stone-400 hover:text-stone-600 font-medium'
            }`}
          >
            <span>학생 로그인</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              setTeacherError('');
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center ${
              role === 'teacher'
                ? 'bg-white text-[#123b5d] shadow-sm'
                : 'text-stone-400 hover:text-stone-600 font-medium'
            }`}
          >
            <span>교사 로그인</span>
          </button>
        </div>

        {role === 'student' ? (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            {/* Grade · Class · Number */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-[#123b5d] block mb-2">
                학년 · 반 · 번호
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Grade Select */}
                <select
                  value={grade}
                  onChange={e => {
                    const newGrade = e.target.value;
                    setGrade(newGrade);
                    const classes = Array.from(
                      new Set(students.filter(s => s.grade === newGrade).map(s => s.classroom))
                    );
                    if (classes.length > 0 && !classes.includes(classroom)) {
                      setClassroom(classes[0]);
                    }
                  }}
                  className="w-full text-xs sm:text-sm font-medium p-3 rounded-xl border border-stone-200 bg-white text-stone-700 focus:ring-2 focus:ring-rose-400 focus:outline-none min-h-[46px]"
                >
                  {availableGrades.map(g => (
                    <option key={g} value={g}>
                      {g}학년
                    </option>
                  ))}
                </select>

                {/* Class Select */}
                <select
                  value={classroom}
                  onChange={e => setClassroom(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium p-3 rounded-xl border border-stone-200 bg-white text-stone-700 focus:ring-2 focus:ring-rose-400 focus:outline-none min-h-[46px]"
                >
                  {availableClasses.map(c => (
                    <option key={c} value={c}>
                      {c}반
                    </option>
                  ))}
                </select>

                {/* Number Select */}
                <select
                  value={number}
                  onChange={e => handleNumberSelect(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium p-3 rounded-xl border border-stone-200 bg-white text-stone-700 focus:ring-2 focus:ring-rose-400 focus:outline-none min-h-[46px]"
                >
                  <option value="">번호</option>
                  {availableNumbers.map(n => (
                    <option key={n} value={n}>
                      {n}번
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-[#123b5d] block mb-2">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full text-xs sm:text-sm font-medium p-3.5 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 focus:ring-2 focus:ring-rose-400 focus:outline-none min-h-[46px]"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 rounded-2xl font-bold text-base bg-[#f05c6d] hover:bg-[#e84b5d] text-white shadow-lg shadow-rose-200/80 transition cursor-pointer min-h-[48px] mt-2"
            >
              기록 시작하기 🍓
            </button>

            {/* Encouraging Note Card */}
            <div className="bg-[#edf7ee] border border-[#d6ebd8] p-3.5 sm:p-4 rounded-2xl text-center space-y-1 mt-5">
              <p className="text-xs font-semibold text-stone-700 flex items-center justify-center gap-1">
                <span>🌱</span> 작은 기록이 쌓여 긍정적인 마음과 자존감을 키워줘요
              </p>
              <p className="text-[11px] text-stone-500">
                선생님도 우리 반의 마음 날씨를 함께 살펴볼 거예요 :)
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleTeacherSubmit} className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-bold text-[#123b5d] block mb-2">
                교사 인증 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호 입력 (초기: admin1234)"
                className="w-full text-sm font-bold p-3.5 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none min-h-[46px]"
                required
              />
              <span className="text-[11px] text-stone-400 block mt-1.5">
                초기 비밀번호: <strong className="text-emerald-700">admin1234</strong> (로그인 후 비밀번호 변경 가능)
              </span>
            </div>

            {teacherError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{teacherError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/80 transition cursor-pointer min-h-[48px] mt-2"
            >
              선생님 대시보드 입장 🌿
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
