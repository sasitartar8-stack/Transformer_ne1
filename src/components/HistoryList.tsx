import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  ExternalLink,
  RefreshCw,
  MapPin,
  Calendar,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Zap,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { SheetRowRecord } from '../types';
import { fetchInspectionHistory } from '../services/googleSheets';

interface HistoryListProps {
  sheetId: string;
  folderId: string;
  onSelectTransformer: (transformerId: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  sheetId,
  folderId,
  onSelectTransformer,
}) => {
  const [records, setRecords] = useState<SheetRowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInspectionHistory(sheetId);
      setRecords(data);
    } catch (err: unknown) {
      console.error('Failed to load history:', err);
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลจาก Google Sheet ได้';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [sheetId]);

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.transformerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.inspectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.remarks.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'normal'
        ? rec.status.includes('ปกติ')
        : filterStatus === 'warning'
        ? rec.status.includes('เฝ้าระวัง')
        : rec.status.includes('ชำรุด') || rec.status.includes('วิกฤต');

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statusStr: string) => {
    if (statusStr.includes('ปกติ')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          ปกติ
        </span>
      );
    }
    if (statusStr.includes('เฝ้าระวัง')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          เฝ้าระวัง
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        ชำรุดวิกฤต
      </span>
    );
  };

  // Helper to extract links from photo URLs text
  const parsePhotoLinks = (photoText: string) => {
    if (!photoText || photoText === 'ไม่มีรูปภาพ' || photoText === '-') return [];
    // Extract URLs starting with http
    const lines = photoText.split('\n');
    const links: { label: string; url: string }[] = [];
    lines.forEach((line) => {
      const match = line.match(/(https?:\/\/[^\s]+)/);
      if (match) {
        const label = line.split(':')[0] || 'ภาพถ่าย';
        links.push({ label: label.trim(), url: match[1] });
      }
    });
    return links;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-[28px] p-6 border border-[#E0E5F2] shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F4F7FE]">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#1B2559] flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#4318FF]/10 text-[#4318FF]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span>ประวัติการตรวจสอบหม้อแปลงทั้งหมด</span>
            </h2>
            <p className="text-xs font-medium text-[#A3AED0] mt-0.5">
              ดึงข้อมูลสดจาก Google Sheet (ID: {sheetId.substring(0, 12)}...)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadHistory}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4F7FE] hover:bg-[#E0E5F2] text-[#1B2559] font-bold text-xs border border-[#E0E5F2] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูล</span>
            </button>

            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4318FF] hover:bg-[#3311db] text-white font-bold text-xs shadow-md shadow-[#4318FF]/20 transition-all"
            >
              <span>เปิดชีตต้นฉบับ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#A3AED0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามรหัสหม้อแปลง, ชื่อผู้ตรวจ, หรือข้อสังเกต..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4F7FE] border-none text-xs font-bold text-[#1B2559] placeholder-[#A3AED0] focus:ring-2 focus:ring-[#4318FF] focus:outline-none"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                filterStatus === 'all'
                  ? 'bg-[#1B2559] text-white'
                  : 'bg-[#F4F7FE] text-[#707EAE] hover:text-[#1B2559]'
              }`}
            >
              ทั้งหมด ({records.length})
            </button>
            <button
              onClick={() => setFilterStatus('normal')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                filterStatus === 'normal'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#F4F7FE] text-[#707EAE] hover:text-[#1B2559]'
              }`}
            >
              🟢 ปกติ
            </button>
            <button
              onClick={() => setFilterStatus('warning')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                filterStatus === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#F4F7FE] text-[#707EAE] hover:text-[#1B2559]'
              }`}
            >
              🟡 เฝ้าระวัง
            </button>
            <button
              onClick={() => setFilterStatus('critical')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                filterStatus === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#F4F7FE] text-[#707EAE] hover:text-[#1B2559]'
              }`}
            >
              🔴 ชำรุด
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-5 rounded-[24px] bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>ไม่สามารถโหลดข้อมูลจาก Google Sheet</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-[28px] border border-[#E0E5F2]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4318FF] mb-3" />
          <p className="text-sm font-black text-[#1B2559]">กำลังดึงข้อมูลจาก Google Sheets...</p>
          <p className="text-xs text-[#A3AED0] mt-1">กรุณารอสักครู่</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-[28px] border border-[#E0E5F2] p-6">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-[#A3AED0] mb-3 opacity-60" />
          <p className="text-base font-black text-[#1B2559]">ไม่พบประวัติการตรวจสอบ</p>
          <p className="text-xs font-medium text-[#A3AED0] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง'
              : 'ยังไม่มีประวัติในชีตนี้ เริ่มต้นด้วยการกรอกแบบฟอร์มรายงานใหม่'}
          </p>
        </div>
      ) : (
        /* Records List */
        <div className="space-y-4">
          {filteredRecords.map((rec) => {
            const photoLinks = parsePhotoLinks(rec.photoUrls);

            return (
              <div
                key={rec.rowNumber}
                className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#E0E5F2] hover:border-[#4318FF]/40 shadow-sm transition-all flex flex-col gap-4"
              >
                {/* Top Row: Transformer ID, Status, Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#F4F7FE]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center font-black text-sm">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-[#1B2559]">
                          {rec.transformerId}
                        </span>
                        {getStatusBadge(rec.status)}
                      </div>
                      <p className="text-xs font-semibold text-[#A3AED0] mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{rec.dateTime}</span>
                        <span>•</span>
                        <span>ช่างผู้ตรวจ: {rec.inspectorName || '-'}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTransformer(rec.transformerId)}
                    className="flex items-center gap-1 text-xs font-black text-[#4318FF] hover:text-[#3311db] self-start sm:self-auto"
                  >
                    <span>ตรวจซ้ำรหัสนี้</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Middle: Details & Remarks */}
                {rec.remarks && rec.remarks !== '-' && (
                  <div className="text-xs text-[#1B2559] bg-[#F4F7FE] p-3.5 rounded-2xl border border-[#E0E5F2]">
                    <span className="font-bold text-[#707EAE]">ข้อสังเกต: </span>
                    {rec.remarks}
                  </div>
                )}

                {/* Bottom info: Location & Photos */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  {/* Location info */}
                  <div className="flex items-center gap-2 text-[#707EAE] font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#4318FF]" />
                    <span>พิกัด: {rec.latitude && rec.longitude && rec.latitude !== '-' ? `${rec.latitude}, ${rec.longitude}` : '-'}</span>
                    {rec.mapsUrl && rec.mapsUrl.startsWith('http') && (
                      <a
                        href={rec.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4318FF] hover:underline font-bold ml-1 inline-flex items-center gap-0.5"
                      >
                        [ดูแผนที่] <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {/* Photos links */}
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-[#4318FF]" />
                    <span className="text-[#707EAE] font-semibold">รูปภาพ ({photoLinks.length}):</span>
                    {photoLinks.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {photoLinks.map((p, idx) => (
                          <a
                            key={idx}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-[#F4F7FE] hover:bg-[#4318FF] hover:text-white text-[#4318FF] font-bold text-[11px] border border-[#E0E5F2] transition-colors"
                          >
                            {p.label || `ภาพ #${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#A3AED0]">ไม่มีรูปภาพ</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
