import React from 'react';
import {
  Zap,
  FileSpreadsheet,
  HardDrive,
  User as UserIcon,
  LogOut,
  PlusCircle,
  History,
  Settings,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'form' | 'history' | 'settings';
  setActiveTab: (tab: 'form' | 'history' | 'settings') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  sheetId: string;
  folderId: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  sheetId,
  folderId,
}) => {
  return (
    <header className="bg-white border-b border-[#E0E5F2] sticky top-0 z-30 shadow-[0_4px_20px_rgba(112,126,174,0.08)]">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#4318FF] to-[#707EAE] flex items-center justify-center shadow-lg shadow-[#4318FF]/25 text-white font-black">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-[#1B2559] tracking-tight leading-tight">
                  ระบบรายงานผลการตรวจสอบหม้อแปลงไฟฟ้า
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#4318FF]/10 text-[#4318FF] border border-[#4318FF]/20">
                  PEA / MEA Standard
                </span>
              </div>
              <p className="text-xs font-semibold text-[#A3AED0] hidden sm:block">
                Transformer Inspection & Cloud Sync (Google Sheets & Google Drive)
              </p>
            </div>
          </div>

          {/* Quick Destination Links */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs">
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F4F7FE] text-[#1B2559] hover:bg-[#E0E5F2] font-bold transition-all border border-[#E0E5F2]"
              title="เปิด Google Sheet บันทึกผล"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheet</span>
              <ExternalLink className="w-3 h-3 text-[#A3AED0]" />
            </a>
            <a
              href={`https://drive.google.com/drive/folders/${folderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F4F7FE] text-[#1B2559] hover:bg-[#E0E5F2] font-bold transition-all border border-[#E0E5F2]"
              title="เปิดโฟลเดอร์เก็บภาพ Google Drive"
            >
              <div className="w-2 h-2 rounded-full bg-sky-500"></div>
              <HardDrive className="w-4 h-4 text-sky-600" />
              <span>Google Drive</span>
              <ExternalLink className="w-3 h-3 text-[#A3AED0]" />
            </a>
          </div>

          {/* User Profile / Auth State */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-2.5 bg-[#F4F7FE] border border-[#E0E5F2] rounded-full py-1.5 px-3.5 shadow-sm">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-[#4318FF]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#4318FF] text-white font-black flex items-center justify-center text-xs shadow-md">
                    {user.displayName?.charAt(0) || <UserIcon className="w-4 h-4" />}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-extrabold text-[#1B2559] leading-none truncate max-w-[130px]">
                    {user.displayName || 'ช่างผู้ตรวจสอบ'}
                  </p>
                  <p className="text-[10px] font-semibold text-[#A3AED0] leading-none truncate max-w-[130px] mt-1">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-full text-[#A3AED0] hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4318FF] hover:bg-[#3311db] text-white font-bold text-xs sm:text-sm shadow-[0_10px_25px_rgba(67,24,255,0.3)] hover:scale-[1.02] transition-all"
              >
                <UserIcon className="w-4 h-4" />
                <span>เข้าสู่ระบบ Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-t border-[#F4F7FE] py-2.5">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === 'form'
                ? 'bg-[#4318FF] text-white shadow-[0_10px_25px_rgba(67,24,255,0.3)]'
                : 'text-[#707EAE] hover:text-[#1B2559] hover:bg-[#F4F7FE]'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>📝 แบบฟอร์มรายงานใหม่</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === 'history'
                ? 'bg-[#4318FF] text-white shadow-[0_10px_25px_rgba(67,24,255,0.3)]'
                : 'text-[#707EAE] hover:text-[#1B2559] hover:bg-[#F4F7FE]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📋 ประวัติการตรวจสอบ</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#4318FF] text-white shadow-[0_10px_25px_rgba(67,24,255,0.3)]'
                : 'text-[#707EAE] hover:text-[#1B2559] hover:bg-[#F4F7FE]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ การเชื่อมต่อ & คลาวด์</span>
          </button>
        </div>
      </div>
    </header>
  );
};
