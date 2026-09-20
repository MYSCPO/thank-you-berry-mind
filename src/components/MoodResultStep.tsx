import React, { useMemo } from 'react';
import { QuadrantId } from '../types';
import { QUADRANT_CONFIGS, CHEER_MESSAGES, MEDITATIONS } from '../data/mockData';
import { ArrowLeft, ArrowRight, Sparkles, HeartHandshake, Wind, Bell } from 'lucide-react';

interface MoodResultStepProps {
  quadrantId: QuadrantId;
  selectedEmotion: string;
  onNext: () => void;
  onBack: () => void;
  onOpenBreathingModal: (title: string, durationMin: number, mode?: 'breathing' | 'singingBowl') => void;
}

export const MoodResultStep: React.FC<MoodResultStepProps> = ({
  quadrantId,
  selectedEmotion,
  onNext,
  onBack,
  onOpenBreathingModal
}) => {
  const config = QUADRANT_CONFIGS[quadrantId];

  // Random cheer message cached per view
  const cheerMessage = useMemo(() => {
    const list = CHEER_MESSAGES[config.type];
    return list[Math.floor(Math.random() * list.length)];
  }, [config.type]);

  const meditation = MEDITATIONS[config.type];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/80 space-y-6">
      {/* Header Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
          STEP 3 · 감정 알아차림 & 응원
        </span>
        <span className="text-xs font-bold text-stone-500">
          선택 단어: <strong className="text-rose-600">"{selectedEmotion}"</strong>
        </span>
      </div>

      {/* Main Feedback Box */}
      <div className="space-y-4">
        <div
          className={`p-5 rounded-2xl border ${config.cardBg} ${config.borderColor} text-stone-800 space-y-2`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <h3 className="text-base font-extrabold text-[#123b5d]">
              {config.label} 영역의 마음 상태예요
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            {config.description}
          </p>
        </div>

        {/* Teacher / Berry Encouragement Message */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
          <span className="text-2xl mt-0.5">🍓</span>
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
              선생님과 땡큐베리의 따뜻한 한마디
            </span>
            <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed">
              {cheerMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Mind Care Options: Categorized clearly on this screen! */}
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#123b5d]">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>오늘의 맞춤 마음챙김 명상 선택</span>
          </div>
          <span className="text-[10px] text-stone-500 font-medium">
            원하는 명상 방식을 선택해 보세요
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Option 1: 4-4-4 Calming Breathing */}
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 hover:border-emerald-300 transition shadow-2xs flex flex-col justify-between space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="text-xl p-1.5 rounded-lg bg-emerald-50 text-emerald-700">🌱</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#123b5d]">
                    4-4-4 카밍 호흡법
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    3분
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  숨을 들이마시고 멈추고 내쉬며 긴장을 가라앉혀요
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenBreathingModal(meditation.title, 3, 'breathing')}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>호흡 시작 ▶</span>
            </button>
          </div>

          {/* Option 2: Singing Bowl & Meditation Timer */}
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 hover:border-amber-300 transition shadow-2xs flex flex-col justify-between space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="text-xl p-1.5 rounded-lg bg-amber-50 text-amber-700">🔔</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#123b5d]">
                    싱잉볼 명상 & 타이머
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                    자유 조절
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  맑은 싱잉볼 울림과 침묵 속에 현재 순간에 머물러요
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenBreathingModal('싱잉볼 명상 & 마음 타이머', 3, 'singingBowl')}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>싱잉볼 시작 ▶</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onNext}
          className="w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#a9c8a1] to-[#8eb885] text-white shadow-md shadow-emerald-200 hover:shadow-lg transition transform active:scale-98 cursor-pointer"
        >
          <span>감사일기 쓰러 가기 📖</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onBack}
          className="w-full py-2.5 text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-stone-50 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>감정 단어 다시 고르기</span>
        </button>
      </div>
    </div>
  );
};
