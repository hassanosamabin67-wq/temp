import { supabase } from "@/config/supabase";

export interface VideoFileMetadata {
  id?: string;
  room_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: 'commentary' | 'demo' | 'process';
  uploaded_by: string;
  created_at?: string;
  description?: string;
}

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/3gpp',
  'video/3gpp2'
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function uploadVideoFile(
  file: File,
  roomId: string,
  fileType: 'commentary' | 'demo' | 'process',
  uploadedBy: string,
  description?: string
): Promise<VideoFileMetadata | null> {
  try {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only video files are allowed.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 500MB.');
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${roomId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('art-exhibit-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Error uploading video file: ', uploadError);
      return null;
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/art-exhibit-videos/${filePath}`;

    const metadata: Omit<VideoFileMetadata, 'id' | 'created_at'> = {
      room_id: roomId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: fileType,
      uploaded_by: uploadedBy,
      description: description || ''
    };

    const { data: dbData, error: dbError } = await supabase
      .from('art_exhibit_videos')
      .insert([metadata])
      .select()
      .single();

    if (dbError) {
      await supabase.storage
        .from('art-exhibit-videos')
        .remove([filePath]);
      console.error('Error saving video metadata: ', dbError);
      return null;
    }

    return {
      ...dbData,
      file_path: fileUrl
    };

  } catch (error: any) {
    console.error('Error uploading video file: ', error.message);
    return null;
  }
}

export async function getVideoFiles(roomId: string): Promise<VideoFileMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('art_exhibit_videos')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching video files: ', error);
      return [];
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching video files: ', error.message);
    return [];
  }
}

export async function deleteVideoFile(fileId: string, filePath: string): Promise<boolean> {
  try {
    const { error: dbError } = await supabase
      .from('art_exhibit_videos')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Error deleting video file: ', dbError);
      return false;
    }

    const { error: storageError } = await supabase.storage
      .from('art-exhibit-videos')
      .remove([filePath]);

    if (storageError) {
      console.warn('File deleted from database but not from storage:', storageError);
    }

    return true;
  } catch (error: any) {
    console.error('Error deleting video file: ', error.message);
    return false;
  }
}

export async function downloadVideoFile(filePath: string, fileName: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('art-exhibit-videos')
      .download(filePath);

    if (error) {
      console.error('Error downloading video file: ', error);
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
    console.error('Error downloading video file: ', error.message);
    return;
  }
} 