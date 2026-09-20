import React from 'react';
import { Student } from '../types';
import { Sparkles, LogOut, UserCheck, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentStudent: Student | null;
  isTeacher: boolean;
  onLogout: () => void;
  onOpenTeacher?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStudent,
  isTeacher,
  onLogout,
  onOpenTeacher
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#123b5d] text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-rose-400/30 flex items-center justify-center text-lg shadow-inner">
            🍓
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight flex items-center gap-1.5">
              <span>땡큐베리마인드</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30">
                v5 마음챙김
              </span>
            </h1>
            <p className="text-[11px] text-blue-200/70 font-medium">
              THANK YOU VERY MIND · 중학생 자존감 향상 마음 웹앱
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isTeacher ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-lg text-emerald-200 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5" />
                교사용 대시보드
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white/90"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>나가기</span>
              </button>
            </div>
          ) : currentStudent ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white/95">
                  {currentStudent.grade}학년 {currentStudent.classroom}반 {currentStudent.number}번
                </span>
                <span className="text-[11px] text-emerald-200 font-medium">
                  {currentStudent.name} 학생
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white/90"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            onOpenTeacher && (
              <button
                onClick={onOpenTeacher}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-medium transition border border-emerald-400/30"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>교사 로그인</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
