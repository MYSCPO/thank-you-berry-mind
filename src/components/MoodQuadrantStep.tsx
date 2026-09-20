import React from 'react';
import { QuadrantId, QuadrantConfig } from '../types';
import { QUADRANT_CONFIGS } from '../data/mockData';
import { formatKoreanDate } from '../utils/storage';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface MoodQuadrantStepProps {
  selectedDate: string;
  selectedQuadrant: QuadrantId | null;
  onSelectQuadrant: (q: QuadrantId) => void;
  onBack: () => void;
}

export const MoodQuadrantStep: React.FC<MoodQuadrantStepProps> = ({
  selectedDate,
  selectedQuadrant,
  onSelectQuadrant,
  onBack
}) => {
  const quadrants: QuadrantConfig[] = [
    QUADRANT_CONFIGS.A,
    QUADRANT_CONFIGS.B,
    QUADRANT_CONFIGS.C,
    QUADRANT_CONFIGS.D
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/80 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            STEP 1 · 무드미터 4분면
          </span>
          <span className="text-xs font-semibold text-stone-500">
            {formatKoreanDate(selectedDate)}
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-[#123b5d] mt-2">
          오늘의 마음 날씨는 어떤가요?
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          지금 내 몸의 에너지와 마음에 느껴지는 기분 상태를 골라보세요.
        </p>
      </div>

      {/* 4 Quadrants Weather Concept Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {quadrants.map(q => {
          const isSelected = selectedQuadrant === q.id;

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuadrant(q.id)}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                q.cardBg
              } ${
                isSelected
                  ? `${q.activeBorder} scale-[1.02]`
                  : `${q.borderColor} hover:border-stone-400/60 hover:shadow-md`
              }`}
            >
              {/* Top Row: Icon & Tag */}
              <div className="flex items-start justify-between w-full mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl sm:text-4xl filter drop-shadow-xs">{q.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-stone-400 tracking-wider block">
                      {q.name}
                    </span>
                    <h3 className="text-base font-extrabold text-[#123b5d]">
                      {q.concept}
                    </h3>
                  </div>
                </div>

                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs whitespace-nowrap bg-white/80"
                  style={{ color: q.accentColor, borderColor: `${q.accentColor}40` }}
                >
                  {q.energyMood}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs font-medium text-stone-600 leading-relaxed mb-2">
                {q.description}
              </p>

              {/* Selection indicator pill */}
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-stone-400 font-medium">단어 {q.emotions.length}개</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    isSelected ? 'bg-white shadow-2xs' : 'text-stone-400 group-hover:text-stone-600'
                  }`}
                  style={isSelected ? { color: q.accentColor } : {}}
                >
                  {isSelected ? '선택됨 ✓' : '선택하기 →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          onClick={onBack}
          className="w-full py-3 text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition hover:bg-stone-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>달력으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
};
