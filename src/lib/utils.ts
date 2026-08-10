import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "./firebase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatSizeLabel(size?: string): string {
  if (!size) return '';
  if (size === '1 pedaço') return '1 item';
  if (size === '2 pedaços') return '2 itens';
  return size;
}

// Calculate distance in meters using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Resizes an image client-side and uploads it to Firebase Storage, returning
// a short download URL — used instead of embedding a base64 data URI
// directly in a Firestore document, which bloats every document that
// references it and makes every read of that collection slow (menus,
// company settings, etc. loading in minutes instead of instantly).
export function compressAndUploadImage(
  file: File,
  storagePath: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          try {
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
            const url = await getDownloadURL(storageRef);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Uploads an already-inlined base64 image (e.g. a legacy imageUrl saved
// directly into a Firestore document) to Firebase Storage, returning the
// new download URL. Used to migrate old documents the first time they're
// loaded, without needing a separate one-off migration script.
export async function migrateBase64ImageToStorage(dataUrl: string, storagePath: string): Promise<string> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(storageRef);
}
