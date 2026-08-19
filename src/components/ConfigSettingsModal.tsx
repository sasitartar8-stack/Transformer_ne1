import React, { useState } from 'react';
import {
  FileSpreadsheet,
  HardDrive,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_SHEET_ID, getSpreadsheetInfo } from '../services/googleSheets';
import { DEFAULT_DRIVE_FOLDER_ID } from '../services/googleDrive';

interface ConfigSettingsModalProps {
  sheetId: string;
  folderId: string;
  onUpdateConfig: (newSheetId: string, newFolderId: string) => void;
}

export const ConfigSettingsModal: React.FC<ConfigSettingsModalProps> = ({
  sheetId,
  folderId,
  onUpdateConfig,
}) => {
  const [currentSheetId, setCurrentSheetId] = useState(sheetId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [saved, setSaved] = useState(false);
  const [testingSheet, setTestingSheet] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    onUpdateConfig(currentSheetId.trim(), currentFolderId.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    setCurrentSheetId(DEFAULT_SHEET_ID);
    setCurrentFolderId(DEFAULT_DRIVE_FOLDER_ID);
    onUpdateConfig(DEFAULT_SHEET_ID, DEFAULT_DRIVE_FOLDER_ID);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestingSheet(true);
    setTestResult(null);
    try {
      const info = await getSpreadsheetInfo(currentSheetId);
      setTestResult({
        success: true,
        message: `เชื่อมต่อสำเร็จ! พบเอกสาร "${info.title}" (${info.sheets.join(', ')})`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เชื่อมต่อไม่สำเร็จ';
      setTestResult({
        success: false,
        message: msg,
      });
    } finally {
      setTestingSheet(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E0E5F2] shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F4F7FE]">
          <div className="p-2.5 rounded-2xl bg-[#4318FF]/10 text-[#4318FF] border border-[#4318FF]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#1B2559]">
              การตั้งค่าระบบ & คลาวด์ Google Workspace
            </h2>
            <p className="text-xs font-medium text-[#A3AED0]">
              กำหนด ID ของ Google Sheet และ Google Drive Folder สำหรับการบันทึกรายงาน
            </p>
          </div>
        </div>

        {/* Target IDs Configuration */}
        <div className="mt-6 space-y-6">
          {/* Google Sheet ID */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black text-[#1B2559] uppercase">
              <span className="flex items-center gap-2 text-emerald-600">
                <FileSpreadsheet className="w-4 h-4" />
                Google Sheet ID (บันทึกข้อมูลตาราง):
              </span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${currentSheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 text-[11px] underline flex items-center gap-1 font-bold"
              >
                เปิดดูในแท็บใหม่ <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="text"
              value={currentSheetId}
              onChange={(e) => setCurrentSheetId(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-[#F4F7FE] border-none text-[#1B2559] font-mono text-xs font-bold focus:ring-2 focus:ring-[#4318FF] focus:outline-none"
              placeholder="ใส่ Google Sheet ID"
            />
            <p className="text-[11px] font-semibold text-[#A3AED0]">
              ค่าเริ่มต้น: <span className="font-mono text-[#1B2559]">{DEFAULT_SHEET_ID}</span>
            </p>
          </div>

          {/* Google Drive Folder ID */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black text-[#1B2559] uppercase">
              <span className="flex items-center gap-2 text-sky-600">
                <HardDrive className="w-4 h-4" />
                Google Drive Folder ID (จัดเก็บรูปภาพ):
              </span>
              <a
                href={`https://drive.google.com/drive/folders/${currentFolderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:text-sky-700 text-[11px] underline flex items-center gap-1 font-bold"
              >
                เปิดดูโฟลเดอร์ในแท็บใหม่ <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="text"
              value={currentFolderId}
              onChange={(e) => setCurrentFolderId(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-[#F4F7FE] border-none text-[#1B2559] font-mono text-xs font-bold focus:ring-2 focus:ring-[#4318FF] focus:outline-none"
              placeholder="ใส่ Google Drive Folder ID"
            />
            <p className="text-[11px] font-semibold text-[#A3AED0]">
              ค่าเริ่มต้น: <span className="font-mono text-[#1B2559]">{DEFAULT_DRIVE_FOLDER_ID}</span>
            </p>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2 font-bold ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-[#F4F7FE] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingSheet}
                className="px-4 py-2.5 rounded-2xl bg-[#F4F7FE] hover:bg-[#E0E5F2] text-[#1B2559] text-xs font-bold border border-[#E0E5F2] transition-colors disabled:opacity-50"
              >
                {testingSheet ? 'กำลังทดสอบ...' : '⚡ ทดสอบการเชื่อมต่อ Google API'}
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F4F7FE] text-[#707EAE] text-xs font-bold transition-colors flex items-center gap-1 border border-[#E0E5F2]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่าเริ่มต้น</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#4318FF] hover:bg-[#3311db] text-white text-xs font-extrabold shadow-[0_10px_25px_rgba(67,24,255,0.3)] transition-all hover:scale-[1.02]"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าแล้ว!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security and Architecture Info Banner */}
      <div className="bg-[#1B2559] rounded-[28px] p-6 text-white shadow-xl space-y-3">
        <h3 className="font-extrabold text-sm flex items-center gap-2 text-white">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>มาตรฐานความปลอดภัยและการทำงาน (Security & Architecture)</span>
        </h3>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-white/80 font-medium">
          <li><strong>Client-Side Token Security:</strong> ใช้ Google OAuth Token ในหน่วยความจำ (In-Memory) ไม่บันทึก Token ลับลง localStorage</li>
          <li><strong>Automatic Header Bootstrap:</strong> ตรวจสอบและสร้างคอลัมน์หัวตาราง 14 คอลัมน์ใน Google Sheet อัตโนมัติเมื่อเริ่มต้นบันทึกครั้งแรก</li>
          <li><strong>Resilient Network:</strong> กลไก Exponential Backoff Retry ป้องกันการเชื่อมต่อสะดุดกรณีสัญญาณ 4G/5G หน้างานไม่เสถียร</li>
        </ul>
      </div>
    </div>
  );
};
