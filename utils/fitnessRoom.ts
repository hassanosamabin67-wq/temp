import { supabase } from "@/config/supabase";

export type FitnessFileRecord = {
  id: string;
  room_id: string;
  name: string;
  type: string;
  is_paid: boolean;
  price: number;
  file_url: string;
  file_size: number;
  created_at?: string;
};

export type PrivateUploadRecord = {
  id: string;
  room_id: string;
  name: string;
  file_url: string;
  file_size: number;
  created_at?: string;
};

export type TimerSettingsRecord = {
  room_id: string;
  mode: "stopwatch" | "countdown" | "interval";
  countdown_minutes: number;
  interval_work: number;
  interval_rest: number;
  interval_rounds: number;
};

export interface ParticipantRecord {
  id: string;
  think_tank_id: string;
  participant_id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export interface WorkoutProgramRecord {
  id: string;
  room_id: string;
  name: string;
  description: string;
  duration: number;
  days: Array<{ day: number; title: string; description: string }>;
  created_by: string;
  created_at: string;
}

export async function fetchRoomData(roomId: string) {
  const [filesRes, uploadsRes, pinRes, timerRes] = await Promise.all([
    supabase.from("fitness_room_files").select("id, room_id, name, type, is_paid, price, file_url, file_size, created_at").eq("room_id", roomId),
    supabase.from("fitness_room_private_uploads").select("id, room_id, name, file_url, file_size, created_at").eq("room_id", roomId).order("created_at", { ascending: false }),
    supabase.from("fitness_room_pin").select("room_id, message").eq("room_id", roomId).maybeSingle(),
    supabase.from("fitness_timer_settings").select("room_id, mode, countdown_minutes, interval_work, interval_rest, interval_rounds").eq("room_id", roomId).maybeSingle(),
  ]);

  if (filesRes.error) throw filesRes.error;
  if (uploadsRes.error) throw uploadsRes.error;
  if (pinRes.error && pinRes.error.code !== "PGRST116") throw pinRes.error;
  if (timerRes.error && timerRes.error.code !== "PGRST116") throw timerRes.error;

  return {
    files: (filesRes.data ?? []) as FitnessFileRecord[],
    privateUploads: (uploadsRes.data ?? []) as PrivateUploadRecord[],
    pinnedMessage: (pinRes.data as any)?.message ?? "",
    timerSettings: (timerRes.data as any) ?? null,
  };
}

// File validation helper
export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (file.type !== "application/pdf") {
    return { isValid: false, error: "Only PDF files are allowed" };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 10MB" };
  }

  return { isValid: true };
}

// Upload file to Supabase Storage
export async function uploadFileToStorage(file: File, bucket: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function addResourceFile(roomId: string, file: File, metadata: { name: string; type: string; is_paid: boolean; price: number }) {
  // Validate file
  const validation = validatePDFFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Generate unique file path
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const filePath = `fitness-rooms/${roomId}/resources/${fileName}`;

  // Upload to storage
  const fileUrl = await uploadFileToStorage(file, "fitness-room-files", filePath);

  // Save to database
  const { data, error } = await supabase
    .from("fitness_room_files")
    .insert({
      room_id: roomId,
      name: metadata.name,
      type: metadata.type,
      is_paid: metadata.is_paid,
      price: metadata.price,
      file_url: fileUrl,
      file_size: file.size
    })
    .select()
    .single();

  if (error) throw error;
  return data as FitnessFileRecord;
}

export async function addPrivateUpload(roomId: string, file: File) {
  // Generate unique file path
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const filePath = `fitness-rooms/${roomId}/private/${fileName}`;

  // Upload to storage
  const fileUrl = await uploadFileToStorage(file, "fitness-room-files", filePath);

  // Save to database
  const { data, error } = await supabase
    .from("fitness_room_private_uploads")
    .insert({
      room_id: roomId,
      name: file.name,
      file_url: fileUrl,
      file_size: file.size
    })
    .select()
    .single();

  if (error) throw error;
  return data as PrivateUploadRecord;
}

export async function setPinnedMessage(roomId: string, message: string) {
  const { error } = await supabase
    .from("fitness_room_pin")
    .upsert({ room_id: roomId, message }, { onConflict: "room_id" });
  if (error) throw error;
  return { room_id: roomId, message };
}

export async function saveTimerSettings(roomId: string, settings: TimerSettingsRecord) {
  const { error } = await supabase
    .from("fitness_timer_settings")
    .upsert(
      { ...settings, room_id: roomId },
      { onConflict: "room_id, mode" }
    );

  if (error) throw error;
  return settings;
}

// Fetch participants
export async function fetchParticipants(roomId: string): Promise<ParticipantRecord[]> {
  const { data, error } = await supabase
    .from("think_tank_participants")
    .select(`
      id,
      think_tank_id,
      participant_id,
      status,
      created_at,
      users:participant_id (
        firstName,
        lastName,
        email
      )
    `)
    .eq("think_tank_id", roomId)
    .eq("status", 'Accepted')
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Map profiles data to flat structure
  return (data || []).map((p: any) => ({
    id: p.id,
    think_tank_id: p.think_tank_id,
    participant_id: p.participant_id,
    status: p.status,
    name: `${p.users?.firstName} ${p.users.lastName}`,
    email: p.users?.email || "Unknown",
    created_at: p.created_at,
  }));
}

// Remove participant
export async function removeParticipant(roomId: string, participantId: string) {
  const { error: deleteError } = await supabase
    .from("think_tank_participants")
    .delete()
    .eq("think_tank_id", roomId)
    .eq("participant_id", participantId);

  if (deleteError) throw deleteError;
}

export async function fetchWorkoutPrograms(roomId: string): Promise<WorkoutProgramRecord[]> {
  const { data, error } = await supabase
    .from("workout_programs")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as WorkoutProgramRecord[];
}

// Add workout program
export async function addWorkoutProgram(
  roomId: string,
  program: {
    name: string;
    description: string;
    duration: number;
    days: Array<{ day: number; title: string; description: string }>;
  },
  profileId: string
): Promise<WorkoutProgramRecord> {
  const { data, error } = await supabase
    .from("workout_programs")
    .insert({
      room_id: roomId,
      name: program.name,
      description: program.description,
      duration: program.duration,
      days: program.days,
      created_by: profileId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WorkoutProgramRecord;
}

// Enroll in program
export async function enrollInProgram(programId: string, userId: string) {
  const { error } = await supabase
    .from("program_enrollments")
    .insert({
      program_id: programId,
      user_id: userId,
      enrolled_at: new Date().toISOString(),
      current_day: 1,
      completed: false,
    });

  if (error) {
    // Check if already enrolled
    if (error.code === '23505') { // Unique constraint violation
      throw new Error("Already enrolled in this program");
    }
    throw error;
  }
}

export async function fetchUserEnrollments(userId: string) {
  const { data, error } = await supabase
    .from("program_enrollments")
    .select("*")
    .eq('user_id', userId)

  if (error) throw error;
  return data;
}

export async function fetchProgramEnrollments(programId: string) {
  const { data, error } = await supabase
    .from("program_enrollments")
    .select(`
      *,
      user:users(userId, firstName, lastName, profileImage)
    `)
    .eq('program_id', programId);

  if (error) throw error;
  return data;
}

export async function markProgramCompleted(programId: string, userId: string) {
  const { error } = await supabase
    .from("program_enrollments")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("program_id", programId)
    .eq("user_id", userId);

  if (error) throw error;
}