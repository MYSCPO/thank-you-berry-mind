import React from 'react';
import { QuadrantId } from '../types';
import { QUADRANT_CONFIGS } from '../data/mockData';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface EmotionSelectStepProps {
  quadrantId: QuadrantId;
  selectedEmotion: string | null;
  onSelectEmotion: (emotion: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EmotionSelectStep: React.FC<EmotionSelectStepProps> = ({
  quadrantId,
  selectedEmotion,
  onSelectEmotion,
  onNext,
  onBack
}) => {
  const config = QUADRANT_CONFIGS[quadrantId];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/80 space-y-6">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            STEP 2 · 감정 단어 선택
          </span>
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${config.accentColor}15`, color: config.accentColor }}
          >
            {config.concept} · {config.energyMood}
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-[#123b5d] mt-2 flex items-center gap-2">
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          지금 내 마음의 결에 가장 알맞은 감정 단어 <strong className="text-rose-600">1개</strong>를 골라보세요.
        </p>
      </div>

      {/* Emotion Chips Grid */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/70">
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {config.emotions.map(word => {
            const isSelected = selectedEmotion === word;

            return (
              <button
                key={word}
                onClick={() => onSelectEmotion(word)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#f16e7e] text-white shadow-md shadow-rose-300/50 scale-105 ring-2 ring-rose-400/40'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-rose-300 hover:bg-rose-50/50 shadow-2xs'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{word}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onNext}
          disabled={!selectedEmotion}
          className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition transform active:scale-98 ${
            selectedEmotion
              ? 'bg-gradient-to-r from-[#f16e7e] to-[#e85c6c] text-white hover:shadow-rose-300/60 shadow-md cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>
            {selectedEmotion ? `선택한 마음: "${selectedEmotion}" 확인하기` : '감정 단어를 선택해주세요'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onBack}
          className="w-full py-2.5 text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-stone-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>사분면 다시 고르기</span>
        </button>
      </div>
    </div>
  );
};
