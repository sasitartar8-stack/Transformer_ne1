import React from 'react';
import { ChecklistItem } from '../types';
import { CheckCircle2, AlertTriangle, HelpCircle, CheckCheck } from 'lucide-react';

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: 'oil_level',
    category: 'น้ำมันหม้อแปลง',
    label: '1. ระดับน้ำมันและรอยรั่วซึม (Oil Level & Leakage)',
    status: 'normal',
    note: '',
  },
  {
    id: 'temperature',
    category: 'อุณหภูมิ',
    label: '2. เกจวัดอุณหภูมิและระบบระบายความร้อน (Temperature & Cooling)',
    status: 'normal',
    note: '',
  },
  {
    id: 'bushings',
    category: 'บุชชิ่ง',
    label: '3. สภาพบุชชิ่งแรงสูง-แรงต่ำ และลูกถ้วยฉนวน (Bushings & Insulators)',
    status: 'normal',
    note: '',
  },
  {
    id: 'silica_gel',
    category: 'สารดูดความชื้น',
    label: '4. สภาพซิลิกาเจลและถ้วยดักน้ำมัน (Silica Gel & Breather Cup)',
    status: 'normal',
    note: '',
  },
  {
    id: 'noise_vibration',
    category: 'เสียงและการสั่นสะเทือน',
    label: '5. เสียงฮัมผิดปกติและแรงสั่นสะเทือน (Humming Noise & Vibration)',
    status: 'normal',
    note: '',
  },
  {
    id: 'grounding',
    category: 'ระบบกราวด์',
    label: '6. สภาพสายดิน กราวด์ และจุดต่อขันแน่น (Grounding System)',
    status: 'normal',
    note: '',
  },
  {
    id: 'body_tank',
    category: 'ตัวถังและโครงสร้าง',
    label: '7. สภาพตัวถัง สนิม สี และความสะอาดบริเวณโดยรอบ (Tank Body & Cleanliness)',
    status: 'normal',
    note: '',
  },
  {
    id: 'control_fuse',
    category: 'ตู้คอนโทรลและฟิวส์',
    label: '8. สภาพตู้คอนโทรล ดรอปเอาท์ฟิวส์ และอุปกรณ์ป้องกัน (Control & Protection)',
    status: 'normal',
    note: '',
  },
];

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  items,
  onChange,
}) => {
  const handleStatusChange = (
    id: string,
    newStatus: 'normal' | 'abnormal' | 'na'
  ) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    onChange(updated);
  };

  const handleNoteChange = (id: string, note: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, note } : item
    );
    onChange(updated);
  };

  const setAllStatus = (status: 'normal' | 'abnormal' | 'na') => {
    const updated = items.map((item) => ({ ...item, status }));
    onChange(updated);
  };

  const abnormalCount = items.filter((i) => i.status === 'abnormal').length;
  const normalCount = items.filter((i) => i.status === 'normal').length;

  return (
    <div className="bg-white rounded-[28px] p-6 border border-[#E0E5F2] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F4F7FE]">
        <div>
          <h3 className="text-base font-extrabold text-[#1B2559] flex items-center gap-2">
            <span>รายการตรวจเช็คสภาพหม้อแปลง (Checklist)</span>
            {abnormalCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                พบผิดปกติ {abnormalCount} รายการ
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                ปกติครบ {normalCount} รายการ
              </span>
            )}
          </h3>
          <p className="text-xs font-medium text-[#A3AED0] mt-0.5">
            เลือกผลการตรวจแต่ละจุดสำคัญตามมาตรฐานงานบำรุงรักษาหม้อแปลง
          </p>
        </div>

        {/* Quick batch toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllStatus('normal')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#4318FF]/10 text-[#4318FF] hover:bg-[#4318FF]/20 border border-[#4318FF]/20 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>ตั้งปกติทั้งหมด</span>
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#F4F7FE] mt-2">
        {items.map((item) => (
          <div key={item.id} className="py-3.5 flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#1B2559]">
                {item.label}
              </span>

              {/* Status Radio Buttons */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleStatusChange(item.id, 'normal')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    item.status === 'normal'
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-[#F4F7FE] text-[#707EAE] hover:text-[#1B2559]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ปกติ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(item.id, 'abnormal')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    item.status === 'abnormal'
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                      : 'bg-[#F4F7FE] text-[#707EAE] hover:text-[#1B2559]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>ผิดปกติ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(item.id, 'na')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    item.status === 'na'
                      ? 'bg-[#1B2559] text-white'
                      : 'bg-[#F4F7FE] text-[#A3AED0] hover:text-[#707EAE]'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>N/A</span>
                </button>
              </div>
            </div>

            {/* Note input if abnormal or note present */}
            {item.status === 'abnormal' && (
              <div className="mt-1">
                <input
                  type="text"
                  value={item.note || ''}
                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                  placeholder="ระบุอาการผิดปกติ เช่น น้ำมันรั่วซึมข้อต่อด้านล่าง, ซิลิกาเจลเปลี่ยนเป็นสีชมพู..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-800 placeholder-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
