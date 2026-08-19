import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  RefreshCw,
  Edit2,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Globe,
  X,
  Sparkles,
} from 'lucide-react';
import {
  getCurrentDeviceLocation,
  getGoogleMapsUrl,
  getMapPreviewUrl,
  checkLocationPermissionState,
  THAILAND_PRESET_LOCATIONS,
} from '../utils/location';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address?: string;
  onChange: (lat: number | null, lng: number | null, accuracy: number | null, address?: string) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  accuracy,
  address,
  onChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');
  const [manualMode, setManualMode] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [tempLat, setTempLat] = useState(latitude ? String(latitude) : '');
  const [tempLng, setTempLng] = useState(longitude ? String(longitude) : '');

  // Check permission state on mount
  useEffect(() => {
    checkLocationPermissionState().then((state) => {
      setPermissionState(state);
    });

    if (latitude === null && longitude === null) {
      handleGetLocation(false);
    }
  }, []);

  const handleGetLocation = async (userInitiated = true) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const loc = await getCurrentDeviceLocation();
      onChange(loc.latitude, loc.longitude, loc.accuracy, address);
      setTempLat(String(loc.latitude));
      setTempLng(String(loc.longitude));
      setPermissionState('granted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถดึงตำแหน่ง GPS ได้';
      if (userInitiated) {
        setErrorMsg(msg);
        if (msg.includes('ปฏิเสธ') || msg.includes('Permission Denied')) {
          setPermissionState('denied');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyManual = () => {
    const parsedLat = parseFloat(tempLat);
    const parsedLng = parseFloat(tempLng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setErrorMsg('กรุณากรอกตัวเลขละติจูดและลองจิจูดให้ถูกต้อง');
      return;
    }
    onChange(parsedLat, parsedLng, null, address);
    setManualMode(false);
    setErrorMsg(null);
  };

  const handleSelectPreset = (lat: number, lng: number, name: string) => {
    onChange(lat, lng, 5.0, name);
    setTempLat(String(lat));
    setTempLng(String(lng));
    setManualMode(false);
    setErrorMsg(null);
  };

  const getAccuracyBadge = (acc: number | null) => {
    if (acc === null) return null;
    if (acc <= 10) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          แม่นยำสูง (±{acc.toFixed(1)} ม.)
        </span>
      );
    }
    if (acc <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          ปานกลาง (±{acc.toFixed(1)} ม.)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        ความแม่นยำต่ำ (±{acc.toFixed(1)} ม.)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-[28px] p-6 border border-[#E0E5F2] shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F4F7FE]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#4318FF]/10 text-[#4318FF] border border-[#4318FF]/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#1B2559] flex items-center gap-2">
              <span>4. พิกัดตำแหน่งหม้อแปลง (GPS Location)</span>
              <span className="text-rose-500 text-xs font-bold">*จำเป็น</span>
            </h3>
            <p className="text-xs font-medium text-[#A3AED0]">
              ระบบดึงพิกัดจากดาวเทียม GPS เพื่อประทับลงภาพถ่ายและบันทึกลง Google Sheet
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowPermissionGuide(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F4F7FE] hover:bg-[#E0E5F2] text-[#707EAE] hover:text-[#1B2559] text-xs font-bold transition-colors border border-[#E0E5F2]"
            title="ดูคำแนะนำการเปิดสิทธิ์ Location"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>วิธีเปิดสิทธิ์ GPS</span>
          </button>

          <button
            type="button"
            onClick={() => handleGetLocation(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4318FF] hover:bg-[#3311db] text-white text-xs font-bold transition-all shadow-[0_8px_18px_rgba(67,24,255,0.25)] hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'กำลังค้นหาพิกัด...' : '📍 ดึงพิกัด GPS อัตโนมัติ'}</span>
          </button>
        </div>
      </div>

      {/* Permission Denied or Error Notification Banner */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="font-extrabold text-amber-950">{errorMsg}</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                หากบราวเซอร์บล็อกการขอตำแหน่ง ให้คลิกที่ไอคอนกุญแจ 🔒 ด้านซ้ายของช่องใส่ URL แล้วเลือก <strong>"อนุญาต (Allow) การระบุตำแหน่ง (Location)"</strong> หรือเลือกตำแหน่งตัวอย่างด้านล่าง
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
            <button
              type="button"
              onClick={() => handleGetLocation(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-sm"
            >
              🔄 ลองขอสิทธิ์อีกครั้ง
            </button>
            <button
              type="button"
              onClick={() => setShowPermissionGuide(true)}
              className="px-3 py-1.5 rounded-xl bg-white text-amber-800 border border-amber-300 font-bold text-xs hover:bg-amber-100/50"
            >
              📖 ดูขั้นตอนการเปิดสิทธิ์
            </button>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="px-3 py-1.5 rounded-xl bg-white text-amber-800 border border-amber-300 font-bold text-xs hover:bg-amber-100/50"
            >
              ✍️ กรอกพิกัดด้วยตนเอง
            </button>
          </div>
        </div>
      )}

      {/* Preset Quick Select for testing / utility office */}
      <div className="mt-4 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-bold text-[#A3AED0] flex items-center gap-1">
          <Globe className="w-3 h-3 text-[#4318FF]" />
          <span>เลือกตำแหน่งตัวอย่าง:</span>
        </span>
        {THAILAND_PRESET_LOCATIONS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => handleSelectPreset(preset.lat, preset.lng, preset.name)}
            className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-[#F4F7FE] text-[#707EAE] hover:bg-[#E0E5F2] hover:text-[#4318FF] transition-colors border border-[#E0E5F2]"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Coordinates Display Card */}
      <div className="mt-4">
        {manualMode ? (
          <div className="p-5 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2] space-y-4">
            <div className="text-xs font-black text-[#1B2559]">กรอกพิกัดด้วยตนเอง (Manual Coordinates)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#707EAE] uppercase mb-1.5">
                  ละติจูด (Latitude):
                </label>
                <input
                  type="text"
                  value={tempLat}
                  onChange={(e) => setTempLat(e.target.value)}
                  placeholder="เช่น 13.756331"
                  className="w-full px-4 py-3 text-xs font-bold rounded-xl bg-white border border-[#E0E5F2] text-[#1B2559] focus:ring-2 focus:ring-[#4318FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#707EAE] uppercase mb-1.5">
                  ลองจิจูด (Longitude):
                </label>
                <input
                  type="text"
                  value={tempLng}
                  onChange={(e) => setTempLng(e.target.value)}
                  placeholder="เช่น 100.501762"
                  className="w-full px-4 py-3 text-xs font-bold rounded-xl bg-white border border-[#E0E5F2] text-[#1B2559] focus:ring-2 focus:ring-[#4318FF] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-[#707EAE] hover:text-[#1B2559] border border-[#E0E5F2]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleApplyManual}
                className="flex items-center gap-1 px-5 py-2 text-xs font-black rounded-xl bg-[#4318FF] hover:bg-[#3311db] text-white shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกพิกัดนี้</span>
              </button>
            </div>
          </div>
        ) : latitude !== null && longitude !== null ? (
          <div className="p-5 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E0E5F2]">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#4318FF]" />
                <span className="text-xs font-black text-[#1B2559]">
                  พิกัดปัจจุบัน: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getAccuracyBadge(accuracy)}
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="p-1.5 rounded-lg text-[#707EAE] hover:text-[#4318FF] hover:bg-white transition-colors"
                  title="แก้ไขพิกัดด้วยตนเอง"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick action buttons & map preview */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#707EAE] flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-[#4318FF]" />
                <span>Lat: <strong className="text-[#1B2559]">{latitude.toFixed(6)}</strong></span>
                <span className="text-[#E0E5F2]">|</span>
                <span>Lng: <strong className="text-[#1B2559]">{longitude.toFixed(6)}</strong></span>
              </div>

              <a
                href={getGoogleMapsUrl(latitude, longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#E0E5F2] text-[#4318FF] border border-[#E0E5F2] text-xs font-bold transition-colors shadow-sm"
              >
                <span>เปิดดูบน Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Mini Map Embed Preview */}
            <div className="mt-3 w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-[#E0E5F2] bg-white shadow-inner">
              <iframe
                title="Transformer Location Map"
                src={getMapPreviewUrl(latitude, longitude)}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#F4F7FE] border-2 border-dashed border-[#E0E5F2]">
            <MapPin className="w-10 h-10 mx-auto text-[#4318FF] mb-2" />
            <p className="text-sm font-black text-[#1B2559]">พร้อมระบุพิกัดตำแหน่ง GPS</p>
            <p className="text-xs font-medium text-[#A3AED0] mt-0.5">
              กดปุ่มด้านล่างเพื่อให้บราวเซอร์ดึงตำแหน่งหน้างานจริงของคุณ
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleGetLocation(true)}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#4318FF] hover:bg-[#3311db] text-white text-xs font-black transition-all shadow-md shadow-[#4318FF]/20"
              >
                {loading ? 'กำลังดึงพิกัด...' : '⚡ กดอนุญาตและดึงพิกัดทันที'}
              </button>
              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#E0E5F2] text-[#1B2559] text-xs font-bold border border-[#E0E5F2] transition-colors"
              >
                กรอกพิกัดเอง
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permission Guide Modal */}
      {showPermissionGuide && (
        <div
          className="fixed inset-0 z-50 bg-[#1B2559]/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowPermissionGuide(false)}
        >
          <div
            className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 border border-[#E0E5F2] shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F4F7FE]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#4318FF]/10 text-[#4318FF]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1B2559]">วิธีเปิดสิทธิ์ตำแหน่ง (Location Permission)</h3>
                  <p className="text-xs text-[#A3AED0] font-medium">แนะนำขั้นตอนสำหรับอุปกรณ์แต่ละประเภท</p>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionGuide(false)}
                className="p-1.5 rounded-full text-[#707EAE] hover:bg-[#F4F7FE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Chrome / Edge on Computer */}
              <div className="p-4 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2] space-y-1.5">
                <p className="font-extrabold text-[#1B2559] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#4318FF] text-white flex items-center justify-center text-[10px]">1</span>
                  สำหรับ Google Chrome / Microsoft Edge บนคอมพิวเตอร์
                </p>
                <ul className="list-disc pl-7 text-[#707EAE] space-y-1">
                  <li>คลิกที่ <strong>ไอคอนแม่กุญแจ 🔒</strong> หรือไอคอนการตั้งค่าด้านซ้ายของช่องใส่ URL</li>
                  <li>ตรงหัวข้อ <strong>Location (ตำแหน่ง)</strong> ให้เปลี่ยนเป็น <strong>Allow (อนุญาต)</strong></li>
                  <li>รีเฟรชหน้าเว็บแล้วกดปุ่มดึงพิกัดอีกครั้ง</li>
                </ul>
              </div>

              {/* iPhone / Safari / iOS */}
              <div className="p-4 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2] space-y-1.5">
                <p className="font-extrabold text-[#1B2559] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#4318FF] text-white flex items-center justify-center text-[10px]">2</span>
                  สำหรับ iPhone / iPad (Safari)
                </p>
                <ul className="list-disc pl-7 text-[#707EAE] space-y-1">
                  <li>ไปที่ <strong>การตั้งค่า (Settings) ➔ ความเป็นส่วนตัวและความปลอดภัย (Privacy & Security)</strong></li>
                  <li>เลือก <strong>บริการหาตำแหน่งที่ตั้ง (Location Services) ➔ Safari</strong></li>
                  <li>เลือก <strong>"ขณะใช้แอป (While Using the App)"</strong></li>
                </ul>
              </div>

              {/* Android Chrome */}
              <div className="p-4 rounded-2xl bg-[#F4F7FE] border border-[#E0E5F2] space-y-1.5">
                <p className="font-extrabold text-[#1B2559] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#4318FF] text-white flex items-center justify-center text-[10px]">3</span>
                  สำหรับ Android (Chrome)
                </p>
                <ul className="list-disc pl-7 text-[#707EAE] space-y-1">
                  <li>แตะจุดสามจุด <strong>⋮ ➔ การตั้งค่า ➔ การตั้งค่าเว็บไซต์ (Site Settings)</strong></li>
                  <li>เลือก <strong>ตำแหน่ง (Location)</strong> และเลือก <strong>อนุญาต (Allowed)</strong></li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowPermissionGuide(false);
                  handleGetLocation(true);
                }}
                className="px-6 py-2.5 rounded-2xl bg-[#4318FF] text-white font-extrabold text-xs shadow-md"
              >
                เข้าใจแล้ว ลองดึงพิกัดใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
