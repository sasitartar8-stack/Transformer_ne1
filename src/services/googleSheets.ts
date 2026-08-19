import { getAccessToken } from './auth';
import { TransformerInspectionData, SheetRowRecord } from '../types';

export const DEFAULT_SHEET_ID = '1NteUHu_fLOr205Lxh6jjV0YaCHQvPbjB_acj6S9sBMI';

export const SHEET_HEADERS = [
  'วัน-เวลาตรวจเช็ค',
  'หมายเลขหม้อแปลง',
  'ผลการตรวจสอบ',
  'ระดับความเร่งด่วน',
  'สรุปรายการตรวจเช็ค',
  'รายละเอียด / ข้อสังเกต',
  'ละติจูด (Lat)',
  'ลองจิจูด (Lng)',
  'ความแม่นยำ GPS (ม.)',
  'ลิงก์ Google Maps',
  'ลิงก์รูปถ่าย Google Drive',
  'ผู้ตรวจเช็ค',
  'อีเมลผู้บันทึก',
  'เวลาบันทึกลงระบบ',
];

/**
 * Gets sheet names and info for the target spreadsheet
 */
export async function getSpreadsheetInfo(sheetId: string = DEFAULT_SHEET_ID): Promise<{
  title: string;
  sheets: string[];
}> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อเข้าถึง Google Sheets');
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title,sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ไม่สามารถเปิด Google Sheet ได้ (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map(
    (s: { properties?: { title?: string } }) => s.properties?.title || 'Sheet1'
  );

  return {
    title: data.properties?.title || 'เอกสารบันทึกหม้อแปลง',
    sheets: sheets.length > 0 ? sheets : ['Sheet1'],
  };
}

/**
 * Ensures header row exists in the specified sheet tab
 */
export async function ensureSheetHeaders(
  sheetId: string = DEFAULT_SHEET_ID,
  sheetTitle: string
): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  try {
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
        sheetTitle
      )}!A1:N1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data.values && data.values.length > 0 && data.values[0].length > 0) {
        // Headers already exist
        return;
      }
    }

    // Insert headers if empty
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
        sheetTitle
      )}!A1:N1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${sheetTitle}!A1:N1`,
          majorDimension: 'ROWS',
          values: [SHEET_HEADERS],
        }),
      }
    );
  } catch (e) {
    console.warn('Check/insert headers warning:', e);
  }
}

/**
 * Appends a new inspection record row to Google Sheets
 */
export async function appendInspectionRecord(
  data: TransformerInspectionData,
  sheetId: string = DEFAULT_SHEET_ID,
  sheetTitle?: string
): Promise<{ success: boolean; updatedRange?: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อบันทึกข้อมูล');
  }

  // Resolve sheet title if not provided
  let targetSheetTitle = sheetTitle;
  if (!targetSheetTitle) {
    try {
      const info = await getSpreadsheetInfo(sheetId);
      targetSheetTitle = info.sheets[0] || 'Sheet1';
    } catch {
      targetSheetTitle = 'Sheet1';
    }
  }

  // Make sure headers exist
  await ensureSheetHeaders(sheetId, targetSheetTitle);

  // Prepare checklist summary string
  const checklistSummary = data.checklist
    .map((item) => {
      const statusIcon =
        item.status === 'normal'
          ? '✓ ปกติ'
          : item.status === 'abnormal'
          ? '✗ ผิดปกติ'
          : '- ไม่ได้ตรวจ';
      return `[${item.label}: ${statusIcon}${item.note ? ` (${item.note})` : ''}]`;
    })
    .join(' | ');

  const urgencyText =
    data.inspectionStatus === 'critical'
      ? 'ด่วนที่สุด (วิกฤต)'
      : data.inspectionStatus === 'warning'
      ? 'เฝ้าระวัง'
      : 'ปกติ';

  const statusLabel =
    data.inspectionStatus === 'normal'
      ? '🟢 ปกติ'
      : data.inspectionStatus === 'warning'
      ? '🟡 เฝ้าระวัง/มีจุดผิดปกติ'
      : '🔴 ชำรุดวิกฤต/ต้องซ่อมด่วน';

  const mapsLink =
    data.latitude && data.longitude
      ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
      : '-';

  const drivePhotoLinks = data.photos
    .map((p, idx) => `${p.label || `ภาพที่ ${idx + 1}`}: ${p.driveViewLink || '-'}`)
    .join('\n');

  const rowValues = [
    data.inspectionDateTime || new Date().toLocaleString('th-TH'),
    data.transformerId,
    statusLabel,
    urgencyText,
    checklistSummary || data.statusSummary,
    data.detailedRemarks || '-',
    data.latitude ? String(data.latitude) : '-',
    data.longitude ? String(data.longitude) : '-',
    data.locationAccuracy ? `${Math.round(data.locationAccuracy)} ม.` : '-',
    mapsLink,
    drivePhotoLinks || 'ไม่มีรูปภาพ',
    data.inspectorName || '-',
    data.inspectorEmail || '-',
    new Date().toLocaleString('th-TH'),
  ];

  // Append row
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    targetSheetTitle
  )}!A:N:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${targetSheetTitle}!A:N`,
      majorDimension: 'ROWS',
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`บันทึกข้อมูลลง Google Sheet ไม่สำเร็จ (${res.status}): ${errText}`);
  }

  const result = await res.json();
  return {
    success: true,
    updatedRange: result.updates?.updatedRange,
  };
}

/**
 * Fetches recent inspection history from Google Sheets
 */
export async function fetchInspectionHistory(
  sheetId: string = DEFAULT_SHEET_ID,
  sheetTitle?: string
): Promise<SheetRowRecord[]> {
  const token = await getAccessToken();
  if (!token) return [];

  let targetSheetTitle = sheetTitle;
  if (!targetSheetTitle) {
    try {
      const info = await getSpreadsheetInfo(sheetId);
      targetSheetTitle = info.sheets[0] || 'Sheet1';
    } catch {
      targetSheetTitle = 'Sheet1';
    }
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    targetSheetTitle
  )}!A2:N1000`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.warn('Failed to fetch inspection history from sheet');
    return [];
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  return rows
    .map((row, index) => ({
      rowNumber: index + 2,
      dateTime: row[0] || '',
      transformerId: row[1] || '',
      status: row[2] || '',
      statusLevel: row[3] || '',
      checklistSummary: row[4] || '',
      remarks: row[5] || '',
      latitude: row[6] || '',
      longitude: row[7] || '',
      accuracy: row[8] || '',
      mapsUrl: row[9] || '',
      photoUrls: row[10] || '',
      inspectorName: row[11] || '',
      inspectorEmail: row[12] || '',
      createdAt: row[13] || '',
    }))
    .reverse(); // Show newest first
}
