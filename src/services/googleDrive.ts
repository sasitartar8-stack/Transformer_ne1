import { getAccessToken } from './auth';

export const DEFAULT_DRIVE_FOLDER_ID = '1Hdc14mV3CpJyQGis1MmTA4xbNVbju_lu';

/**
 * Uploads a file (blob/dataUrl) directly to Google Drive in the specified folder.
 * Uses Google Drive v3 REST API multipart upload with exponential backoff retry.
 */
export async function uploadFileToGoogleDrive(
  fileData: Blob | File,
  fileName: string,
  folderId: string = DEFAULT_DRIVE_FOLDER_ID,
  mimeType: string = 'image/jpeg',
  onProgress?: (percent: number) => void
): Promise<{ fileId: string; webViewLink: string; webContentLink?: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบ Google เพื่ออัปโหลดไฟล์ไปยัง Google Drive');
  }

  // Metadata part
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : [],
    mimeType: mimeType,
    description: `รูปภาพการตรวจสอบหม้อแปลงไฟฟ้า บันทึกเมื่อ ${new Date().toLocaleString('th-TH')}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaPartHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  // Combine into multipart payload
  const arrayBuffer = await fileData.arrayBuffer();
  const metadataBlob = new Blob([metadataPart]);
  const mediaHeaderBlob = new Blob([mediaPartHeader]);
  const closeBlob = new Blob([closeDelimiter]);

  const multipartBody = new Blob(
    [metadataBlob, mediaHeaderBlob, arrayBuffer, closeBlob],
    { type: `multipart/related; boundary=${boundary}` }
  );

  // Exponential backoff retry loop (max 3 retries)
  let attempt = 0;
  const maxRetries = 3;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      if (onProgress) onProgress(30 + attempt * 20);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Google Drive API Rate/Server error (${response.status}): ${errorText}`);
        }
        throw new Error(`ไม่สามารถอัปโหลดไปยัง Google Drive ได้ (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      if (onProgress) onProgress(100);

      // Attempt to set read permission if needed so link is easily accessible
      try {
        await fetch(
          `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              role: 'reader',
              type: 'anyone',
            }),
          }
        );
      } catch (permErr) {
        // Non-blocking if organization policy blocks public links
        console.warn('Could not set public permission:', permErr);
      }

      return {
        fileId: data.id,
        webViewLink:
          data.webViewLink ||
          `https://drive.google.com/file/d/${data.id}/view?usp=sharing`,
        webContentLink: data.webContentLink,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      attempt++;
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('อัปโหลดรูปภาพไปยัง Google Drive ไม่สำเร็จ');
}
