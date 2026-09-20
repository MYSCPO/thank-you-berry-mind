import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

interface GratitudeBridgeStepProps {
  selectedEmotion: string;
  onNext: () => void;
  onBack: () => void;
}

export const GratitudeBridgeStep: React.FC<GratitudeBridgeStepProps> = ({
  selectedEmotion,
  onNext,
  onBack
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-6 text-center">
      {/* Dynamic Bridge Hero Card */}
      <div className="bg-gradient-to-br from-[#123b5d] via-[#1a4d77] to-[#123b5d] text-white rounded-3xl p-7 sm:p-9 shadow-lg relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/20">
            📖
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            내 마음을 충분히 알아챘어요!
          </h2>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 max-w-sm mx-auto">
            <p className="text-sm sm:text-base leading-relaxed text-blue-50 font-medium">
              방금 고른{' '}
              <span className="inline-block px-3 py-1 bg-white text-rose-600 font-extrabold rounded-full shadow-md text-base sm:text-lg mx-1 scale-105">
                {selectedEmotion}
              </span>{' '}
              마음을 안고...
            </p>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-2 font-normal">
              이제 오늘 하루 나에게 고마웠던 순간들을 기록해볼까요?
            </p>
          </div>

          <p className="text-xs text-blue-200/80 font-medium">
            작은 감사가 켜켜이 쌓여 나를 지켜주는 가장 튼튼한 자존감이 됩니다 🌱
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-[#f16e7e] to-[#e85c6c] text-white shadow-lg shadow-rose-300/50 hover:shadow-xl hover:shadow-rose-300/70 transition transform active:scale-98 cursor-pointer"
        >
          <span>감사일기 시작하기 ✍️</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={onBack}
          className="w-full py-2.5 text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-stone-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>이전으로</span>
        </button>
      </div>
    </div>
  );
};
