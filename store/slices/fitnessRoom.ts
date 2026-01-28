import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addPrivateUpload,
  addResourceFile,
  fetchRoomData,
  saveTimerSettings,
  setPinnedMessage,
  removeParticipant,
  fetchParticipants,
  addWorkoutProgram,
  fetchWorkoutPrograms,
  enrollInProgram,
  FitnessFileRecord,
  PrivateUploadRecord,
  TimerSettingsRecord,
  ParticipantRecord,
  WorkoutProgramRecord,
  fetchUserEnrollments,
  fetchProgramEnrollments,
  markProgramCompleted,
} from "@/utils/fitnessRoom";

export type TimerMode = "stopwatch" | "countdown" | "interval";

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  mode: TimerMode;
  countdownMinutes: number;
  intervalWork: number;
  intervalRest: number;
  intervalRounds: number;
  currentRound: number;
  isWorkPhase: boolean;
}

interface FitnessRoomState {
  roomId: string | null;
  loading: boolean;
  error: string | null;
  files: FitnessFileRecord[];
  privateUploads: PrivateUploadRecord[];
  pinnedMessage: string;
  timer: TimerState;
  uploading: boolean;
  uploadError: string | null;
  participants: ParticipantRecord[];
  workoutPrograms: WorkoutProgramRecord[];
  enrollments: { program_id: string; completed: boolean }[];
  programEnrollments: { [programId: string]: any[] };
}

const initialState: FitnessRoomState = {
  roomId: null,
  loading: false,
  error: null,
  files: [],
  privateUploads: [],
  pinnedMessage: "",
  timer: {
    minutes: 0,
    seconds: 0,
    isRunning: false,
    mode: "stopwatch",
    countdownMinutes: 5,
    intervalWork: 30,
    intervalRest: 15,
    intervalRounds: 5,
    currentRound: 0,
    isWorkPhase: true,
  },
  uploading: false,
  uploadError: null,
  participants: [],
  workoutPrograms: [],
  enrollments: [],
  programEnrollments: {},
};

export const loadRoom = createAsyncThunk(
  "fitnessRoom/loadRoom",
  async (roomId: string) => {
    const data = await fetchRoomData(roomId);
    return { roomId, ...data };
  }
);

export const createResourceFile = createAsyncThunk(
  "fitnessRoom/createResourceFile",
  async (
    args: { roomId: string; file: File; metadata: { name: string; type: string; is_paid: boolean; price: number } },
    { rejectWithValue }
  ) => {
    try {
      const rec = await addResourceFile(args.roomId, args.file, args.metadata);
      return rec;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to upload file');
    }
  }
);

export const createPrivateUpload = createAsyncThunk(
  "fitnessRoom/createPrivateUpload",
  async (
    args: { roomId: string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const rec = await addPrivateUpload(args.roomId, args.file);
      return rec;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to upload file');
    }
  }
);

export const updatePinnedMessage = createAsyncThunk(
  "fitnessRoom/updatePinnedMessage",
  async (args: { roomId: string; message: string }) => {
    await setPinnedMessage(args.roomId, args.message);
    return args.message;
  }
);

export const persistTimerSettings = createAsyncThunk(
  "fitnessRoom/persistTimerSettings",
  async (args: { roomId: string; settings: TimerSettingsRecord }) => {
    await saveTimerSettings(args.roomId, args.settings);
    return args.settings;
  }
);

// New: Participant Management
export const loadParticipants = createAsyncThunk(
  "fitnessRoom/loadParticipants",
  async (roomId: string) => {
    const participants = await fetchParticipants(roomId);
    return participants;
  }
);

export const kickParticipant = createAsyncThunk(
  "fitnessRoom/kickParticipant",
  async (args: { roomId: string; participantId: string }, { rejectWithValue }) => {
    try {
      await removeParticipant(args.roomId, args.participantId);
      return args.participantId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove participant');
    }
  }
);

export const loadWorkoutPrograms = createAsyncThunk(
  "fitnessRoom/loadWorkoutPrograms",
  async (roomId: string) => {
    const programs = await fetchWorkoutPrograms(roomId);
    return programs;
  }
);

export const createWorkoutProgram = createAsyncThunk(
  "fitnessRoom/createWorkoutProgram",
  async (
    args: {
      roomId: string;
      program: {
        name: string;
        description: string;
        duration: number;
        days: Array<{ day: number; title: string; description: string }>;
      };
      profileId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const program = await addWorkoutProgram(args.roomId, args.program, args.profileId);
      return program;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create program');
    }
  }
);

export const joinWorkoutProgram = createAsyncThunk(
  "fitnessRoom/joinWorkoutProgram",
  async (
    args: { programId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      await enrollInProgram(args.programId, args.userId);
      return args.programId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to join program');
    }
  }
);

export const loadUserEnrollments = createAsyncThunk(
  "fitnessRoom/loadUserEnrollments",
  async (userId: string) => {
    const enrollments = await fetchUserEnrollments(userId);
    return enrollments;
  }
);

export const loadProgramEnrollments = createAsyncThunk(
  "fitnessRoom/loadProgramEnrollments",
  async (programId: string) => {
    const enrollments = await fetchProgramEnrollments(programId);
    return { programId, enrollments };
  }
);

export const completeWorkoutProgram = createAsyncThunk(
  "fitnessRoom/completeWorkoutProgram",
  async (
    args: { programId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      await markProgramCompleted(args.programId, args.userId);
      return args.programId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to complete program');
    }
  }
);

const slice = createSlice({
  name: "fitnessRoom",
  initialState,
  reducers: {
    setRoomId(state, action: PayloadAction<string>) {
      state.roomId = action.payload;
    },
    setTimerTime(state, action: PayloadAction<{ minutes: number; seconds: number }>) {
      state.timer.minutes = action.payload.minutes;
      state.timer.seconds = action.payload.seconds;
    },
    setCurrentRound(state, action: PayloadAction<number>) {
      state.timer.currentRound = action.payload;
    },
    setIsWorkPhase(state, action: PayloadAction<boolean>) {
      state.timer.isWorkPhase = action.payload;
    },
    setTimerRunning(state, action: PayloadAction<boolean>) {
      state.timer.isRunning = action.payload;
    },
    setTimerMode(state, action: PayloadAction<TimerMode>) {
      state.timer.mode = action.payload;
      state.timer.minutes = 0;
      state.timer.seconds = 0;
      state.timer.isRunning = false;
      state.timer.currentRound = 0;
      state.timer.isWorkPhase = true;
    },
    setTimerTick(state) {
      const t = state.timer;
      if (t.mode === "countdown" || t.mode === "interval") {
        if (t.minutes === 0 && t.seconds === 0) {
          if (t.mode === "interval") {
            if (t.isWorkPhase && t.currentRound < t.intervalRounds) {
              t.isWorkPhase = false;
              t.seconds = t.intervalRest;
            } else if (!t.isWorkPhase && t.currentRound < t.intervalRounds) {
              t.isWorkPhase = true;
              t.currentRound += 1;
              t.seconds = t.intervalWork;
            } else {
              t.isRunning = false;
            }
          } else {
            t.isRunning = false;
          }
        } else if (t.seconds === 0) {
          t.minutes = Math.max(0, t.minutes - 1);
          t.seconds = 59;
        } else {
          t.seconds -= 1;
        }
      } else {
        if (t.seconds === 59) {
          t.minutes += 1;
          t.seconds = 0;
        } else {
          t.seconds += 1;
        }
      }
    },
    setCountdownMinutes(state, action: PayloadAction<number>) {
      state.timer.countdownMinutes = action.payload;
    },
    setIntervalWork(state, action: PayloadAction<number>) {
      state.timer.intervalWork = action.payload;
    },
    setIntervalRest(state, action: PayloadAction<number>) {
      state.timer.intervalRest = action.payload;
    },
    setIntervalRounds(state, action: PayloadAction<number>) {
      state.timer.intervalRounds = action.payload;
    },
    resetTimer(state) {
      state.timer.minutes = 0;
      state.timer.seconds = 0;
      state.timer.isRunning = false;
      state.timer.currentRound = 0;
      state.timer.isWorkPhase = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load Room
      .addCase(loadRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.roomId = action.payload.roomId;
        state.files = action.payload.files;
        state.privateUploads = action.payload.privateUploads;
        state.pinnedMessage = action.payload.pinnedMessage ?? "";
        // Ensure programEnrollments is preserved/initialized
        if (!state.programEnrollments) {
          state.programEnrollments = {};
        }
        const timer = action.payload.timerSettings;
        if (timer) {
          state.timer.mode = timer.mode as TimerMode;
          state.timer.countdownMinutes = timer.countdown_minutes;
          state.timer.intervalWork = timer.interval_work;
          state.timer.intervalRest = timer.interval_rest;
          state.timer.intervalRounds = timer.interval_rounds;
        }
      })
      .addCase(loadRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load room";
      })

      // Resource Files
      .addCase(createResourceFile.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
      })
      .addCase(createResourceFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.files.push(action.payload);
      })
      .addCase(createResourceFile.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload as string;
      })

      // Private Uploads
      .addCase(createPrivateUpload.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
      })
      .addCase(createPrivateUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.privateUploads.unshift(action.payload);
      })
      .addCase(createPrivateUpload.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload as string;
      })

      // Pinned Message
      .addCase(updatePinnedMessage.fulfilled, (state, action) => {
        state.pinnedMessage = action.payload;
      })

      // Timer Settings
      .addCase(persistTimerSettings.fulfilled, (state, action) => {
        const s = action.payload;
        state.timer.mode = s.mode as TimerMode;
        state.timer.countdownMinutes = s.countdown_minutes;
        state.timer.intervalWork = s.interval_work;
        state.timer.intervalRest = s.interval_rest;
        state.timer.intervalRounds = s.interval_rounds;
      })

      // Participants
      .addCase(loadParticipants.fulfilled, (state, action) => {
        state.participants = action.payload;
      })
      .addCase(kickParticipant.fulfilled, (state, action) => {
        state.participants = state.participants.filter(p => p.participant_id !== action.payload);
      })

      // Workout Programs
      .addCase(loadWorkoutPrograms.fulfilled, (state, action) => {
        state.workoutPrograms = action.payload;
      })
      .addCase(createWorkoutProgram.fulfilled, (state, action) => {
        state.workoutPrograms.push(action.payload);
      })
      .addCase(loadUserEnrollments.fulfilled, (state, action) => {
        state.enrollments = action.payload;
      })
      .addCase(joinWorkoutProgram.fulfilled, (state, action) => {
        // Optimistically add enrollment to state for immediate UI update
        const programId = action.payload;
        const existingEnrollment = state.enrollments.find(e => e.program_id === programId);
        if (!existingEnrollment) {
          state.enrollments.push({
            program_id: programId,
            completed: false
          });
        }
      })
      .addCase(loadProgramEnrollments.fulfilled, (state, action) => {
        const { programId, enrollments } = action.payload;
        // Ensure programEnrollments is initialized
        if (!state.programEnrollments) {
          state.programEnrollments = {};
        }
        state.programEnrollments[programId] = enrollments;
      })
      .addCase(completeWorkoutProgram.fulfilled, (state, action) => {
        const programId = action.payload;
        const enrollment = state.enrollments.find(e => e.program_id === programId);
        if (enrollment) enrollment.completed = true;
      });
  },
});

export const {
  setRoomId,
  setTimerRunning,
  setTimerMode,
  setTimerTick,
  setTimerTime,
  setCurrentRound,
  setIsWorkPhase,
  setCountdownMinutes,
  setIntervalWork,
  setIntervalRest,
  setIntervalRounds,
  resetTimer,
} = slice.actions;

export default slice.reducer;