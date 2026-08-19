import React, { useState, useEffect } from 'react';
import {
  Zap,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Sparkles,
  FileSpreadsheet,
  HardDrive,
  User as UserIcon,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import {
  TransformerInspectionData,
  InspectionStatus,
  ChecklistItem,
  PhotoAttachment,
} from '../types';
import { ChecklistSection, INITIAL_CHECKLIST } from './ChecklistSection';
import { LocationPicker } from './LocationPicker';
import { PhotoUploader } from './PhotoUploader';
import { InspectionSummaryModal } from './InspectionSummaryModal';
import { uploadFileToGoogleDrive } from '../services/googleDrive';
import { appendInspectionRecord } from '../services/googleSheets';

interface InspectionFormProps {
  user: User | null;
  sheetId: string;
  folderId: string;
  onOpenLogin: () => void;
  onRecordSubmitted: () => void;
  presetTransformerId?: string;
}

const STORAGE_DRAFT_KEY = 'transformer_inspection_draft_v1';

const getCurrentDateTimeLocal = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const InspectionForm: React.FC<InspectionFormProps> = ({
  user,
  sheetId,
  folderId,
  onOpenLogin,
  onRecordSubmitted,
  presetTransformerId,
}) => {
  // 1. หมายเลขหม้อแปลง
  const [transformerId, setTransformerId] = useState(presetTransformerId || '');

  // 2. วันและเวลาในการกรอก
  const [inspectionDateTime, setInspectionDateTime] = useState(getCurrentDateTimeLocal());

  // 3. ผลการตรวจสอบ
  const [inspectionStatus, setInspectionStatus] = useState<InspectionStatus>('normal');
  const [detailedRemarks, setDetailedRemarks] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);

  // 4. พิกัดตำแหน่ง
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState('');

  // 5. แนบรูปถ่ายหน้างานจริง
  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);
  const [autoWatermark, setAutoWatermark] = useState(true);

  // Inspector name
  const [inspectorName, setInspectorName] = useState(user?.displayName || 'ช่างเทคนิคไฟฟ้า');

  // UI Flow States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [lastSubmittedData, setLastSubmittedData] = useState<TransformerInspectionData | null>(null);

  useEffect(() => {
    if (user?.displayName && inspectorName === 'ช่างเทคนิคไฟฟ้า') {
      setInspectorName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    if (presetTransformerId) {
      setTransformerId(presetTransformerId);
    }
  }, [presetTransformerId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.transformerId && !transformerId) setTransformerId(draft.transformerId);
        if (draft.detailedRemarks) setDetailedRemarks(draft.detailedRemarks);
        if (draft.inspectionStatus) setInspectionStatus(draft.inspectionStatus);
      }
    } catch (e) {
      console.warn('Could not read draft:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_DRAFT_KEY,
        JSON.stringify({
          transformerId,
          detailedRemarks,
          inspectionStatus,
        })
      );
    } catch {
      // Ignore
    }
  }, [transformerId, detailedRemarks, inspectionStatus]);

  const validateForm = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!transformerId.trim()) {
      errs.transformerId = 'กรุณาระบุหมายเลขหม้อแปลง (Transformer ID)';
    }

    if (!inspectionDateTime) {
      errs.inspectionDateTime = 'กรุณาระบุวันและเวลาในการตรวจสอบ';
    }

    if (latitude === null || longitude === null) {
      errs.location = 'กรุณาระบุพิกัดตำแหน่ง GPS หน้างาน';
    }

    if (photos.length === 0) {
      errs.photos = 'กรุณาแนบรูปถ่ายหน้างานจริงอย่างน้อย 1 ภาพ';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!user) {
      onOpenLogin();
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setSubmitting(true);
    setProgressStatus('กำลังเตรียมข้อมูล...');

    try {
      // 1. Upload photos to Google Drive Folder
      const uploadedPhotos: PhotoAttachment[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setProgressStatus(`กำลังอัปโหลดรูปภาพที่ ${i + 1}/${photos.length} ไปยัง Google Drive...`);

        const cleanTrId = transformerId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `TR_${cleanTrId}_${Date.now()}_${i + 1}.jpg`;

        const uploadResult = await uploadFileToGoogleDrive(
          photo.file,
          fileName,
          folderId,
          'image/jpeg'
        );

        uploadedPhotos.push({
          ...photo,
          driveFileId: uploadResult.fileId,
          driveViewLink: uploadResult.webViewLink,
          driveDownloadLink: uploadResult.webContentLink,
        });
      }

      // 2. Append record to Google Sheets
      setProgressStatus('กำลังบันทึกข้อมูลผลการตรวจสอบลง Google Sheet...');

      const statusSummary =
        inspectionStatus === 'normal'
          ? 'ปกติสมบูรณ์ 100%'
          : inspectionStatus === 'warning'
          ? 'เฝ้าระวัง มีจุดผิดปกติ'
          : 'ชำรุดวิกฤต ต้องซ่อมด่วน';

      const payload: TransformerInspectionData = {
        transformerId: transformerId.trim(),
        inspectionDateTime: new Date(inspectionDateTime).toLocaleString('th-TH', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        inspectionStatus,
        statusSummary,
        checklist,
        detailedRemarks: detailedRemarks.trim(),
        latitude,
        longitude,
        locationAccuracy: accuracy,
        locationAddress: address,
        photos: uploadedPhotos,
        inspectorName: inspectorName.trim() || user?.displayName || 'ช่างเทคนิคไฟฟ้า',
        inspectorEmail: user?.email || '',
        createdAt: new Date().toISOString(),
      };

      await appendInspectionRecord(payload, sheetId);

      setProgressStatus('บันทึกข้อมูลสำเร็จเรียบร้อย!');
      setLastSubmittedData(payload);

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });

      localStorage.removeItem(STORAGE_DRAFT_KEY);

      setTransformerId('');
      setDetailedRemarks('');
      setPhotos([]);
      setChecklist(INITIAL_CHECKLIST);
      setInspectionDateTime(getCurrentDateTimeLocal());

      setIsConfirmModalOpen(false);
      setIsSuccessModalOpen(true);
      onRecordSubmitted();
    } catch (err: unknown) {
      console.error('Submission failed:', err);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      alert(`❌ การบันทึกล้มเหลว: ${msg}`);
    } finally {
      setSubmitting(false);
      setProgressStatus('');
    }
  };

  const handleResetForm = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลในแบบฟอร์มทั้งหมดใช่หรือไม่?')) {
      setTransformerId('');
      setDetailedRemarks('');
      setPhotos([]);
      setChecklist(INITIAL_CHECKLIST);
      setInspectionDateTime(getCurrentDateTimeLocal());
      localStorage.removeItem(STORAGE_DRAFT_KEY);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cloud Target Banner */}
      <div className="bg-white rounded-[24px] p-5 border border-[#E0E5F2] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#1B2559]">
          <div className="w-8 h-8 rounded-xl bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-[#1B2559]">ระบบซิงค์คลาวด์อัตโนมัติ</span>
            <p className="text-[#A3AED0] text-[11px] font-medium">
              ข้อมูลจะถูกบันทึกลง <strong>Google Sheets</strong> และส่งรูปถ่ายตรงไปยัง <strong>Google Drive</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[11px]">
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            Sheet: {sheetId.substring(0, 8)}...
          </span>
          <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-700 font-bold border border-sky-200">
            Drive: {folderId.substring(0, 8)}...
          </span>
        </div>
      </div>

      {/* Main Inspection Form */}
      <form onSubmit={handlePreSubmit} className="space-y-6">
        {/* Section 1 & 2: Transformer ID & Inspection Date/Time */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E0E5F2] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F4F7FE]">
            <h2 className="text-base sm:text-lg font-black text-[#1B2559] flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#4318FF]/10 text-[#4318FF]">
                <Zap className="w-5 h-5" />
              </div>
              <span>ข้อมูลทั่วไปของหม้อแปลงไฟฟ้า</span>
            </h2>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-[#707EAE] hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างฟอร์ม</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* 1. หมายเลขหม้อแปลง */}
            <div>
              <label className="block text-xs font-black text-[#1B2559] uppercase mb-2">
                1. หมายเลขหม้อแปลง (Transformer ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={transformerId}
                onChange={(e) => {
                  setTransformerId(e.target.value);
                  if (errors.transformerId) {
                    setErrors({ ...errors, transformerId: '' });
                  }
                }}
                placeholder="เช่น TR-2024-001 หรือ 67-089-BKK"
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#F4F7FE] border text-sm font-bold text-[#1B2559] placeholder-[#A3AED0] focus:ring-2 focus:ring-[#4318FF] focus:outline-none transition-all ${
                  errors.transformerId
                    ? 'border-rose-500 ring-2 ring-rose-200'
                    : 'border-transparent focus:bg-white'
                }`}
              />
              {errors.transformerId ? (
                <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.transformerId}</p>
              ) : (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold text-[#A3AED0]">ตัวอย่าง:</span>
                  {['TR-01-MEA', 'TR-02-PEA', 'TR-SUB-500KVA'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setTransformerId(sample)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F4F7FE] text-[#707EAE] hover:bg-[#E0E5F2] hover:text-[#4318FF]"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. วันและเวลาในการกรอก */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-[#1B2559] uppercase">
                  2. วันและเวลาในการตรวจสอบ <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setInspectionDateTime(getCurrentDateTimeLocal())}
                  className="text-[11px] text-[#4318FF] hover:underline font-bold flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>ตั้งเป็นเวลานี้</span>
                </button>
              </div>
              <input
                type="datetime-local"
                value={inspectionDateTime}
                onChange={(e) => {
                  setInspectionDateTime(e.target.value);
                  if (errors.inspectionDateTime) {
                    setErrors({ ...errors, inspectionDateTime: '' });
                  }
                }}
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#F4F7FE] border text-sm font-bold text-[#1B2559] focus:ring-2 focus:ring-[#4318FF] focus:outline-none transition-all ${
                  errors.inspectionDateTime
                    ? 'border-rose-500 ring-2 ring-rose-200'
                    : 'border-transparent focus:bg-white'
                }`}
              />
              {errors.inspectionDateTime && (
                <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.inspectionDateTime}</p>
              )}
            </div>
          </div>

          {/* Inspector Name */}
          <div className="pt-4 border-t border-[#F4F7FE]">
            <label className="block text-xs font-black text-[#1B2559] uppercase mb-2">
              ชื่อช่างผู้ตรวจสอบ (Inspector Name):
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <UserIcon className="w-4 h-4 absolute left-4 top-3.5 text-[#A3AED0]" />
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="ระบุชื่อ-นามสกุล ช่างเทคนิคผู้ตรวจ"
                  className="w-full pl-11 pr-4 py-3 text-xs font-bold rounded-2xl bg-[#F4F7FE] border-none text-[#1B2559] focus:ring-2 focus:ring-[#4318FF] focus:outline-none"
                />
              </div>
              {user?.email && (
                <span className="text-[11px] font-semibold text-[#707EAE] hidden sm:inline-block">
                  ({user.email})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Inspection Status & Checklist */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E0E5F2] shadow-sm space-y-5">
          <div className="pb-4 border-b border-[#F4F7FE]">
            <h2 className="text-base sm:text-lg font-black text-[#1B2559] flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#4318FF]/10 text-[#4318FF]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span>3. ผลการตรวจสอบสภาพหม้อแปลง (Inspection Result)</span>
              <span className="text-rose-500 text-xs font-bold">*จำเป็น</span>
            </h2>
            <p className="text-xs font-medium text-[#A3AED0] mt-0.5">
              ประเมินสถานะโดยรวมและตรวจเช็ครายละเอียดอุปกรณ์แต่ละหมวด
            </p>
          </div>

          {/* 3 Main Status Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Normal */}
            <button
              type="button"
              onClick={() => setInspectionStatus('normal')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                inspectionStatus === 'normal'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-md scale-[1.02]'
                  : 'bg-[#F4F7FE] border-transparent text-[#707EAE] hover:bg-[#E0E5F2] hover:text-[#1B2559]'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500 mb-2"></div>
              <span className="text-sm font-black text-[#1B2559]">ปกติ (Normal)</span>
              <span className="text-[11px] font-semibold text-emerald-700 mt-1">
                ไม่พบข้อบกพร่อง พร้อมใช้งาน
              </span>
            </button>

            {/* Warning */}
            <button
              type="button"
              onClick={() => setInspectionStatus('warning')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                inspectionStatus === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-500 shadow-md scale-[1.02]'
                  : 'bg-[#F4F7FE] border-transparent text-[#707EAE] hover:bg-[#E0E5F2] hover:text-[#1B2559]'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-amber-500 mb-2"></div>
              <span className="text-sm font-black text-[#1B2559]">เฝ้าระวัง (Warning)</span>
              <span className="text-[11px] font-semibold text-amber-700 mt-1">
                พบข้อผิดปกติเล็กน้อย / เฝ้าระวัง
              </span>
            </button>

            {/* Critical */}
            <button
              type="button"
              onClick={() => setInspectionStatus('critical')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                inspectionStatus === 'critical'
                  ? 'bg-rose-50 text-rose-700 border-rose-500 shadow-md scale-[1.02]'
                  : 'bg-[#F4F7FE] border-transparent text-[#707EAE] hover:bg-[#E0E5F2] hover:text-[#1B2559]'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-rose-500 mb-2"></div>
              <span className="text-sm font-black text-[#1B2559]">ชำรุดวิกฤต (Critical)</span>
              <span className="text-[11px] font-semibold text-rose-700 mt-1">
                ชำรุดเสียหาย ต้องแก้ไขทันที
              </span>
            </button>
          </div>

          {/* Checklist Items */}
          <div className="pt-2">
            <ChecklistSection items={checklist} onChange={setChecklist} />
          </div>

          {/* Detailed Remarks */}
          <div className="pt-4 border-t border-[#F4F7FE]">
            <label className="block text-xs font-black text-[#1B2559] uppercase mb-2">
              รายละเอียดผลการตรวจสอบ / ข้อสังเกตเพิ่มเติม (Detailed Remarks):
            </label>
            <textarea
              rows={3}
              value={detailedRemarks}
              onChange={(e) => setDetailedRemarks(e.target.value)}
              placeholder="ระบุรายละเอียด เช่น อุณหภูมิวัดได้ 65°C, มีคราบน้ำมันซึมบริเวณประเก็นฝาถัง, ซิลิกาเจลเริ่มเปลี่ยนสี 30%..."
              className="w-full px-4 py-3 text-xs font-medium rounded-2xl bg-[#F4F7FE] border-none text-[#1B2559] placeholder-[#A3AED0] focus:ring-2 focus:ring-[#4318FF] focus:outline-none"
            />
          </div>
        </div>

        {/* Section 4: Location Coordinates */}
        <div>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            accuracy={accuracy}
            address={address}
            onChange={(lat, lng, acc, addr) => {
              setLatitude(lat);
              setLongitude(lng);
              setAccuracy(acc);
              if (addr) setAddress(addr);
              if (errors.location) {
                setErrors({ ...errors, location: '' });
              }
            }}
          />
          {errors.location && (
            <p className="text-xs font-bold text-rose-500 mt-2 pl-3">{errors.location}</p>
          )}
        </div>

        {/* Section 5: Real Field Photos */}
        <div>
          <PhotoUploader
            photos={photos}
            onChange={(newPhotos) => {
              setPhotos(newPhotos);
              if (errors.photos) {
                setErrors({ ...errors, photos: '' });
              }
            }}
            transformerId={transformerId}
            inspectionDateTime={new Date(inspectionDateTime).toLocaleString('th-TH')}
            latitude={latitude}
            longitude={longitude}
            inspectorName={inspectorName}
            statusText={
              inspectionStatus === 'normal'
                ? 'ปกติ'
                : inspectionStatus === 'warning'
                ? 'เฝ้าระวัง'
                : 'ชำรุดวิกฤต'
            }
            autoWatermark={autoWatermark}
            onToggleWatermark={setAutoWatermark}
          />
          {errors.photos && (
            <p className="text-xs font-bold text-rose-500 mt-2 pl-3">{errors.photos}</p>
          )}
        </div>

        {/* Submit Action Bar */}
        <div className="bg-white rounded-[28px] p-6 border border-[#E0E5F2] shadow-[0_20px_50px_rgba(67,24,255,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur">
          <div className="text-xs font-semibold text-[#707EAE] text-center sm:text-left">
            <span className="font-extrabold text-[#1B2559]">
              พร้อมส่ง {photos.length} รูปภาพ
            </span>{' '}
            | พิกัด GPS: {latitude ? '✓ ระบุแล้ว' : '⚠️ ยังไม่ระบุ'} | ปลายทาง: Google Sheets & Drive
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-10 py-4 rounded-2xl bg-[#4318FF] hover:bg-[#3311db] text-white font-extrabold text-base shadow-[0_15px_35px_rgba(67,24,255,0.35)] hover:scale-[1.02] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>บันทึกรายงานลงระบบ (Syncing...)</span>
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal Before Submission */}
      <InspectionSummaryModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        data={{
          transformerId,
          inspectionDateTime: new Date(inspectionDateTime).toLocaleString('th-TH'),
          inspectionStatus,
          statusSummary:
            inspectionStatus === 'normal'
              ? 'ปกติ 100%'
              : inspectionStatus === 'warning'
              ? 'เฝ้าระวัง'
              : 'ชำรุดวิกฤต',
          checklist,
          detailedRemarks,
          latitude,
          longitude,
          locationAccuracy: accuracy,
          locationAddress: address,
          photos,
          inspectorName,
          inspectorEmail: user?.email || '',
          createdAt: new Date().toISOString(),
        }}
        sheetId={sheetId}
        folderId={folderId}
        onConfirmSubmit={handleConfirmedSubmit}
        isConfirmStep={true}
        submitting={submitting}
      />

      {/* Success Modal After Submission */}
      {lastSubmittedData && (
        <InspectionSummaryModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          data={lastSubmittedData}
          sheetId={sheetId}
          folderId={folderId}
          isConfirmStep={false}
        />
      )}

      {/* Fullscreen Submitting Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-[#1B2559]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white text-[#4318FF] flex items-center justify-center mb-4 animate-bounce shadow-xl">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">กำลังบันทึกข้อมูลการตรวจสอบ...</h3>
          <p className="text-sm text-blue-200 font-bold mb-6 animate-pulse">
            {progressStatus}
          </p>

          <div className="flex items-center gap-6 text-xs text-white/70 font-bold">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>Google Drive Folder</span>
            </div>
            <span>➔</span>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheet Row</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
