import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles, Heart, Sun, Award } from 'lucide-react';
import { formatKoreanDate } from '../utils/storage';

interface GratitudeFormStepProps {
  selectedDate: string;
  selectedEmotion: string;
  onSubmit: (gratitudes: { g1: string; g2: string; g3: string }) => void;
  onBack: () => void;
  initialValues?: { g1: string; g2: string; g3: string };
}

export const GratitudeFormStep: React.FC<GratitudeFormStepProps> = ({
  selectedDate,
  selectedEmotion,
  onSubmit,
  onBack,
  initialValues
}) => {
  const [g1, setG1] = useState(initialValues?.g1 || '');
  const [g2, setG2] = useState(initialValues?.g2 || '');
  const [g3, setG3] = useState(initialValues?.g3 || '');

  const hasAtLeastOne = g1.trim().length > 0 || g2.trim().length > 0 || g3.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAtLeastOne) return;
    onSubmit({ g1: g1.trim(), g2: g2.trim(), g3: g3.trim() });
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/80 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            STEP 4 · 감사일기 쓰기
          </span>
          <span className="text-xs font-semibold text-stone-500">
            {formatKoreanDate(selectedDate)}
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-[#123b5d] mt-2">
          오늘 하루 나를 위한 세 가지 감사
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          3가지 중 <strong className="text-rose-600">최소 1개 이상</strong> 자유롭게 적어보세요. 사소한 것도 큰 힘이 됩니다.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item 1: Body / Health */}
        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-2">
          <label className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-950">
            <span className="p-1 rounded-lg bg-amber-200/70 text-amber-800">
              <Heart className="w-3.5 h-3.5" />
            </span>
            <span>① 오늘 나의 몸(건강)에게 고마운 점</span>
          </label>
          <textarea
            value={g1}
            onChange={e => setG1(e.target.value)}
            placeholder="예: 푹 자고 개운하게 일어난 눈, 학교까지 씩씩하게 걸어준 두 다리에게 고마워..."
            rows={2}
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-amber-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
          />
        </div>

        {/* Item 2: Small Joy */}
        <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 space-y-2">
          <label className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-emerald-950">
            <span className="p-1 rounded-lg bg-emerald-200/70 text-emerald-800">
              <Sun className="w-3.5 h-3.5" />
            </span>
            <span>② 오늘 나를 기쁘게 한 작은 일</span>
          </label>
          <textarea
            value={g2}
            onChange={e => setG2(e.target.value)}
            placeholder="예: 점심 급식에 좋아하는 반찬이 나온 일, 친구와 나누며 웃었던 대화..."
            rows={2}
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-emerald-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
          />
        </div>

        {/* Item 3: Achievement / Self-Praise */}
        <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-200/70 space-y-2">
          <label className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-sky-950">
            <span className="p-1 rounded-lg bg-sky-200/70 text-sky-800">
              <Award className="w-3.5 h-3.5" />
            </span>
            <span>③ 오늘 내가 잘한 점 (나에게 칭찬 한마디)</span>
          </label>
          <textarea
            value={g3}
            onChange={e => setG3(e.target.value)}
            placeholder="예: 어려운 수학 문제를 포기하지 않고 푼 것, 친구에게 먼저 양보한 것..."
            rows={2}
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-sky-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
          />
        </div>

        {/* Validation hint */}
        <div className="text-right text-[11px] font-medium">
          {hasAtLeastOne ? (
            <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>작성 완료! 일기를 저장할 수 있어요.</span>
            </span>
          ) : (
            <span className="text-stone-400">
              최소 1문항 이상 작성하면 저장 버튼이 활성화됩니다.
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={!hasAtLeastOne}
            className={`w-full py-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition transform active:scale-98 ${
              hasAtLeastOne
                ? 'bg-gradient-to-r from-[#f16e7e] to-[#e85c6c] text-white hover:shadow-rose-300/60 cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <span>감사일기 저장 & 명언 선물 받기 🍓</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-stone-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>이전으로</span>
          </button>
        </div>
      </form>
    </div>
  );
};
