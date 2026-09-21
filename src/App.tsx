import React, { useState, useEffect } from 'react';
import { Student, DiaryEntry, QuadrantId, MoodType } from './types';
import {
  getStoredStudents,
  saveStoredStudents,
  getStoredDiaries,
  saveStoredDiaries,
  saveDiary,
  getTodayStr,
  formatShortDate
} from './utils/storage';
import {
  syncDiaryToGoogleSheets,
  fetchStudentsFromGoogleSheets,
  fetchDiariesFromGoogleSheets,
  getGoogleSheetsUrl
} from './utils/googleSheets';
import { QUADRANT_CONFIGS } from './data/mockData';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { StudentCalendar } from './components/StudentCalendar';
import { MoodQuadrantStep } from './components/MoodQuadrantStep';
import { EmotionSelectStep } from './components/EmotionSelectStep';
import { MoodResultStep } from './components/MoodResultStep';
import { GratitudeBridgeStep } from './components/GratitudeBridgeStep';
import { GratitudeFormStep } from './components/GratitudeFormStep';
import { QuoteFinishStep } from './components/QuoteFinishStep';
import { MindStorageStep } from './components/MindStorageStep';
import { TeacherDashboard } from './components/TeacherDashboard';
import { BreathingModal } from './components/BreathingModal';
import { Calendar, BookOpen, ShieldCheck, Heart, Sparkles } from 'lucide-react';

type FlowStep =
  | 'calendar'
  | 'quadrant'
  | 'emotion'
  | 'result'
  | 'bridge'
  | 'form'
  | 'finish'
  | 'storage';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [diaries, setDiaries] = useState<DiaryEntry[]>(() => getStoredDiaries());

  // Current student login state (null when starting afresh, opens clean login modal)
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);

  // Student flow state
  const [step, setStep] = useState<FlowStep>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayStr());
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantId | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [existingEntryToEdit, setExistingEntryToEdit] = useState<DiaryEntry | null>(null);

  // Breathing Modal state
  const [breathingModalOpen, setBreathingModalOpen] = useState(false);
  const [breathingTitle, setBreathingTitle] = useState('3분 카밍(Calming) 호흡법');
  const [breathingDuration, setBreathingDuration] = useState(3);
  const [breathingMode, setBreathingMode] = useState<'breathing' | 'singingBowl'>('breathing');

  // Filter student's own diaries
  const currentStudentDiaries = currentStudent
    ? diaries.filter(
        d =>
          d.grade === currentStudent.grade &&
          d.classroom === currentStudent.classroom &&
          d.number === currentStudent.number
      )
    : [];

  // Auto-sync students roster and historical diaries from Google Sheets if URL is saved
  useEffect(() => {
    const url = getGoogleSheetsUrl();
    if (url) {
      // 1. Fetch Students Roster
      fetchStudentsFromGoogleSheets(url).then(res => {
        if (res.success && res.students && res.students.length > 0) {
          setStudents(res.students);
          saveStoredStudents(res.students);
        }
      });

      // 2. Fetch Historical Diaries (감사일기_수집)
      fetchDiariesFromGoogleSheets(url).then(res => {
        if (res.success && res.diaries && res.diaries.length > 0) {
          setDiaries(res.diaries);
          saveStoredDiaries(res.diaries);
        }
      });
    }
  }, []);

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStoredStudents(newStudents);
  };

  const handleLoginStudent = (student: Student) => {
    setCurrentStudent(student);
    setIsTeacher(false);
    setStep('calendar');
  };

  const handleLoginTeacher = () => {
    setIsTeacher(true);
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setIsTeacher(false);
    setStep('calendar');
  };

  // Flow handlers
  const handleSelectDateFromCalendar = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedQuadrant(null);
    setSelectedEmotion(null);
    setExistingEntryToEdit(null);
    setStep('quadrant');
  };

  const handleViewExistingEntry = (entry: DiaryEntry) => {
    setSelectedDate(entry.dateStr);
    const qKey = (entry.moodType.charAt(0) || 'B') as QuadrantId;
    setSelectedQuadrant(qKey);
    setSelectedEmotion(entry.emotionWord);
    setExistingEntryToEdit(entry);
    setStep('storage');
  };

  const handleSelectQuadrant = (qId: QuadrantId) => {
    setSelectedQuadrant(qId);
    setSelectedEmotion(null);
    setStep('emotion');
  };

  const handleSelectEmotion = (word: string) => {
    setSelectedEmotion(word);
  };

  const handleSaveGratitudeDiary = (values: { g1: string; g2: string; g3: string }) => {
    if (!currentStudent || !selectedQuadrant || !selectedEmotion) return;

    const qConfig = QUADRANT_CONFIGS[selectedQuadrant];
    const newEntry: DiaryEntry = {
      id: existingEntryToEdit?.id || `d-${Date.now()}`,
      timestamp: new Date().toISOString(),
      dateStr: selectedDate,
      grade: currentStudent.grade,
      classroom: currentStudent.classroom,
      number: currentStudent.number,
      studentName: currentStudent.name,
      moodType: qConfig.type,
      emotionWord: selectedEmotion,
      gratitude1: values.g1,
      gratitude2: values.g2,
      gratitude3: values.g3,
      message: qConfig.interpret
    };

    const updated = saveDiary(newEntry);
    setDiaries(updated);

    // Asynchronously send to Google Sheets if configured (fails silently if not configured)
    syncDiaryToGoogleSheets(newEntry);

    setStep('finish');
  };

  const handleOpenBreathingModal = (
    title: string,
    durationMin: number,
    mode: 'breathing' | 'singingBowl' = 'breathing'
  ) => {
    setBreathingTitle(title);
    setBreathingDuration(durationMin);
    setBreathingMode(mode);
    setBreathingModalOpen(true);
  };

  // If not logged in as student and not teacher
  if (!currentStudent && !isTeacher) {
    return (
      <div className="min-h-screen bg-[#fdf8f4]">
        <Header
          currentStudent={null}
          isTeacher={false}
          onLogout={handleLogout}
          onOpenTeacher={() => setIsTeacher(true)}
        />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <LoginModal
            students={students}
            onLoginStudent={handleLoginStudent}
            onLoginTeacher={handleLoginTeacher}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf8f4] flex flex-col selection:bg-rose-200">
      {/* Global Header */}
      <Header
        currentStudent={currentStudent}
        isTeacher={isTeacher}
        onLogout={handleLogout}
        onOpenTeacher={() => setIsTeacher(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-7">
        {isTeacher ? (
          <div className="space-y-4">
            <TeacherDashboard
              students={students}
              diaries={diaries}
              onUpdateStudents={handleUpdateStudents}
            />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Student Navigation Bar */}
            <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStep('calendar')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                    step === 'calendar'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>마음 날씨 달력</span>
                </button>

                <button
                  onClick={() => setStep('storage')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                    step === 'storage'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>나의 마음 창고</span>
                </button>
              </div>

              {/* Quick Calm Breath Button */}
              <button
                onClick={() => handleOpenBreathingModal('3분 카밍(Calming) 호흡법', 3)}
                className="flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
              >
                <span>🌱 3분 호흡 명상</span>
              </button>
            </div>

            {/* Step 1: Calendar */}
            {step === 'calendar' && (
              <StudentCalendar
                recordedDiaries={currentStudentDiaries}
                onSelectDate={handleSelectDateFromCalendar}
                onViewEntry={handleViewExistingEntry}
              />
            )}

            {/* Step 2: Quadrant Selection */}
            {step === 'quadrant' && (
              <MoodQuadrantStep
                selectedDate={selectedDate}
                selectedQuadrant={selectedQuadrant}
                onSelectQuadrant={handleSelectQuadrant}
                onBack={() => setStep('calendar')}
              />
            )}

            {/* Step 3: Emotion Selection */}
            {step === 'emotion' && selectedQuadrant && (
              <EmotionSelectStep
                quadrantId={selectedQuadrant}
                selectedEmotion={selectedEmotion}
                onSelectEmotion={handleSelectEmotion}
                onNext={() => setStep('result')}
                onBack={() => setStep('quadrant')}
              />
            )}

            {/* Step 4: Mood Result & Cheer & Meditation Bridge */}
            {step === 'result' && selectedQuadrant && selectedEmotion && (
              <MoodResultStep
                quadrantId={selectedQuadrant}
                selectedEmotion={selectedEmotion}
                onNext={() => setStep('bridge')}
                onBack={() => setStep('emotion')}
                onOpenBreathingModal={handleOpenBreathingModal}
              />
            )}

            {/* Step 5: Gratitude Bridge */}
            {step === 'bridge' && selectedEmotion && (
              <GratitudeBridgeStep
                selectedEmotion={selectedEmotion}
                onNext={() => setStep('form')}
                onBack={() => setStep('result')}
              />
            )}

            {/* Step 6: Gratitude Diary 3 Prompts Form */}
            {step === 'form' && selectedEmotion && (
              <GratitudeFormStep
                selectedDate={selectedDate}
                selectedEmotion={selectedEmotion}
                onSubmit={handleSaveGratitudeDiary}
                onBack={() => setStep('bridge')}
                initialValues={
                  existingEntryToEdit
                    ? {
                        g1: existingEntryToEdit.gratitude1,
                        g2: existingEntryToEdit.gratitude2,
                        g3: existingEntryToEdit.gratitude3
                      }
                    : undefined
                }
              />
            )}

            {/* Step 7: Quote Finish & Celebration */}
            {step === 'finish' && selectedQuadrant && selectedEmotion && (
              <QuoteFinishStep
                moodType={QUADRANT_CONFIGS[selectedQuadrant].type}
                emotionWord={selectedEmotion}
                onGoToCalendar={() => setStep('calendar')}
                onGoToStorage={() => setStep('storage')}
                onOpenBreathingModal={handleOpenBreathingModal}
              />
            )}

            {/* Step 8: Mind Storage & Line Chart & Diary History */}
            {step === 'storage' && (
              <MindStorageStep
                studentName={currentStudent?.name || '학생'}
                diaries={currentStudentDiaries}
                onBackToCalendar={() => setStep('calendar')}
                onSelectDiaryToEdit={entry => {
                  setSelectedDate(entry.dateStr);
                  const qKey = (entry.moodType.charAt(0) || 'B') as QuadrantId;
                  setSelectedQuadrant(qKey);
                  setSelectedEmotion(entry.emotionWord);
                  setExistingEntryToEdit(entry);
                  setStep('form');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-5 text-center text-xs text-stone-400 font-medium border-t border-stone-200/60 bg-white/40">
        <p>땡큐베리마인드 (ThankYouBerryMind) · 중학생 자존감 향상 마음챙김 웹앱</p>
      </footer>

      {/* Interactive Calming Breathing Modal */}
      <BreathingModal
        isOpen={breathingModalOpen}
        onClose={() => setBreathingModalOpen(false)}
        defaultTitle={breathingTitle}
        defaultDurationMinutes={breathingDuration}
        initialMode={breathingMode}
      />
    </div>
  );
}
