export type InspectionStatus = 'normal' | 'warning' | 'critical';

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  status: 'normal' | 'abnormal' | 'na';
  note?: string;
}

export interface PhotoAttachment {
  id: string;
  file: File;
  previewUrl: string;
  watermarkedDataUrl?: string;
  label: string; // e.g. "ภาพรวม", "ป้าย Nameplate", "จุดที่ชำรุด", "ระดับน้ำมัน"
  timestamp: string;
  driveFileId?: string;
  driveViewLink?: string;
  driveDownloadLink?: string;
}

export interface TransformerInspectionData {
  id?: string;
  transformerId: string; // 1. หมายเลขหม้อแปลง
  inspectionDateTime: string; // 2. วันและเวลาในการกรอก
  inspectionStatus: InspectionStatus; // 3. ผลการตรวจสอบ
  statusSummary: string; // สรุปผล เช่น "ปกติ 100%", "พบน้ำมันซึมบริเวณวาล์ว", "บุชชิ่งแตกร้าว"
  checklist: ChecklistItem[];
  detailedRemarks: string; // รายละเอียด/ข้อเสนอแนะ
  latitude: number | null; // 4. พิกัดตำแหน่ง
  longitude: number | null;
  locationAccuracy?: number | null; // ความแม่นยำ (เมตร)
  locationAddress?: string; // สถานที่/เสาเลขที่/สถานีไฟฟ้าย่อย
  photos: PhotoAttachment[]; // 5. แนบรูปถ่ายหน้างานจริง
  inspectorName: string;
  inspectorEmail: string;
  createdAt: string;
}

export interface SheetRowRecord {
  rowNumber: number;
  dateTime: string;
  transformerId: string;
  status: string;
  statusLevel: string;
  checklistSummary: string;
  remarks: string;
  latitude: string;
  longitude: string;
  accuracy: string;
  mapsUrl: string;
  photoUrls: string;
  inspectorName: string;
  inspectorEmail: string;
  createdAt: string;
}

export interface AppConfig {
  sheetId: string;
  folderId: string;
  sheetName: string;
  autoWatermark: boolean;
}
