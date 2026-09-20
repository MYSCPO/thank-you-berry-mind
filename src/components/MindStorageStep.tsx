import React, { useState } from 'react';
import { DiaryEntry, MoodType } from '../types';
import { QUADRANT_CONFIGS } from '../data/mockData';
import { formatShortDate, formatKoreanDate } from '../utils/storage';
import { Calendar, ArrowLeft, Heart, Sun, Award, Trash2 } from 'lucide-react';

interface MindStorageStepProps {
  studentName: string;
  diaries: DiaryEntry[];
  onBackToCalendar: () => void;
  onSelectDiaryToEdit?: (entry: DiaryEntry) => void;
}

export const MindStorageStep: React.FC<MindStorageStepProps> = ({
  studentName,
  diaries,
  onBackToCalendar,
  onSelectDiaryToEdit
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    entry: DiaryEntry;
    x: number;
    y: number;
  } | null>(null);

  // Sort diaries ascending by date for line chart
  const sortedDiaries = [...diaries].sort((a, b) => {
    const da = new Date(a.dateStr || a.timestamp).getTime();
    const db = new Date(b.dateStr || b.timestamp).getTime();
    return da - db;
  });

  // Recent 10 entries for chart to keep clean spacing
  const chartDiaries = sortedDiaries.slice(-10);

  // Map mood type to numeric y value: A=4, B=3, C=2, D=1
  const moodScore: Record<MoodType, number> = {
    'A형': 4,
    'B형': 3,
    'C형': 2,
    'D형': 1
  };

  const scoreToLabel = [
    { score: 4, type: 'A형', label: 'A형 (해 ☀️)', color: '#e69500', bg: '#fff9e6' },
    { score: 3, type: 'B형', label: 'B형 (새싹 🌱)', color: '#2e8b57', bg: '#f0faf0' },
    { score: 2, type: 'C형', label: 'C형 (구름 ☁️)', color: '#e04555', bg: '#fff0f0' },
    { score: 1, type: 'D형', label: 'D형 (빗방울 💧)', color: '#3a72c7', bg: '#eef2ff' }
  ];

  // SVG Chart dimensions
  const svgWidth = 600;
  const svgHeight = 240;
  const paddingLeft = 100;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 60;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getYPos = (score: number) => {
    // score 1 to 4 mapped to plotHeight down to 0
    const ratio = (score - 1) / 3;
    return paddingTop + (1 - ratio) * plotHeight;
  };

  const getXPos = (idx: number, total: number) => {
    if (total <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (idx / (total - 1)) * plotWidth;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 text-lg">
                🍓
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-[#123b5d]">
                  {studentName}의 마음 창고
                </h2>
                <p className="text-xs text-stone-500">
                  내가 기록해 온 마음 날씨와 감사 일기들의 따뜻한 기록입니다.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onBackToCalendar}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#123b5d] hover:bg-[#1a4d77] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>달력으로 돌아가기</span>
          </button>
        </div>

        {/* Line Chart Section */}
        <div className="border border-stone-200 rounded-2xl p-4 bg-[#fdfcfb]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#123b5d] flex items-center gap-1.5">
              <span>📈</span>
              <span>마음 날씨 변화 추이</span>
            </h3>
            <span className="text-[11px] font-medium text-stone-400">
              최근 {chartDiaries.length}일 기록
            </span>
          </div>

          {chartDiaries.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-stone-400">
              아직 기록된 마음 날씨가 없습니다. 달력에서 첫 기록을 남겨보세요!
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-56 min-w-[500px] select-none"
              >
                {/* Horizontal Guide lines and Y-axis labels */}
                {scoreToLabel.map(row => {
                  const y = getYPos(row.score);
                  return (
                    <g key={row.score}>
                      {/* Background horizontal band for soft quadrant indication */}
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      {/* Left Y-axis label */}
                      <text
                        x={paddingLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fontWeight="700"
                        fill={row.color}
                      >
                        {row.label}
                      </text>
                    </g>
                  );
                })}

                {/* Draw connecting line */}
                {chartDiaries.length > 1 && (
                  <path
                    d={chartDiaries
                      .map((d, idx) => {
                        const score = moodScore[d.moodType] || 2;
                        const x = getXPos(idx, chartDiaries.length);
                        const y = getYPos(score);
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#f16e7e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                )}

                {/* Draw points & X-axis dates with 45-degree rotation */}
                {chartDiaries.map((d, idx) => {
                  const score = moodScore[d.moodType] || 2;
                  const x = getXPos(idx, chartDiaries.length);
                  const y = getYPos(score);
                  const cleanDate = formatShortDate(d.dateStr || d.timestamp);

                  const quadrantKey = d.moodType.charAt(0) as 'A' | 'B' | 'C' | 'D';
                  const qConf = QUADRANT_CONFIGS[quadrantKey] || QUADRANT_CONFIGS.B;

                  return (
                    <g key={d.id || idx}>
                      {/* X-axis date (angled 45 degrees for perfect no-overlap readability) */}
                      <text
                        x={x}
                        y={svgHeight - 14}
                        transform={`rotate(-35, ${x}, ${svgHeight - 14})`}
                        textAnchor="end"
                        fontSize="10"
                        fontWeight="600"
                        fill="#64748b"
                      >
                        {cleanDate}
                      </text>

                      {/* Point halo */}
                      <circle
                        cx={x}
                        y={y}
                        r="9"
                        fill={qConf.accentColor}
                        opacity="0.18"
                      />

                      {/* Point marker */}
                      <circle
                        cx={x}
                        y={y}
                        r="5"
                        fill="#ffffff"
                        stroke={qConf.accentColor}
                        strokeWidth="3"
                        className="cursor-pointer transition transform hover:scale-150"
                        onMouseEnter={() => setHoveredPoint({ entry: d, x, y })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-stone-900/90 text-white text-xs rounded-xl p-2.5 shadow-xl border border-white/10"
                  style={{
                    left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                    top: `${(hoveredPoint.y / svgHeight) * 100 - 6}%`
                  }}
                >
                  <div className="font-bold text-[11px] text-amber-300">
                    {formatShortDate(hoveredPoint.entry.dateStr)} ({hoveredPoint.entry.moodType})
                  </div>
                  <div className="font-extrabold text-sm">
                    {hoveredPoint.entry.emotionWord}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diary History List Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-extrabold text-[#123b5d] flex items-center gap-2">
            <span>📚</span>
            <span>나의 감사일기 목록</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
              {diaries.length}개
            </span>
          </h3>
        </div>

        {diaries.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-stone-400 border border-stone-200">
            아직 작성된 감사일기가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {/* Show recent first */}
            {[...diaries].reverse().map(entry => {
              const qKey = (entry.moodType?.charAt(0) || 'B') as 'A' | 'B' | 'C' | 'D';
              const conf = QUADRANT_CONFIGS[qKey] || QUADRANT_CONFIGS.B;

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs hover:shadow-sm transition space-y-3"
                >
                  {/* Top card bar */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{conf.icon}</span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#123b5d]">
                        {formatKoreanDate(entry.dateStr)}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        ({formatShortDate(entry.dateStr)})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs"
                        style={{
                          backgroundColor: `${conf.accentColor}15`,
                          color: conf.accentColor,
                          borderColor: `${conf.accentColor}40`
                        }}
                      >
                        {conf.concept} · {entry.emotionWord}
                      </span>
                    </div>
                  </div>

                  {/* Gratitude Items */}
                  <div className="space-y-2 text-xs sm:text-sm text-stone-700">
                    {entry.gratitude1 && (
                      <div className="flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50">
                        <Heart className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-900 block text-[11px]">몸에게 고마운 점</strong>
                          <span>{entry.gratitude1}</span>
                        </div>
                      </div>
                    )}
                    {entry.gratitude2 && (
                      <div className="flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/50">
                        <Sun className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-900 block text-[11px]">작은 기쁨</strong>
                          <span>{entry.gratitude2}</span>
                        </div>
                      </div>
                    )}
                    {entry.gratitude3 && (
                      <div className="flex items-start gap-2 bg-sky-50/50 p-2.5 rounded-xl border border-sky-200/50">
                        <Award className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-sky-900 block text-[11px]">내가 잘한 점</strong>
                          <span>{entry.gratitude3}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
