export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
  source?: 'gps_high' | 'network' | 'ip_fallback' | 'manual';
}

/**
 * Checks the current browser permission state for geolocation
 */
export async function checkLocationPermissionState(): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

/**
 * Gets device location with automatic fallback from High-Accuracy GPS to Network Triangulation
 */
export function getCurrentDeviceLocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('อุปกรณ์หรือบราวเซอร์นี้ไม่รองรับการระบุพิกัด GPS (Geolocation API)'));
      return;
    }

    // Attempt 1: High Accuracy GPS (best for mobile devices with hardware GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
          source: 'gps_high',
        });
      },
      (error) => {
        // If permission is explicitly denied, do not retry
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('ผู้ใช้ปฏิเสธการเข้าถึงสิทธิ์ตำแหน่ง GPS (Permission Denied) กรุณากดอนุญาตการเข้าถึง Location'));
          return;
        }

        // Attempt 2: Fallback to standard network location (best for laptops/PCs or indoor)
        console.warn('High accuracy GPS timed out or unavailable, trying network location fallback...');
        navigator.geolocation.getCurrentPosition(
          (netPos) => {
            resolve({
              latitude: netPos.coords.latitude,
              longitude: netPos.coords.longitude,
              accuracy: netPos.coords.accuracy,
              altitude: netPos.coords.altitude,
              timestamp: netPos.timestamp,
              source: 'network',
            });
          },
          (netError) => {
            let msg = 'ไม่สามารถดึงตำแหน่ง GPS ได้';
            switch (netError.code) {
              case netError.PERMISSION_DENIED:
                msg = 'ผู้ใช้ปฏิเสธการเข้าถึงสิทธิ์ตำแหน่ง GPS กรุณาเปิดสิทธิ์ Location ในบราวเซอร์';
                break;
              case netError.POSITION_UNAVAILABLE:
                msg = 'สัญญาณ GPS ขัดข้องหรือไม่พร้อมใช้งาน (Position Unavailable)';
                break;
              case netError.TIMEOUT:
                msg = 'หมดเวลาในการค้นหาสัญญาณ GPS กรุณาลองใหม่อีกครั้งหรือกรอกพิกัดด้วยตนเอง';
                break;
            }
            reject(new Error(msg));
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Generates a Google Maps link for the given coordinates
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Generates an OpenStreetMap embed view or link
 */
export function getMapPreviewUrl(latitude: number, longitude: number): string {
  const delta = 0.003;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
}

/**
 * Preset common locations in Thailand for quick testing / selection
 */
export const THAILAND_PRESET_LOCATIONS = [
  { name: 'กฟภ. สำนักงานใหญ่ (PEA HQ)', lat: 13.851482, lng: 100.563085 },
  { name: 'กฟน. สำนักงานใหญ่ คลองเตย (MEA HQ)', lat: 13.722513, lng: 100.559864 },
  { name: 'สถานีไฟฟ้าต้นทางบางกะปิ (Substation)', lat: 13.766122, lng: 100.643211 },
  { name: 'สถานีไฟฟ้าย่อยเชียงใหม่ 1 (PEA CNX)', lat: 18.790382, lng: 98.986214 },
  { name: 'สถานีไฟฟ้าย่อยชลบุรี (PEA Chonburi)', lat: 13.361143, lng: 100.984672 },
];
