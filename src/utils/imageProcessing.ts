/**
 * Compresses an image file and optionally stamps inspection watermark metadata
 * (Transformer ID, Timestamp, GPS Coordinates, Inspector) directly onto the image canvas.
 */
export async function processAndWatermarkImage(
  file: File,
  options: {
    transformerId?: string;
    timestamp?: string;
    latitude?: number | null;
    longitude?: number | null;
    inspectorName?: string;
    statusText?: string;
    applyWatermark?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const {
    transformerId = '',
    timestamp = new Date().toLocaleString('th-TH'),
    latitude = null,
    longitude = null,
    inspectorName = '',
    statusText = '',
    applyWatermark = true,
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถประมวลผลรูปภาพได้'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('ไม่สามารถสร้าง Canvas Context ได้'));
          return;
        }

        // Draw original scaled image
        ctx.drawImage(img, 0, 0, width, height);

        // Apply inspection metadata watermark banner if enabled
        if (applyWatermark) {
          const fontSize = Math.max(14, Math.round(width * 0.022));
          const lineHeight = fontSize * 1.45;
          const padding = fontSize * 0.8;

          const lines: string[] = [];
          if (transformerId) {
            lines.push(`หม้อแปลง: ${transformerId}`);
          }
          lines.push(`วัน-เวลา: ${timestamp}`);
          if (latitude !== null && longitude !== null) {
            lines.push(`พิกัด: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
          if (inspectorName) {
            lines.push(`ผู้ตรวจ: ${inspectorName}`);
          }
          if (statusText) {
            lines.push(`ผลตรวจ: ${statusText}`);
          }

          const bannerHeight = lines.length * lineHeight + padding * 2;

          // Semi-transparent dark gradient banner at bottom
          ctx.save();
          const gradient = ctx.createLinearGradient(0, height - bannerHeight - 20, 0, height);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.75)');
          gradient.addColorStop(1, 'rgba(15, 23, 42, 0.92)');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, height - bannerHeight - 20, width, bannerHeight + 20);

          // Yellow accent left stripe
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(0, height - bannerHeight, 8, bannerHeight);

          // Text styling
          ctx.font = `600 ${fontSize}px sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          lines.forEach((line, idx) => {
            const y = height - bannerHeight + padding + (idx + 1) * lineHeight - 4;
            ctx.fillText(line, padding + 12, y);
          });

          // Top right small branding tag
          const tagSize = Math.max(12, Math.round(width * 0.016));
          ctx.font = `700 ${tagSize}px sans-serif`;
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('⚡ PEA / MEA Transformer Inspection', width - padding - ctx.measureText('⚡ PEA / MEA Transformer Inspection').width, height - padding);

          ctx.restore();
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('ไม่สามารถแปลงรูปภาพเป็น Blob ได้'));
              return;
            }
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve({ blob, dataUrl, width, height });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
