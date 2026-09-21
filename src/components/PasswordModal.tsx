import React, { useState } from 'react';
import { getAdminPassword, setAdminPassword, isDefaultAdminPassword } from '../utils/storage';
import { Lock, Key, Check, AlertCircle, Eye, EyeOff, ShieldCheck, RotateCcw, X } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialPrompt?: boolean;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  isInitialPrompt = false
}) => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isDefault = isDefaultAdminPassword();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const savedPw = getAdminPassword();

    // Verify current password (unless initial prompt where user might already know it was default)
    if (currentPw !== savedPw) {
      setErrorMsg('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPw.length < 4) {
      setErrorMsg('새 비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }

    if (newPw !== confirmPw) {
      setErrorMsg('새 비밀번호와 비밀번호 확인이 서로 일치하지 않습니다.');
      return;
    }

    setAdminPassword(newPw);
    setSuccessMsg('교사 인증 비밀번호가 성공적으로 변경되었습니다!');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');

    setTimeout(() => {
      onClose();
      setSuccessMsg('');
    }, 1500);
  };

  const handleResetToDefault = () => {
    if (window.confirm('비밀번호를 초기 기본값(admin1234)으로 초기화하시겠습니까?')) {
      setAdminPassword('admin1234');
      setSuccessMsg('비밀번호가 초기값(admin1234)으로 초기화되었습니다.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => {
        setSuccessMsg('');
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] p-6 sm:p-7 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-700">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#123b5d]">
                교사 인증 비밀번호 설정
              </h3>
              <p className="text-xs text-stone-500">
                선생님 대시보드 접근용 비밀번호를 안전하게 관리합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Initial setup reminder banner */}
        {isDefault && (
          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>현재 기본 비밀번호(admin1234)를 사용 중입니다</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-snug">
              학생들이 대시보드에 접근하지 못하도록 선생님만의 안전한 비밀번호로 변경해 주세요.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Current Password */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              현재 비밀번호 {isDefault && <span className="text-stone-400 font-normal">(기본: admin1234)</span>}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="현재 비밀번호 입력"
                className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              새 비밀번호 <span className="text-stone-400 font-normal">(4자리 이상)</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="새 비밀번호 입력"
                className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="새 비밀번호 다시 입력"
              className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            {!isDefault && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-2.5 rounded-xl text-stone-500 hover:text-rose-600 bg-stone-100 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="기본값 admin1234로 초기화"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>초기화</span>
              </button>
            )}

            <div className="flex-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
              >
                {isInitialPrompt ? '다음에 변경' : '닫기'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition cursor-pointer"
              >
                비밀번호 저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
