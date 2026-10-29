import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgqijvotvfdwmydmkszb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncWlqdm90dmZkd215ZG1rc3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyOTg1MDUsImV4cCI6MjEwODg3NDUwNX0.mFfK06sGVsW2bJc5lYUo2rPr4dONS3Z4MOHxkb9c-SY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StorageBucket = 
  | 'class-proofs' 
  | 'travel-receipts' 
  | 'client-measurements' 
  | 'issue-attachments';

export function getStorageUrl(bucket: StorageBucket | string, path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  folderPrefix: string = ''
): Promise<{ publicUrl: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = folderPrefix ? `${folderPrefix}/${cleanFileName}` : cleanFileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { publicUrl: '', error: uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { publicUrl: data.publicUrl };
  } catch (err: any) {
    return { publicUrl: '', error: err.message || 'Image upload failed' };
  }
}
