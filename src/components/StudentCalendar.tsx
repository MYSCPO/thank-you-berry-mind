import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, CheckCircle2 } from 'lucide-react';
import { DiaryEntry } from '../types';
import { formatShortDate, getTodayStr } from '../utils/storage';

interface StudentCalendarProps {
  recordedDiaries: DiaryEntry[];
  onSelectDate: (dateStr: string) => void;
  onViewEntry: (entry: DiaryEntry) => void;
}

export const StudentCalendar: React.FC<StudentCalendarProps> = ({
  recordedDiaries,
  onSelectDate,
  onViewEntry
}) => {
  const todayStr = getTodayStr();
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed

  const recordedDateMap = new Map<string, DiaryEntry>();
  recordedDiaries.forEach(d => {
    const clean = formatShortDate(d.dateStr || d.timestamp);
    if (clean) recordedDateMap.set(clean, d);
  });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    // Prevent going too far into future
    if (currentYear > now.getFullYear() || (currentYear === now.getFullYear() && currentMonth >= now.getMonth())) {
      return;
    }
    if (currentMonth === 11) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const now = new Date();
  const isCurrentMonthMax = currentYear >= now.getFullYear() && currentMonth >= now.getMonth();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <CalIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[#123b5d]">마음 날씨 달력</h2>
              <p className="text-xs text-stone-500">날짜를 클릭해서 그날의 마음 날씨를 기록해보세요</p>
            </div>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
            총 {recordedDiaries.length}일 기록 완료 🍓
          </div>
        </div>

        {/* Month Header Nav */}
        <div className="flex items-center justify-between bg-stone-50/80 rounded-2xl p-2.5 mb-4 border border-stone-200/60">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-white text-stone-700 transition shadow-xs"
            title="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-base font-extrabold text-[#123b5d]">
            {currentYear}년 {currentMonth + 1}월
          </div>
          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonthMax}
            className={`p-2 rounded-xl transition shadow-xs ${
              isCurrentMonthMax
                ? 'opacity-30 cursor-not-allowed text-stone-400'
                : 'hover:bg-white text-stone-700'
            }`}
            title="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((dow, idx) => (
            <div
              key={dow}
              className={`text-xs font-bold py-1.5 ${
                idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-sky-600' : 'text-stone-400'
              }`}
            >
              {dow}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-14 rounded-2xl bg-transparent" />;
            }

            const mStr = String(currentMonth + 1).padStart(2, '0');
            const dStr = String(day).padStart(2, '0');
            const dateStr = `${currentYear}-${mStr}-${dStr}`;

            const thisDate = new Date(currentYear, currentMonth, day);
            thisDate.setHours(0, 0, 0, 0);

            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            const isToday = dateStr === todayStr;
            const isFuture = thisDate > todayDate;
            const existingEntry = recordedDateMap.get(dateStr);

            return (
              <button
                key={dateStr}
                disabled={isFuture}
                onClick={() => {
                  if (existingEntry) {
                    onViewEntry(existingEntry);
                  } else {
                    onSelectDate(dateStr);
                  }
                }}
                className={`relative h-14 sm:h-16 rounded-2xl p-1.5 flex flex-col items-center justify-between border transition-all ${
                  isFuture
                    ? 'bg-stone-100/50 border-stone-200/50 text-stone-300 cursor-not-allowed'
                    : existingEntry
                    ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400 text-[#123b5d] shadow-xs cursor-pointer'
                    : isToday
                    ? 'bg-blue-50/60 border-blue-300 hover:border-blue-500 text-blue-900 font-bold shadow-xs cursor-pointer'
                    : 'bg-white hover:bg-emerald-50/40 border-stone-200 hover:border-emerald-300 text-stone-700 cursor-pointer shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full px-1">
                  <span
                    className={`text-xs font-bold leading-none ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center -mt-0.5 -ml-0.5'
                        : ''
                    }`}
                  >
                    {day}
                  </span>
                  {existingEntry && (
                    <span className="text-[10px] text-rose-500 font-black">완료</span>
                  )}
                </div>

                <div className="w-full flex items-center justify-center pb-1">
                  {existingEntry ? (
                    <div className="flex items-center gap-0.5 text-xs font-semibold text-rose-600">
                      <span>🍓</span>
                      <span className="text-[10px] hidden sm:inline truncate max-w-[42px]">
                        {existingEntry.emotionWord}
                      </span>
                    </div>
                  ) : isToday ? (
                    <span className="text-[11px] text-blue-600 font-medium">오늘 기록</span>
                  ) : !isFuture ? (
                    <span className="text-[10px] text-stone-300 group-hover:text-emerald-500">+</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend Card */}
      <div className="bg-[#a9c8a1]/15 border border-[#a9c8a1]/40 rounded-2xl p-3.5 text-xs text-[#123b5d] flex flex-wrap items-center justify-around gap-2 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🍓</span>
          <span>기록한 날 (클릭 시 보기)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center">●</span>
          <span>오늘</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-white border border-stone-300"></span>
          <span>기록 가능한 날</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-stone-200"></span>
          <span>미래 (기록 불가)</span>
        </div>
      </div>
    </div>
  );
};
