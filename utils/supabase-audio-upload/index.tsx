import { supabase } from "@/config/supabase";

export interface AudioFileMetadata {
  id?: string;
  room_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: 'stem' | 'loop' | 'mix';
  uploaded_by: string;
  created_at?: string;
  description?: string;
}

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aiff',
  'audio/x-aiff',
  'audio/flac',
  'audio/ogg',
  'audio/m4a',
  'audio/aac'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function uploadAudioFile(
  file: File,
  roomId: string,
  fileType: 'stem' | 'loop' | 'mix',
  uploadedBy: string,
  description?: string
): Promise<AudioFileMetadata | null> {
  try {
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only audio files are allowed.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 100MB.');
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${roomId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('soundscape-audio')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Error uploading audio file: ', uploadError);
      return null;
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/soundscape-audio/${filePath}`;

    const metadata: Omit<AudioFileMetadata, 'id' | 'created_at'> = {
      room_id: roomId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: fileType,
      uploaded_by: uploadedBy,
      description: description || ''
    };

    const { data: dbData, error: dbError } = await supabase
      .from('soundscape_audio_files')
      .insert([metadata])
      .select()
      .single();

    if (dbError) {
      await supabase.storage
        .from('soundscape-audio')
        .remove([filePath]);
      console.error('Error uploading audio file: ', dbError);
      return null;
    }

    return {
      ...dbData,
      file_path: fileUrl
    };

  } catch (error: any) {
    console.error('Error uploading audio file: ', error.message);
    return null;
  }
}

export async function getAudioFiles(roomId: string): Promise<AudioFileMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('soundscape_audio_files')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching audio files: ', error);
      return [];
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching audio files: ', error.message);
    return [];
  }
}

export async function deleteAudioFile(fileId: string, filePath: string): Promise<boolean> {
  try {
    const { error: dbError } = await supabase
      .from('soundscape_audio_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Error deleting audio file: ', dbError);
      return false;
    }

    const { error: storageError } = await supabase.storage
      .from('soundscape-audio')
      .remove([filePath]);

    if (storageError) {
      console.warn('File deleted from database but not from storage:', storageError);
    }

    return true;
  } catch (error: any) {
    console.error('Error deleting audio file: ', error.message);
    return false;
  }
}

export async function downloadAudioFile(filePath: string, fileName: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('soundscape-audio')
      .download(filePath);

    if (error) {
      console.error('Error downloading audio file: ', error);
      return;
    }

    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error downloading audio file: ', error.message);
    return;
  }
} 