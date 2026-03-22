import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Upload an image from a local file URI to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadImage(
  uri: string,
  bucket: string = 'ticket-photos',
  folder: string = 'before'
): Promise<string> {
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, decode(base64), {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
