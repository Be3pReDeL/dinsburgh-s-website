import type { SiteContent } from '../types';
import { defaultContent } from './defaultContent';
import {
  loadStoredContent,
  saveStoredContent,
  sanitizeContent,
} from './storage';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const CONTENT_ROW_ID = 'default';
const STORAGE_BUCKET = 'media';

const createRandomId = () => {
  const bytes = new Uint8Array(8);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error('Не удалось прочитать файл.'));
    reader.readAsDataURL(file);
  });

export const fetchContent = async (): Promise<SiteContent> => {
  if (!isSupabaseConfigured || !supabase) {
    return loadStoredContent() ?? defaultContent;
  }

  const { data, error } = await supabase
    .from('site_content')
    .select('content')
    .eq('id', CONTENT_ROW_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const loaded = sanitizeContent(data?.content ?? defaultContent);
  saveStoredContent(loaded);
  return loaded;
};

export const saveContent = async (content: SiteContent) => {
  if (!isSupabaseConfigured || !supabase) {
    saveStoredContent(content);
    return;
  }

  const { error } = await supabase.from('site_content').upsert(
    {
      id: CONTENT_ROW_ID,
      content,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'id',
    }
  );

  if (error) {
    throw error;
  }

  saveStoredContent(content);
};

export const uploadImage = async (file: File, folder: string) => {
  if (!isSupabaseConfigured || !supabase) {
    return readFileAsDataUrl(file);
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const filePath = `${folder}/${Date.now()}-${createRandomId()}.${extension}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || 'image/*',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};
