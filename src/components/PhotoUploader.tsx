import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  Check,
  Sparkles,
  Info,
  X,
  Plus,
  PlusCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { PhotoAttachment } from '../types';
import { processAndWatermarkImage } from '../utils/imageProcessing';

interface PhotoUploaderProps {
  photos: PhotoAttachment[];
  onChange: (photos: PhotoAttachment[]) => void;
  transformerId: string;
  inspectionDateTime: string;
  latitude: number | null;
  longitude: number | null;
  inspectorName: string;
  statusText: string;
  autoWatermark: boolean;
  onToggleWatermark: (val: boolean) => void;
}

const PHOTO_LABELS = [
  'ภาพรวมหม้อแปลงทั้งลูก (Overview)',
  'ป้ายสเปก Nameplate / Serial',
  'จุดผิดปกติ / รอยรั่วซึม (Defect/Leak)',
  'สารดูดความชื้น ซิลิกาเจล (Silica Gel)',
  'บุชชิ่งและจุดต่อไฟฟ้า (Bushings)',
  'ระดับน้ำมันหม้อแปลง (Oil Level)',
  'ตู้ควบคุม / ฟิวส์ (Control Box/Fuse)',
  'ภาพหน้างานเพิ่มเติม (Additional)',
];

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onChange,
  transformerId,
  inspectionDateTime,
  latitude,
  longitude,
  inspectorName,
  statusText,
  autoWatermark,
  onToggleWatermark,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setProcessing(true);
    const addedPhotos: PhotoAttachment[] = [];

    // Convert FileList to array
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const { blob, dataUrl } = await processAndWatermarkImage(file, {
          transformerId,
          timestamp: inspectionDateTime,
          latitude,
          longitude,
          inspectorName,
          statusText,
          applyWatermark: autoWatermark,
        });

        // Determine default suggested label based on existing count
        const totalCount = photos.length + addedPhotos.length;
        const suggestedLabel =
          totalCount === 0
            ? PHOTO_LABELS[0]
            : totalCount === 1
            ? PHOTO_LABELS[1]
            : totalCount === 2
            ? PHOTO_LABELS[2]
            : PHOTO_LABELS[7];

        const processedFile = new File([blob], file.name, { type: 'image/jpeg' });

        addedPhotos.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file: processedFile,
          previewUrl: dataUrl,
          watermarkedDataUrl: dataUrl,
          label: suggestedLabel,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error processing photo:', err);
      }
    }

    if (addedPhotos.length > 0) {
      // Append new photos to existing photos
      onChange([...photos, ...addedPhotos]);
    }

    // CRITICAL: Reset input values so subsequent triggers (camera shot or file picker) always fire onChange
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setProcessing(false);
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const handleLabelChange = (id: string, label: string) => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, label } : p))
    );
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-6 border border-[#E0E5F2] shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F4F7FE]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#4318FF]/10 text-[#4318FF] border border-[#4318FF]/20">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#1B2559] flex items-center gap-2">
              <span>5. แนบรูปถ่ายหน้างานจริง (Field Photos)</span>
              <span className="text-rose-500 text-xs font-bold">*จำเป็น</span>
              {photos.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#4318FF]/10 text-[#4318FF] border border-[#4318FF]/20">
                  แนบแล้ว {photos.length} รูป
                </span>
              )}
            </h3>
            <p className="text-xs font-medium text-[#A3AED0]">
              สามารถถ่ายหรือเลือกรูปภาพได้หลายรูป (อัปโหลดเข้า Google Drive ID: 1Hdc14mV3CpJyQGis1MmTA4xbNVbju_lu)
            </p>
          </div>
        </div>

        {/* Watermark Toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-[#F4F7FE] px-4 py-2 rounded-2xl border border-[#E0E5F2] self-start sm:self-auto hover:bg-[#E0E5F2] transition-colors">
          <input
            type="checkbox"
            checked={autoWatermark}
            onChange={(e) => onToggleWatermark(e.target.checked)}
            className="w-4 h-4 rounded text-[#4318FF] bg-white border-[#E0E5F2] focus:ring-[#4318FF] accent-[#4318FF]"
          />
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1B2559]">
            <Sparkles className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>ปั๊มลายน้ำพิกัด/วันเวลาลงภาพ</span>
          </div>
        </label>
      </div>

      {/* Hidden file inputs - ensure value is reset after each use */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => {
            if (cameraInputRef.current) cameraInputRef.current.value = '';
            cameraInputRef.current?.click();
          }}
          disabled={processing}
          className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-[#4318FF] hover:bg-[#3311db] text-white font-extrabold text-sm shadow-[0_12px_28px_rgba(67,24,255,0.25)] hover:scale-[1.01] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          <span>{photos.length > 0 ? '📷 ถ่ายรูปเพิ่มด้วยกล้องมือถือ' : '📷 ถ่ายภาพด้วยกล้องมือถือ'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) fileInputRef.current.value = '';
            fileInputRef.current?.click();
          }}
          disabled={processing}
          className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-[#F4F7FE] hover:bg-[#E0E5F2] text-[#1B2559] font-extrabold text-sm border border-[#E0E5F2] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Upload className="w-5 h-5 text-[#4318FF]" />
          <span>{photos.length > 0 ? '📁 เลือกรูปเพิ่มจากเครื่อง (เลือกได้หลายรูป)' : '📁 เลือกรูปจากแกลเลอรี / คอมพิวเตอร์'}</span>
        </button>
      </div>

      {/* Processing indicator */}
      {processing && (
        <div className="mt-4 p-3.5 rounded-2xl bg-[#4318FF]/10 border border-[#4318FF]/20 flex items-center justify-center gap-2 text-[#4318FF] text-xs font-bold animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>กำลังปรับขนาดภาพและประทับลายน้ำพิกัดหน้างาน...</span>
        </div>
      )}

      {/* Photos Grid & Add More Dropzone */}
      <div
        className={`mt-5 transition-colors ${
          isDragging ? 'ring-2 ring-[#4318FF] bg-blue-50/50 rounded-2xl p-2' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden bg-[#F4F7FE] border border-[#E0E5F2] shadow-sm flex flex-col"
              >
                {/* Photo Preview Container */}
                <div className="relative aspect-video sm:aspect-4/3 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={photo.previewUrl}
                    alt={`ภาพที่ ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Number Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-[#1B2559]/80 backdrop-blur text-[11px] font-black text-white">
                    #{index + 1}
                  </div>

                  {/* Floating Preview & Delete buttons */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(photo.previewUrl)}
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-[#1B2559] shadow backdrop-blur transition-colors"
                      title="ขยายภาพดูขนาดเต็ม"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="p-2 rounded-xl bg-rose-500/90 hover:bg-rose-600 text-white shadow backdrop-blur transition-colors"
                      title="ลบรูปนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Photo Label Selector */}
                <div className="p-3 bg-white border-t border-[#E0E5F2]">
                  <label className="block text-[10px] font-bold text-[#707EAE] uppercase mb-1">
                    ประเภทรูปภาพ #{index + 1}:
                  </label>
                  <select
                    value={photo.label}
                    onChange={(e) => handleLabelChange(photo.id, e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl bg-[#F4F7FE] border-none text-[#1B2559] font-bold focus:ring-2 focus:ring-[#4318FF] focus:outline-none"
                  >
                    {PHOTO_LABELS.map((lbl) => (
                      <option key={lbl} value={lbl}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {/* Quick "Add More" Card in the grid */}
            <div
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                fileInputRef.current?.click();
              }}
              className="rounded-2xl border-2 border-dashed border-[#4318FF]/40 bg-[#4318FF]/5 hover:bg-[#4318FF]/10 transition-all flex flex-col items-center justify-center p-6 min-h-[180px] cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm text-[#4318FF] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-xs font-black text-[#4318FF]">เพิ่มรูปภาพอีก</p>
              <p className="text-[11px] font-medium text-[#707EAE] mt-0.5 text-center">
                คลิกเพื่อเลือกไฟล์ หรือถ่ายภาพเพิ่ม
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = '';
              fileInputRef.current?.click();
            }}
            className="p-8 text-center rounded-[24px] bg-[#F4F7FE] border-2 border-dashed border-[#E0E5F2] hover:border-[#4318FF]/50 transition-colors cursor-pointer"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-[#4318FF]">
              <Camera className="w-8 h-8" />
            </div>
            <p className="text-sm font-extrabold text-[#1B2559]">ยังไม่มีรูปภาพแนบ</p>
            <p className="text-xs font-medium text-[#A3AED0] mt-1 max-w-sm mx-auto">
              คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง (สามารถเลือกหรือถ่ายได้หลายรูปภาพ)
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Photo Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#1B2559]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute -top-12 right-0 p-2.5 rounded-full bg-white text-[#1B2559] hover:bg-[#F4F7FE] shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalUrl}
              alt="ภาพขยายขนาดเต็ม"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
