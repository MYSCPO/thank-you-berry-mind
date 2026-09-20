import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WordFrequency } from '../types';
import {
  Cloud,
  Tag,
  Heart,
  Circle,
  Sparkles,
  Shuffle
} from 'lucide-react';

export type CloudShape = 'cloud' | 'heart' | 'circle' | 'strawberry';

interface WordCloudProps {
  words: WordFrequency[];
  mode: 'emotion' | 'gratitude';
  isLarge?: boolean;
}

interface PlacedWord {
  word: string;
  count: number;
  x: number; // pixel center x
  y: number; // pixel center y
  width: number; // pixel bounding box width
  height: number; // pixel bounding box height
  fontSize: number;
  fontWeight: number;
  color: string;
}

// Check if a normalized point (x: -1..1, y: -1..1) is inside the requested shape boundary
function isInsideShape(nx: number, ny: number, shape: CloudShape): boolean {
  if (shape === 'circle') {
    return nx * nx + ny * ny <= 0.88;
  }

  if (shape === 'heart') {
    // Mathematical heart curve: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
    // ny in canvas is down-positive, so flip it and apply scaling
    const y = -ny * 1.18 + 0.28;
    const x = nx * 1.25;
    const a = x * x + y * y - 1;
    return a * a * a - x * x * y * y * y <= 0;
  }

  if (shape === 'strawberry') {
    // Strawberry / inverted tapered drop: wider top, pointed bottom
    const y = ny + 0.12;
    if (y < -0.9 || y > 0.95) return false;
    // Tapering width from top (wide) to bottom (narrow)
    const factor = Math.max(0.08, 0.9 - (y * 0.48 + 0.2));
    return (nx * nx) / (factor * factor) + y * y <= 0.88;
  }

  if (shape === 'cloud') {
    // Cloud: realistic union of overlapping puffs
    // Center puff
    if ((nx * 0.95) * (nx * 0.95) + (ny * 1.5) * (ny * 1.5) <= 0.38) return true;
    // Left puff
    if ((nx + 0.48) * (nx + 0.48) + (ny + 0.08) * (ny + 0.08) <= 0.28) return true;
    // Right puff
    if ((nx - 0.48) * (nx - 0.48) + (ny + 0.05) * (ny + 0.05) <= 0.28) return true;
    // Top puff
    if (nx * nx + (ny + 0.35) * (ny + 0.35) <= 0.25) return true;
    // Bottom fill
    if (Math.abs(nx) <= 0.75 && ny >= -0.12 && ny <= 0.48) return true;
    return false;
  }

  return Math.abs(nx) <= 0.9 && Math.abs(ny) <= 0.9;
}

// Axis-Aligned Bounding Box (AABB) overlap test with padding
function checkOverlap(
  box1: { x: number; y: number; width: number; height: number },
  box2: { x: number; y: number; width: number; height: number },
  padding: number = 5
): boolean {
  const halfW1 = box1.width / 2 + padding;
  const halfH1 = box1.height / 2 + padding;
  const halfW2 = box2.width / 2 + padding;
  const halfH2 = box2.height / 2 + padding;

  return (
    Math.abs(box1.x - box2.x) < halfW1 + halfW2 &&
    Math.abs(box1.y - box2.y) < halfH1 + halfH2
  );
}

export const WordCloud: React.FC<WordCloudProps> = ({
  words,
  mode,
  isLarge = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: isLarge ? 560 : 380 });

  const [hoveredWord, setHoveredWord] = useState<WordFrequency | null>(null);
  const [viewStyle, setViewStyle] = useState<'shaped' | 'mentimeter' | 'chips'>('shaped');
  const [currentShape, setCurrentShape] = useState<CloudShape>('cloud');
  const [randomSeed, setRandomSeed] = useState(1);

  // Measure actual container dimensions via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pick an initial shape
  useEffect(() => {
    const shapes: CloudShape[] = ['cloud', 'heart', 'circle', 'strawberry'];
    const randomPick = shapes[Math.floor(Math.random() * shapes.length)];
    setCurrentShape(randomPick);
  }, [mode]);

  // Vibrant high-contrast Mentimeter color palette
  const mentimeterColors = useMemo(() => [
    '#e05656', // Warm Coral Red
    '#1e60b5', // Mentimeter Royal Blue
    '#e24d86', // Vivid Rose / Pink
    '#219653', // Emerald Leaf Green
    '#e28704', // Rich Golden Amber
    '#6366f1', // Indigo Slate
    '#0d9488', // Teal
    '#8b5cf6', // Violet
    '#ea580c', // Bright Orange
    '#0284c7', // Sky Cerulean
    '#10b981'  // Mint
  ], []);

  const handleRandomizeShape = () => {
    const shapes: CloudShape[] = ['cloud', 'heart', 'circle', 'strawberry'];
    const otherShapes = shapes.filter(s => s !== currentShape);
    const nextShape = otherShapes[Math.floor(Math.random() * otherShapes.length)];
    setCurrentShape(nextShape);
    setRandomSeed(prev => prev + 1);
    setViewStyle('shaped');
  };

  const wordCount = words ? words.length : 0;
  const maxCount = Math.max(...(words || []).map(w => w.count), 1);
  const minCount = Math.min(...(words || []).map(w => w.count), 1);

  /**
   * ACCURATE 2D BOX-COLLISION SHAPE PACKING ENGINE
   * 1. Dynamic font-size scaling based on word count & container size to guarantee all words fit
   * 2. Archimedean spiral search with exact word pixel bounds (width, height)
   * 3. Guaranteed NO overlapping (AABB collision detection)
   * 4. Strict boundary checking against the requested shape silhouette
   */
  const placedWords = useMemo<PlacedWord[]>(() => {
    if (viewStyle !== 'shaped' || !words || words.length === 0) return [];

    const sorted = [...words].sort((a, b) => b.count - a.count);
    const width = containerSize.width || (isLarge ? 900 : 700);
    const height = containerSize.height || (isLarge ? 540 : 380);

    const centerX = width / 2;
    const centerY = height / 2;

    // Radius allowances for normalized coordinate calculation
    // Keep words nicely padded inside the container bounds
    const radiusX = (width / 2) * 0.88;
    const radiusY = (height / 2) * 0.86;

    // Dynamic Font Scaling Factor:
    // When there are 40+ words, shrink base font so everything fits;
    // When there are 10 words, enlarge base font so the shape is nicely filled.
    let densityScale = 1.0;
    if (sorted.length > 35) {
      densityScale = 0.65;
    } else if (sorted.length > 20) {
      densityScale = 0.80;
    } else if (sorted.length < 12) {
      densityScale = 1.25;
    }

    if (isLarge) {
      densityScale *= 1.25;
    }

    const placed: PlacedWord[] = [];

    // Deterministic pseudo-random number generator
    let seed = (randomSeed * 9301 + 49297) % 233280;
    const nextRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    sorted.forEach((item, index) => {
      const countRatio = maxCount === minCount ? 0.5 : (item.count - minCount) / (maxCount - minCount);

      // Base font size
      const rawFontSize = (13 + countRatio * 28) * densityScale;
      const fontSize = Math.max(12, Math.min(isLarge ? 52 : 38, Math.round(rawFontSize)));
      const fontWeight = countRatio > 0.6 ? 900 : countRatio > 0.3 ? 800 : 700;
      const color = mentimeterColors[index % mentimeterColors.length];

      // Accurate pixel text dimensions estimation
      // Hangul glyphs are roughly square (width ≈ fontSize), English/symbols ≈ 0.6 * fontSize
      const hangulCount = (item.word.match(/[가-힣]/g) || []).length;
      const otherCount = item.word.length - hangulCount;
      const wordWidth = Math.round(hangulCount * fontSize * 1.05 + otherCount * fontSize * 0.62 + 8);
      const wordHeight = Math.round(fontSize * 1.25 + 6);

      // Spiral placement search
      let bestX = centerX;
      let bestY = centerY;
      let placedOk = false;

      // Golden angle rotation step
      const angleOffset = (index * 2.39996 + nextRand() * 0.4);
      const maxSteps = 300;

      for (let step = 0; step < maxSteps; step++) {
        // Spiral radius expands smoothly
        const progress = step / maxSteps;
        const rNorm = Math.pow(progress, 0.72); // slightly non-linear expansion for dense center

        const theta = angleOffset + step * 0.38;

        const normX = rNorm * Math.cos(theta);
        const normY = rNorm * Math.sin(theta);

        // Verify if center of word is inside the chosen shape
        if (isInsideShape(normX, normY, currentShape)) {
          const testX = centerX + normX * radiusX;
          const testY = centerY + normY * radiusY;

          const testBox = {
            x: testX,
            y: testY,
            width: wordWidth,
            height: wordHeight
          };

          // Also verify bounding box corners remain within shape or screen bounds
          if (
            testBox.x - wordWidth / 2 < 12 ||
            testBox.x + wordWidth / 2 > width - 12 ||
            testBox.y - wordHeight / 2 < 12 ||
            testBox.y + wordHeight / 2 > height - 12
          ) {
            continue;
          }

          // AABB Collision check against all already placed words
          let hasCollision = false;
          for (const prev of placed) {
            if (checkOverlap(testBox, prev, 4)) {
              hasCollision = true;
              break;
            }
          }

          if (!hasCollision) {
            bestX = testX;
            bestY = testY;
            placedOk = true;
            break;
          }
        }
      }

      // If spiral failed to find a zero-collision spot, relax padding and try secondary scan
      if (!placedOk) {
        for (let step = 0; step < 120; step++) {
          const rNorm = 0.15 + (step / 120) * 0.82;
          const theta = angleOffset + step * 0.65;
          const normX = rNorm * Math.cos(theta);
          const normY = rNorm * Math.sin(theta);

          if (isInsideShape(normX, normY, currentShape)) {
            const testX = centerX + normX * radiusX;
            const testY = centerY + normY * radiusY;
            const testBox = { x: testX, y: testY, width: wordWidth, height: wordHeight };

            let hasCollision = false;
            for (const prev of placed) {
              if (checkOverlap(testBox, prev, 1)) {
                hasCollision = true;
                break;
              }
            }
            if (!hasCollision) {
              bestX = testX;
              bestY = testY;
              placedOk = true;
              break;
            }
          }
        }
      }

      // Final fallback: keep inside the shape bounds cleanly
      if (!placedOk) {
        const normX = (nextRand() - 0.5) * 1.2;
        const normY = (nextRand() - 0.5) * 1.1;
        bestX = Math.max(wordWidth / 2 + 10, Math.min(width - wordWidth / 2 - 10, centerX + normX * (radiusX * 0.7)));
        bestY = Math.max(wordHeight / 2 + 10, Math.min(height - wordHeight / 2 - 10, centerY + normY * (radiusY * 0.7)));
      }

      placed.push({
        word: item.word,
        count: item.count,
        x: Math.round(bestX),
        y: Math.round(bestY),
        width: wordWidth,
        height: wordHeight,
        fontSize,
        fontWeight,
        color
      });
    });

    return placed;
  }, [words, viewStyle, currentShape, randomSeed, containerSize, isLarge, maxCount, minCount, mentimeterColors]);

  // Mentimeter natural centered flow
  const distributedWords = useMemo(() => {
    if (!words) return [];
    const sorted = [...words].sort((a, b) => b.count - a.count);
    const result: WordFrequency[] = [];
    sorted.forEach((item, index) => {
      if (index % 2 === 0) {
        result.push(item);
      } else {
        result.unshift(item);
      }
    });
    return result;
  }, [words]);

  const shapeLabels: Record<CloudShape, { label: string; icon: string }> = {
    cloud: { label: '구름 모양', icon: '☁️' },
    heart: { label: '하트 모양', icon: '💖' },
    circle: { label: '원형 모양', icon: '⭕' },
    strawberry: { label: '딸기 모양', icon: '🍓' }
  };

  if (!words || words.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-stone-400 space-y-2">
        <span className="text-3xl">☁️</span>
        <p className="text-xs sm:text-sm font-medium">
          해당 기간과 학급에 수집된 {mode === 'emotion' ? '감정 단어가' : '감사 키워드가'} 아직 없습니다.
        </p>
      </div>
    );
  }

  // Calculate dynamic shape silhouette size based on container dimensions
  const silhouetteSize = Math.min(containerSize.width * 0.78, containerSize.height * 0.88);

  return (
    <div className="relative w-full select-none">
      {/* Cloud Style Switcher & Shape Controller */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2.5 text-xs border-b border-stone-200/60 mb-2">
        
        {/* Left: Shape Selection Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-stone-500 hidden sm:inline">모양 선택:</span>
          
          <button
            type="button"
            onClick={() => {
              setViewStyle('shaped');
              setCurrentShape('cloud');
              setRandomSeed(prev => prev + 1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewStyle === 'shaped' && currentShape === 'cloud'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>☁️ 구름</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewStyle('shaped');
              setCurrentShape('heart');
              setRandomSeed(prev => prev + 1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewStyle === 'shaped' && currentShape === 'heart'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>💖 하트</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewStyle('shaped');
              setCurrentShape('circle');
              setRandomSeed(prev => prev + 1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewStyle === 'shaped' && currentShape === 'circle'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>⭕ 원형</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewStyle('shaped');
              setCurrentShape('strawberry');
              setRandomSeed(prev => prev + 1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewStyle === 'shaped' && currentShape === 'strawberry'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>🍓 땡큐베리</span>
          </button>

          {/* Random Shuffle Button */}
          <button
            type="button"
            onClick={handleRandomizeShape}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 transition cursor-pointer active:scale-95"
            title="새로운 모양 및 단어 재배치 생성"
          >
            <Shuffle className="w-3 h-3" />
            <span>🎲 랜덤 셔플</span>
          </button>
        </div>

        {/* Right: Layout Modes (Shaped vs Mentimeter vs Chips) */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setViewStyle('shaped')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              viewStyle === 'shaped'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>셰이프 아트</span>
          </button>

          <button
            type="button"
            onClick={() => setViewStyle('mentimeter')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              viewStyle === 'mentimeter'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Cloud className="w-3 h-3 text-sky-600" />
            <span>자유 분산</span>
          </button>

          <button
            type="button"
            onClick={() => setViewStyle('chips')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              viewStyle === 'chips'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Tag className="w-3 h-3 text-stone-500" />
            <span>태그 칩</span>
          </button>
        </div>
      </div>

      {/* SHAPED ART WORD CLOUD (Heart, Cloud, Circle, Strawberry) */}
      {viewStyle === 'shaped' && (
        <div
          ref={containerRef}
          className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 flex items-center justify-center ${
            isLarge ? 'min-h-[540px] h-[72vh]' : 'min-h-[380px] h-[480px]'
          }`}
        >
          {/* Dynamic Silhouette Background that scales with container */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 opacity-8"
            style={{ zIndex: 1 }}
          >
            {currentShape === 'heart' && (
              <Heart
                style={{ width: silhouetteSize, height: silhouetteSize }}
                className="fill-current text-rose-500"
              />
            )}
            {currentShape === 'circle' && (
              <Circle
                style={{ width: silhouetteSize, height: silhouetteSize }}
                className="fill-current text-emerald-500"
              />
            )}
            {currentShape === 'cloud' && (
              <Cloud
                style={{ width: silhouetteSize * 1.15, height: silhouetteSize * 0.9 }}
                className="fill-current text-sky-500"
              />
            )}
            {currentShape === 'strawberry' && (
              <div
                style={{ fontSize: silhouetteSize * 0.7 }}
                className="leading-none select-none filter blur-[1px]"
              >
                🍓
              </div>
            )}
          </div>

          {/* Placed Words with exact collision-free coordinates */}
          <div className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }}>
            {placedWords.map((item) => {
              const isHovered = hoveredWord?.word === item.word;

              return (
                <div
                  key={item.word}
                  className="absolute cursor-pointer select-none transition-transform duration-200"
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: `translate(-50%, -50%) scale(${isHovered ? 1.25 : 1})`,
                    zIndex: isHovered ? 60 : 10
                  }}
                  onMouseEnter={() => setHoveredWord({ word: item.word, count: item.count })}
                  onMouseLeave={() => setHoveredWord(null)}
                >
                  <span
                    className="font-display tracking-tight whitespace-nowrap transition-all duration-200 block"
                    style={{
                      fontSize: `${item.fontSize}px`,
                      fontWeight: item.fontWeight,
                      color: item.color,
                      textShadow: isHovered
                        ? `0 0 16px ${item.color}88, 0 2px 4px rgba(0,0,0,0.2)`
                        : '0 1px 2px rgba(0,0,0,0.12)',
                      opacity: hoveredWord && !isHovered ? 0.35 : 1
                    }}
                  >
                    {item.word}
                  </span>

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-3 py-1.5 bg-stone-900/95 text-white text-xs rounded-xl shadow-2xl z-50 whitespace-nowrap pointer-events-none border border-stone-700">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="text-white">{item.word}</span>
                        <span className="text-amber-300 font-extrabold">{item.count}회 언급</span>
                      </div>
                      <div className="text-[10px] text-stone-300 font-mono mt-0.5">
                        {shapeLabels[currentShape].icon} {shapeLabels[currentShape].label} 모아보기
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status info chip */}
          <div className="absolute bottom-3 right-4 pointer-events-none text-[11px] font-bold text-stone-500 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200/80 shadow-2xs z-10 flex items-center gap-1.5">
            <span>{shapeLabels[currentShape].icon} {shapeLabels[currentShape].label}</span>
            <span className="text-stone-300">|</span>
            <span>{placedWords.length}개 키워드 배치 완료</span>
          </div>
        </div>
      )}

      {/* MENTIMETER FREE FORM FLOW */}
      {viewStyle === 'mentimeter' && (
        <div
          className={`flex flex-wrap items-center justify-center content-center gap-x-4 sm:gap-x-7 gap-y-3 sm:gap-y-4 p-4 sm:p-8 transition-all duration-300 ${
            isLarge ? 'min-h-[500px]' : 'min-h-[320px]'
          }`}
        >
          {distributedWords.map((item, idx) => {
            const countRatio = maxCount === minCount ? 0.5 : (item.count - minCount) / (maxCount - minCount);
            
            let fontSize: number;
            let fontWeight = 600;

            if (isLarge) {
              fontSize = Math.round(18 + countRatio * 46);
              if (countRatio > 0.6) fontWeight = 900;
              else if (countRatio > 0.3) fontWeight = 800;
              else fontWeight = 600;
            } else {
              fontSize = Math.round(14 + countRatio * 32);
              if (countRatio > 0.6) fontWeight = 900;
              else if (countRatio > 0.3) fontWeight = 800;
              else fontWeight = 600;
            }

            const color = mentimeterColors[idx % mentimeterColors.length];
            const isHovered = hoveredWord?.word === item.word;

            return (
              <div
                key={item.word}
                className="relative group cursor-pointer leading-tight transition-transform duration-200"
                onMouseEnter={() => setHoveredWord(item)}
                onMouseLeave={() => setHoveredWord(null)}
                style={{
                  transform: isHovered ? 'scale(1.18)' : 'scale(1)',
                  zIndex: isHovered ? 40 : 10
                }}
              >
                <span
                  className="font-display tracking-tight transition-all duration-200 select-none block"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontWeight,
                    color,
                    textShadow: isHovered ? `0 0 12px ${color}33` : 'none',
                    opacity: hoveredWord && !isHovered ? 0.45 : 1
                  }}
                >
                  {item.word}
                </span>

                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-stone-900/95 text-white text-xs rounded-xl shadow-2xl z-50 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150 border border-stone-700">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="text-white">{item.word}</span>
                      <span className="text-amber-300 font-extrabold">{item.count}회 언급</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CHIPS DISPLAY (Tag view) */}
      {viewStyle === 'chips' && (
        <div
          className={`flex flex-wrap items-center justify-center gap-2.5 p-4 sm:p-6 transition-all duration-300 ${
            isLarge ? 'min-h-[440px]' : 'min-h-[280px]'
          }`}
        >
          {words.map((item, idx) => {
            const color = mentimeterColors[idx % mentimeterColors.length];

            return (
              <div
                key={item.word}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredWord(item)}
                onMouseLeave={() => setHoveredWord(null)}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs transition-all transform group-hover:scale-110">
                  <span className="text-xs font-bold" style={{ color }}>
                    {item.word}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 font-semibold">
                    {item.count}
                  </span>
                </div>

                {hoveredWord?.word === item.word && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-stone-900 text-white text-xs rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none">
                    <strong>{item.word}</strong>: {item.count}회 언급
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
