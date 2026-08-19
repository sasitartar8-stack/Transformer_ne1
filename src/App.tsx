import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Zap,
  FileSpreadsheet,
  HardDrive,
  LogIn,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Header } from './components/Header';
import { InspectionForm } from './components/InspectionForm';
import { HistoryList } from './components/HistoryList';
import { ConfigSettingsModal } from './components/ConfigSettingsModal';
import { initAuth, googleSignIn, logout } from './services/auth';
import { DEFAULT_SHEET_ID } from './services/googleSheets';
import { DEFAULT_DRIVE_FOLDER_ID } from './services/googleDrive';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'settings'>('form');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Configuration IDs specified by the user
  const [sheetId, setSheetId] = useState(DEFAULT_SHEET_ID);
  const [folderId, setFolderId] = useState(DEFAULT_DRIVE_FOLDER_ID);

  // Preset transformer if clicked from history
  const [presetTrId, setPresetTrId] = useState<string | undefined>(undefined);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ';
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  const handleSelectTransformerFromHistory = (trId: string) => {
    setPresetTrId(trId);
    setActiveTab('form');
  };

  const handleUpdateConfig = (newSheetId: string, newFolderId: string) => {
    setSheetId(newSheetId);
    setFolderId(newFolderId);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] text-[#1B2559] flex flex-col font-sans selection:bg-[#4318FF] selection:text-white">
      {/* Top Header with Vibrant Palette Theme */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        sheetId={sheetId}
        folderId={folderId}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Google Authentication Alert Banner if not logged in */}
        {!user && !authLoading && (
          <div className="mb-6 bg-white border border-[#E0E5F2] rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4318FF] to-[#707EAE] text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-[#4318FF]/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#1B2559]">
                  เข้าสู่ระบบ Google เพื่อเชื่อมต่อ Google Sheets และ Google Drive
                </h3>
                <p className="text-xs font-semibold text-[#A3AED0] mt-0.5">
                  ระบบจะบันทึกผลการตรวจสอบและอัปโหลดภาพถ่ายหน้างานไปยังโฟลเดอร์และชีตที่คุณกำหนด
                </p>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-[#4318FF] hover:bg-[#3311db] text-white font-extrabold text-xs sm:text-sm shadow-[0_10px_25px_rgba(67,24,255,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}</span>
            </button>
          </div>
        )}

        {/* Login error display if any */}
        {loginError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'form' && (
          <InspectionForm
            user={user}
            sheetId={sheetId}
            folderId={folderId}
            onOpenLogin={handleLogin}
            onRecordSubmitted={() => {
              // Stay on form or switch to history
            }}
            presetTransformerId={presetTrId}
          />
        )}

        {activeTab === 'history' && (
          <HistoryList
            sheetId={sheetId}
            folderId={folderId}
            onSelectTransformer={handleSelectTransformerFromHistory}
          />
        )}

        {activeTab === 'settings' && (
          <ConfigSettingsModal
            sheetId={sheetId}
            folderId={folderId}
            onUpdateConfig={handleUpdateConfig}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E0E5F2] py-6 text-center text-xs text-[#707EAE] mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-[#4318FF] text-white flex items-center justify-center font-black text-[10px]">
              <Zap className="w-3 h-3" />
            </div>
            <span className="font-extrabold text-[#1B2559]">
              TRANSFORMER MONITOR • ระบบรายงานผลการตรวจสอบหม้อแปลงไฟฟ้า
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-[#A3AED0]">
            <span>Google Sheets Sync</span>
            <span>•</span>
            <span>Google Drive Storage</span>
            <span>•</span>
            <span>GPS Geotagging</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
