import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  FileSpreadsheet,
  HardDrive,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { TransformerInspectionData } from '../types';
import { getGoogleMapsUrl } from '../utils/location';

interface InspectionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TransformerInspectionData;
  sheetId: string;
  folderId: string;
  onConfirmSubmit?: () => void;
  isConfirmStep?: boolean;
  submitting?: boolean;
}

export const InspectionSummaryModal: React.FC<InspectionSummaryModalProps> = ({
  isOpen,
  onClose,
  data,
  sheetId,
  folderId,
  onConfirmSubmit,
  isConfirmStep = false,
  submitting = false,
}) => {
  if (!isOpen) return null;

  const abnormalItems = data.checklist.filter((i) => i.status === 'abnormal');

  return (
    <div className="fixed inset-0 z-50 bg-[#1B2559]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[32px] max-w-2xl w-full border border-[#E0E5F2] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-[#F4F7FE] flex items-center justify-between bg-gradient-to-r from-[#4318FF] to-[#707EAE] text-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur border border-white/30 text-white">
              {isConfirmStep ? <Send className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {isConfirmStep
                  ? 'ยืนยันการบันทึกรายงานผลการตรวจสอบ'
                  : 'บันทึกข้อมูลสำเร็จเรียบร้อย! 🎉'}
              </h3>
              <p className="text-xs font-semibold text-white/80">
                {isConfirmStep
                  ? 'ตรวจสอบความถูกต้องของข้อมูลก่อนส่งเข้า Google Sheet & Google Drive'
                  : 'ข้อมูลถูกส่งเข้าคลาวด์ Google Workspace เรียบร้อยแล้ว'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Key Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2]">
              <span className="text-[10px] font-bold text-[#707EAE] uppercase block mb-1">
                หมายเลขหม้อแปลง
              </span>
              <span className="text-base font-black text-[#1B2559] truncate block">
                {data.transformerId}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2]">
              <span className="text-[10px] font-bold text-[#707EAE] uppercase block mb-1">
                สถานะผลการตรวจ
              </span>
              <span className="text-sm font-black text-[#1B2559] block">
                {data.inspectionStatus === 'normal'
                  ? '🟢 ปกติ 100%'
                  : data.inspectionStatus === 'warning'
                  ? '🟡 เฝ้าระวัง'
                  : '🔴 ชำรุดวิกฤต'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2] col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#707EAE] uppercase block mb-1">
                วันและเวลา
              </span>
              <span className="text-xs font-black text-[#1B2559] block truncate">
                {data.inspectionDateTime}
              </span>
            </div>
          </div>

          {/* Location & Inspector */}
          <div className="p-4 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#707EAE] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#4318FF]" />
                <span>พิกัด GPS หน้างาน:</span>
              </span>
              {data.latitude && data.longitude ? (
                <a
                  href={getGoogleMapsUrl(data.latitude, data.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4318FF] font-bold underline flex items-center gap-1"
                >
                  {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}{' '}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-rose-500 font-bold">ไม่ระบุพิกัด</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#E0E5F2]">
              <span className="font-bold text-[#707EAE]">ช่างผู้ตรวจสอบ:</span>
              <span className="font-black text-[#1B2559]">{data.inspectorName}</span>
            </div>
          </div>

          {/* Abnormal Checklist Warning if any */}
          {abnormalItems.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-rose-700 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>พบรายการชำรุด/ผิดปกติ ({abnormalItems.length} รายการ):</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-rose-800 font-medium">
                {abnormalItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong> {item.note ? `— (${item.note})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Remarks */}
          {data.detailedRemarks && (
            <div className="p-4 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2]">
              <span className="font-bold text-[#707EAE] block mb-1">
                รายละเอียดเพิ่มเติม:
              </span>
              <p className="text-[#1B2559] font-semibold">{data.detailedRemarks}</p>
            </div>
          )}

          {/* Photos Overview */}
          <div className="space-y-2">
            <span className="font-black text-[#1B2559] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#4318FF]" />
              <span>รูปภาพแนบหน้างาน ({data.photos.length} ภาพ):</span>
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {data.photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-xl overflow-hidden border border-[#E0E5F2] bg-[#F4F7FE] relative group"
                >
                  <img
                    src={photo.previewUrl}
                    alt={`ภาพที่ ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#1B2559]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                    <span className="text-[10px] text-white font-bold truncate">
                      {photo.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-[#F4F7FE] bg-[#F4F7FE]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isConfirmStep ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black text-[#707EAE] hover:text-[#1B2559] hover:bg-white border border-[#E0E5F2] transition-colors"
              >
                ย้อนกลับไปแก้ไข
              </button>

              <button
                type="button"
                onClick={onConfirmSubmit}
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#4318FF] hover:bg-[#3311db] text-white text-xs font-black shadow-[0_12px_28px_rgba(67,24,255,0.35)] transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันและส่งรายงานทันที'}</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4F7FE] text-emerald-700 font-bold border border-[#E0E5F2] shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>ดูใน Google Sheet</span>
                </a>
                <a
                  href={`https://drive.google.com/drive/folders/${folderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4F7FE] text-sky-700 font-bold border border-[#E0E5F2] shadow-sm"
                >
                  <HardDrive className="w-4 h-4 text-sky-600" />
                  <span>ดูใน Google Drive</span>
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#1B2559] hover:bg-[#151c45] text-white text-xs font-black shadow-md transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
