import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgqijvotvfdwmydmkszb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncWlqdm90dmZkd215ZG1rc3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyOTg1MDUsImV4cCI6MjEwODg3NDUwNX0.mFfK06sGVsW2bJc5lYUo2rPr4dONS3Z4MOHxkb9c-SY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getStorageUrl(bucket: string, path: string) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

