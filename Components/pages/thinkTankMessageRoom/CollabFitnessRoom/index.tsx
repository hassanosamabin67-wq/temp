'use client'
import React, { useEffect, useRef, useState, FC } from "react";
import styles from './styles.module.css'
import { useNotification } from "@/Components/custom/custom-notification";
import { useAppDispatch, useAppSelector } from "@/store/index";
import {
    loadRoom,
    setTimerMode as setTimerModeAction,
    setTimerRunning,
    setTimerTick,
    resetTimer as resetTimerAction,
    setTimerTime,
    setCurrentRound,
    setIsWorkPhase,
    setCountdownMinutes as setCountdownMinutesAction,
    setIntervalWork as setIntervalWorkAction,
    setIntervalRest as setIntervalRestAction,
    setIntervalRounds as setIntervalRoundsAction,
    createResourceFile,
    createPrivateUpload,
    updatePinnedMessage,
    persistTimerSettings,
    kickParticipant,
    loadParticipants,
    createWorkoutProgram,
    loadWorkoutPrograms,
    joinWorkoutProgram,
    loadUserEnrollments,
    loadProgramEnrollments,
    completeWorkoutProgram,
} from "@/store/slices/fitnessRoom";

import WorkoutResources from "./WorkoutResources";
import PrivateUploads from "./PrivateUploads";
import AddMusic from "../RightComp/AddMusic";
import { IoMdVolumeHigh, IoMdVolumeOff } from "react-icons/io";
import { supabase } from "@/config/supabase";
import { Alert, Tag } from "antd";

type TimerMode = "stopwatch" | "countdown" | "interval";

const CollabFitnessRoom: FC<{ roomId: string, isHost: boolean, hostId?: string, userId: string }> = ({ roomId, isHost, hostId, userId }) => {
    // State management
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showPrivateUpload, setShowPrivateUpload] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showTimerSettings, setShowTimerSettings] = useState(false);
    const [showMusicModal, setShowMusicModal] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [showProgramsView, setShowProgramsView] = useState(false);
    const [showProgramParticipants, setShowProgramParticipants] = useState(false);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [bgMusic, setBgMusic] = useState<any>(null);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const profile = useAppSelector((state) => state.auth);
    const [roomNotification, setRoomNotification] = useState(false)

    // Timer state
    const dispatch = useAppDispatch();
    const {
        files: fitnessFiles,
        privateUploads,
        pinnedMessage,
        timer,
        uploading,
        uploadError,
        participants,
        workoutPrograms,
        enrollments,
        programEnrollments
    } = useAppSelector((s) => s.fitnessRoom);

    const countdownMinutes = timer.countdownMinutes;
    const intervalWork = timer.intervalWork;
    const intervalRest = timer.intervalRest;
    const intervalRounds = timer.intervalRounds;
    const currentRound = timer.currentRound;
    const isWorkPhase = timer.isWorkPhase;

    // Content state
    const [newPinMessage, setNewPinMessage] = useState<string>("");

    // Upload form state
    const [uploadFileName, setUploadFileName] = useState<string>("");
    const [uploadType, setUploadType] = useState<string>("workout");
    const [uploadIsPaid, setUploadIsPaid] = useState<boolean>(false);
    const [uploadPrice, setUploadPrice] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Program form state
    const [programName, setProgramName] = useState<string>("");
    const [programDescription, setProgramDescription] = useState<string>("");
    const [programDuration, setProgramDuration] = useState<string>("7");
    const [programDays, setProgramDays] = useState<Array<{ day: number, title: string, description: string }>>([
        { day: 1, title: "", description: "" }
    ]);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const privateFileInputRef = useRef<HTMLInputElement | null>(null);

    const { notify } = useNotification();

    // Timer functions
    const startTimer = () => {
        if (timer.mode === "countdown" && timer.minutes === 0 && timer.seconds === 0) {
            dispatch(setTimerTime({ minutes: countdownMinutes, seconds: 0 }));
            dispatch(setTimerRunning(true));
        } else if (timer.mode === "interval" && currentRound === 0) {
            dispatch(setCurrentRound(1));
            dispatch(setIsWorkPhase(true));
            dispatch(setTimerTime({ minutes: 0, seconds: intervalWork }));
            dispatch(setTimerRunning(true));
        } else {
            dispatch(setTimerRunning(true));
        }
    };

    const pauseTimer = () => {
        dispatch(setTimerRunning(false));
    };

    const resetTimer = () => {
        dispatch(resetTimerAction());
    };

    const setTimerMode = (mode: TimerMode) => {
        dispatch(setTimerModeAction(mode));
    };

    // Timer effect
    useEffect(() => {
        if (timer.isRunning) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                dispatch(setTimerTick());
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [timer.isRunning]);

    useEffect(() => {
        dispatch(loadRoom(roomId));
        dispatch(loadParticipants(roomId));
        dispatch(loadWorkoutPrograms(roomId));
        dispatch(loadUserEnrollments(userId));
        getMusic(roomId);

        // Send notification when room opens
        setRoomNotification(true)
        const timer = setTimeout(() => {
            setRoomNotification(false)
        }, 5000);

        return () => clearTimeout(timer);
    }, [roomId]);

    // Real-time subscriptions
    useEffect(() => {
        const musicChannel = supabase
            .channel(`fitness-music-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'background_music',
                    filter: `think_tank_id=eq.${roomId}`
                },
                (payload) => {
                    if (payload.new) {
                        const musicData = payload.new as any;
                        setBgMusic(musicData);
                        setIsMusicPlaying(musicData.is_playing);
                        setTimeout(() => {
                            if (audioRef.current) {
                                audioRef.current.load();
                                if (musicData.is_playing) {
                                    audioRef.current.play().catch(err => {
                                        console.error('Autoplay error:', err);
                                    });
                                }
                            }
                        }, 200);
                    }
                }
            )
            .subscribe();

        // Real-time subscription for workout programs
        const programsChannel = supabase
            .channel(`fitness-programs-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workout_programs',
                    filter: `room_id=eq.${roomId}`
                },
                () => {
                    // Reload programs when changes occur
                    dispatch(loadWorkoutPrograms(roomId));
                }
            )
            .subscribe();

        // Real-time subscription for program enrollments
        const enrollmentsChannel = supabase
            .channel(`fitness-enrollments-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'program_enrollments',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    // Reload enrollments when changes occur
                    dispatch(loadUserEnrollments(userId));
                }
            )
            .subscribe();

        // Real-time subscription for all program enrollments (for hosts to see participants)
        const allEnrollmentsChannel = supabase
            .channel(`fitness-all-enrollments-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'program_enrollments'
                },
                (payload) => {
                    // If host is viewing participants for a program, reload that program's enrollments
                    if (isHost && showProgramParticipants && selectedProgramId) {
                        dispatch(loadProgramEnrollments(selectedProgramId));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(musicChannel);
            supabase.removeChannel(programsChannel);
            supabase.removeChannel(enrollmentsChannel);
            supabase.removeChannel(allEnrollmentsChannel);
        };
    }, [roomId, userId, dispatch, isHost, showProgramParticipants, selectedProgramId]);

    const getMusic = async (roomId: string) => {
        try {
            const { data: music, error } = await supabase
                .from("background_music")
                .select("*")
                .eq("think_tank_id", roomId)
                .maybeSingle();

            if (error) {
                console.error("Error Fetching Music: ", error);
                return;
            }

            if (music) {
                setBgMusic(music);
                setIsMusicPlaying(music.is_playing);
            }
        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    const handleToggleVolume = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            audio.play().then(() => {
                setIsMusicPlaying(true);
            }).catch(err => {
                console.error("Play error:", err);
            });
        } else {
            audio.pause();
            setIsMusicPlaying(false);
        }
    };

    const handleKickParticipant = async (participantId: string) => {
        try {
            await dispatch(kickParticipant({ roomId, participantId })).unwrap();
            notify({ type: "info", message: "Participant removed from room" });
        } catch (error) {
            notify({ type: "error", message: `Failed to remove participant: ${error}` });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (file.type !== "application/pdf") {
            notify({ type: "warning", message: "Only PDF files are allowed!" });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            notify({ type: "warning", message: "File size must be under 10MB!" });
            return;
        }

        setSelectedFile(file);
        setUploadFileName(file.name.replace(/\.[^/.]+$/, ""));
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            notify({ type: "warning", message: "Please select a file first!" });
            return;
        }

        if (uploadIsPaid) {
            const priceValue = parseFloat(uploadPrice || "0");
            if (!uploadPrice || isNaN(priceValue) || priceValue <= 0) {
                notify({ type: "warning", message: "Please enter a valid price greater than 0!" });
                return;
            }
        }

        try {
            await dispatch(
                createResourceFile({
                    roomId,
                    file: selectedFile,
                    metadata: {
                        name: uploadFileName || selectedFile.name,
                        type: uploadType,
                        is_paid: uploadIsPaid,
                        price: uploadIsPaid ? parseFloat(uploadPrice || "0") : 0,
                    },
                })
            ).unwrap();

            setSelectedFile(null);
            setUploadFileName("");
            setUploadIsPaid(false);
            setUploadPrice("");
            setShowFileUpload(false);
            if (uploadType === 'meal_plan') {
                notify({ type: "info", message: `🥗 A new meal plan has been added to your library.` });
            } else {
                notify({ type: "info", message: `📄 A new "${uploadType}" file has been added to your library.` });
            }
        } catch (error) {
            notify({ type: "error", message: `Upload failed: ${error}` });
        }
    };

    const handlePrivateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                await dispatch(createPrivateUpload({ roomId, file })).unwrap();
                setShowPrivateUpload(false);
                notify({ type: "info", message: "Progress sent privately to host! 📤" });
            } catch (error) {
                notify({ type: "error", message: `Upload failed: ${error}` });
            }
        }
    };

    const handlePinMessage = async () => {
        if (newPinMessage.trim()) {
            await dispatch(updatePinnedMessage({ roomId, message: newPinMessage.trim() }));
            setNewPinMessage("");
            setShowPinModal(false);
            notify({ type: "success", message: "Message pinned! 📌" })
        }
    };

    const handleCreateProgram = async () => {
        if (!programName.trim() || !programDescription.trim()) {
            notify({ type: "warning", message: "Please fill in program name and description!" });
            return;
        }

        const validDays = programDays.filter(d => d.title.trim() && d.description.trim());
        if (validDays.length === 0) {
            notify({ type: "warning", message: "Please add at least one workout day!" });
            return;
        }

        try {
            await dispatch(createWorkoutProgram({
                roomId,
                program: {
                    name: programName,
                    description: programDescription,
                    duration: parseInt(programDuration),
                    days: validDays
                },
                profileId: profile.profileId!
            })).unwrap();

            setProgramName("");
            setProgramDescription("");
            setProgramDuration("7");
            setProgramDays([{ day: 1, title: "", description: "" }]);
            setShowProgramModal(false);
            notify({ type: "success", message: "🏆 Workout program created!" });
        } catch (error) {
            notify({ type: "error", message: `Failed to create program: ${error}` });
        }
    };

    const handleJoinProgram = async (programId: string) => {
        try {
            await dispatch(joinWorkoutProgram({ programId, userId })).unwrap();
            notify({ type: "success", message: "💪 You've joined the workout challenge!" });
        } catch (error) {
            notify({ type: "error", message: `Failed to join program: ${error}` });
        }
    };

    const addProgramDay = () => {
        setProgramDays([...programDays, { day: programDays.length + 1, title: "", description: "" }]);
    };

    const updateProgramDay = (index: number, field: 'title' | 'description', value: string) => {
        const updated = [...programDays];
        updated[index][field] = value;
        setProgramDays(updated);
    };

    const formatTime = (minutes: number, seconds: number) => {
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    const handleMarkCompleted = async (programId: string) => {
        try {
            await dispatch(completeWorkoutProgram({ programId, userId })).unwrap();
            notify({ type: "success", message: "🎉 Program marked as completed!" });
        } catch (error) {
            notify({ type: "error", message: `Failed to mark completed: ${error}` });
        }
    };

    const handleViewProgramParticipants = async (programId: string) => {
        setSelectedProgramId(programId);
        setShowProgramParticipants(true);
        try {
            await dispatch(loadProgramEnrollments(programId)).unwrap();
        } catch (error) {
            console.error('Failed to load participants:', error);
            notify({ type: "error", message: `Failed to load participants: ${error}` });
        }
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            {/* <div className={styles.header}>
                <div className={styles.headerInner}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 28 }}>💪</span>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Fitness Collab Room</h1>
                        {isHost && (
                            <span
                                style={{
                                    padding: "6px 10px",
                                    background: "#f3e8ff",
                                    color: "#6b21a8",
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 600
                                }}
                            >
                                Host
                            </span>
                        )}
                    </div>
                </div>
            </div> */}

            {/* Main Interface */}
            <div className={styles.gridWrapper}>
                {/* Pinned Message */}
                {roomNotification && (
                    <Alert
                        message={"🏋️ Collab Fitness Room is open — stretch and start workout."}
                        type="info"
                        showIcon
                        closable
                        onClose={() => setRoomNotification(false)}
                        style={{
                            margin: '10px',
                            borderRadius: '8px'
                        }}
                    />
                )}
                {pinnedMessage && (
                    <div style={{ marginBottom: 24, background: "linear-gradient(90deg,#fff7ed,#fffde7)", borderLeft: "4px solid #f59e0b", borderRadius: 10, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <span style={{ fontSize: 20 }}>📌</span>
                                <div>
                                    <p style={{ fontWeight: 700, color: "#111827", fontSize: 16 }}>{pinnedMessage}</p>
                                    <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Pinned by host</p>
                                </div>
                            </div>
                            {isHost && (
                                <button
                                    onClick={() => setShowPinModal(true)}
                                    style={{ padding: "6px 10px", background: "#f59e0b", color: "white", borderRadius: 8, border: "none", cursor: "pointer" }}
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.layoutGrid}>
                    {/* Timer Section */}
                    <div>
                        <div className={styles.card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>⏱️ Workout Timer</h2>
                                <span
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        background: timer.isRunning ? "#ecfccb" : "#f3f4f6",
                                        color: timer.isRunning ? "#4ade80" : "#6b7280"
                                    }}
                                >
                                    {timer.isRunning ? "● Live" : "○ Stopped"}
                                </span>
                            </div>

                            {/* Timer Display */}
                            <div style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)", borderRadius: 20, padding: 32, marginBottom: 18, boxShadow: "0 12px 30px rgba(37,99,235,0.12)", color: "white" }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ opacity: 0.9, fontSize: 13, marginBottom: 8 }}>
                                        {timer.mode === "interval" ? (isWorkPhase ? "🔥 WORK TIME" : "😌 REST TIME") : timer.mode.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: 56, fontWeight: 800, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace", marginBottom: 8 }}>
                                        {formatTime(timer.minutes, timer.seconds)}
                                    </div>
                                    {timer.mode === "interval" && <div style={{ opacity: 0.9, fontSize: 18 }}>Round {currentRound} / {intervalRounds}</div>}
                                </div>
                            </div>

                            {/* Timer Controls */}
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                                <button
                                    onClick={timer.isRunning ? pauseTimer : startTimer}
                                    style={{
                                        flex: 1,
                                        minWidth: 120,
                                        padding: "12px",
                                        borderRadius: 12,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        border: "none",
                                        boxShadow: "0 8px 20px rgba(16,24,40,0.08)",
                                        background: timer.isRunning ? "#f59e0b" : "linear-gradient(90deg,#7c3aed,#2563eb)",
                                        color: timer.isRunning ? "#111827" : "#fff"
                                    }}
                                >
                                    {timer.isRunning ? "⏸️ Pause" : "▶️ Start"}
                                </button>

                                <button
                                    onClick={resetTimer}
                                    style={{
                                        padding: "12px 20px",
                                        borderRadius: 12,
                                        background: "#ef4444",
                                        color: "white",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        boxShadow: "0 8px 20px rgba(16,24,40,0.08)"
                                    }}
                                >
                                    🔄 Reset
                                </button>
                                {(isHost && timer.mode !== "stopwatch") && (<button
                                    onClick={() => setShowTimerSettings(true)}
                                    style={{
                                        padding: "12px 20px",
                                        borderRadius: 12,
                                        background: "#4b5563",
                                        color: "white",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        boxShadow: "0 8px 20px rgba(16,24,40,0.04)"
                                    }}
                                >
                                    ⚙️ Settings
                                </button>)}
                            </div>

                            {/* Timer Mode Selector */}
                            <div className={styles.timerModeSelector}>
                                {[
                                    { mode: "stopwatch", icon: "⏱️", label: "Stopwatch" },
                                    { mode: "countdown", icon: "⏲️", label: "Countdown" },
                                    { mode: "interval", icon: "🔁", label: "Interval" }
                                ].map(({ mode, icon, label }) => {
                                    const active = timer.mode === (mode as TimerMode);
                                    return (
                                        <button
                                            key={mode}
                                            onClick={() => setTimerMode(mode as TimerMode)}
                                            style={{
                                                padding: 14,
                                                borderRadius: 12,
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                border: "none",
                                                background: active ? "#7c3aed" : "#f3f4f6",
                                                color: active ? "white" : "#111827",
                                                boxShadow: active ? "0 10px 30px rgba(124,58,237,0.2)" : undefined,
                                                transform: active ? "scale(1.03)" : undefined
                                            }}
                                        >
                                            <div style={{ fontSize: 22 }}>{icon}</div>
                                            <div style={{ fontSize: 13 }}>{label}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {isHost && (
                            <div className={styles.card}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 12 }}>👑 Host Controls</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <button onClick={() => setShowPinModal(true)} style={{ padding: 12, borderRadius: 10, background: "#f59e0b", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                                        📌 Pin Message
                                    </button>
                                    <button onClick={() => setShowFileUpload(true)} style={{ padding: 12, borderRadius: 10, background: "#2563eb", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                                        📄 Upload Routine
                                    </button>
                                    <button onClick={() => setShowProgramModal(true)} style={{ padding: 12, borderRadius: 10, background: "#ec4899", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                                        🏆 Create Program
                                    </button>
                                    <button onClick={() => setShowParticipants(true)} style={{ padding: 12, borderRadius: 10, background: "#dc2626", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                                        👥 Manage Participants
                                    </button>
                                    <button onClick={() => setShowMusicModal(true)} style={{ padding: 12, borderRadius: 10, background: "#8b5cf6", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                                        🎵 Background Music
                                    </button>
                                    {bgMusic && bgMusic.is_playing && (
                                        <button onClick={handleToggleVolume} style={{ padding: 12, borderRadius: 10, background: isMusicPlaying ? "#10b981" : "#6b7280", color: "white", border: "none", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                            {isMusicPlaying ? <><IoMdVolumeHigh /> Playing</> : <><IoMdVolumeOff /> Paused</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className={styles.card}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 12 }}>📤 Actions</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <button onClick={() => setShowPrivateUpload(true)} style={{ width: "100%", padding: 12, borderRadius: 10, background: "#7c3aed", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                                    📸 Send Progress
                                </button>
                                <button onClick={() => setShowProgramsView(true)} style={{ width: "100%", padding: 12, borderRadius: 10, background: "#10b981", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                                    🏋️ View Programs
                                </button>
                            </div>
                            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>Join challenges & track progress</p>
                        </div>
                    </div>
                </div>

                <WorkoutResources files={fitnessFiles as any} hostId={hostId} />

                {/* Host: Private Uploads Received */}
                {isHost && privateUploads.length > 0 && (
                    <PrivateUploads uploads={privateUploads as any} />
                )}
            </div>

            {/* Modals */}
            {/* Participants Modal */}
            {showParticipants && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>👥 Room Participants</h3>
                        <div style={{ maxHeight: 400, overflowY: "auto" }}>
                            {participants?.map((p: any) => (
                                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#f9fafb", borderRadius: 8, marginBottom: 8 }}>
                                    <div>
                                        <p style={{ fontWeight: 700, color: "#111827" }}>{p.name} <span style={{ fontSize: 10, color: "gray", marginLeft: 5 }}>{p.participant_id === hostId ? "YOU (host)" : null}</span></p>
                                        <p style={{ fontSize: 12, color: "#6b7280" }}>Joined {new Date(p.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {p.participant_id !== hostId && (
                                        <button
                                            onClick={() => handleKickParticipant(p.participant_id)}
                                            style={{ padding: "8px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
                                        >
                                            🚫 Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowParticipants(false)} style={{ width: "100%", marginTop: 12, padding: 10, background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Programs View Modal */}
            {showProgramsView && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal} style={{ maxWidth: 600 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>🏋️ Workout Programs</h3>
                        <div style={{ maxHeight: 500, overflowY: "auto" }}>
                            {workoutPrograms.map((program: any) => {
                                const enrollment = enrollments.find((e) => e.program_id === program.id);
                                const isEnrolled = !!enrollment;
                                const isCompleted = enrollment?.completed;
                                return (
                                    <div key={program.id} style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", borderRadius: 12, padding: 16, marginBottom: 12, border: "2px solid #fbbf24" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                                            <div>
                                                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>🏆 {program.name} {isCompleted && (<Tag color="green">Completed</Tag>)}</h4>
                                                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{program.description}</p>
                                                <p style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>📅 {program.duration} Days Challenge</p>
                                            </div>
                                            {isHost ? (
                                                <button
                                                    onClick={() => handleViewProgramParticipants(program.id)}
                                                    style={{
                                                        padding: "8px 16px",
                                                        background: "#6366f1",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: 8,
                                                        cursor: "pointer",
                                                        fontWeight: 700,
                                                        fontSize: 13,
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    👥 View Participants
                                                </button>
                                            ) : (
                                                <>
                                                    {!isEnrolled ? (
                                                        <button
                                                            onClick={() => handleJoinProgram(program.id)}
                                                            style={{
                                                                padding: "8px 16px",
                                                                background: "#10b981",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius: 8,
                                                                cursor: "pointer",
                                                                fontWeight: 700,
                                                                fontSize: 13,
                                                                whiteSpace: "nowrap"
                                                            }}
                                                        >
                                                            Join
                                                        </button>
                                                    ) : isCompleted ? (
                                                        <button
                                                            onClick={() => setShowPrivateUpload(true)}
                                                            style={{
                                                                padding: "8px 16px",
                                                                background: "#7c3aed",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius: 8,
                                                                fontWeight: 700,
                                                                fontSize: 13,
                                                                whiteSpace: "nowrap"
                                                            }}
                                                        >
                                                            Send Progress to Host
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkCompleted(program.id)}
                                                            style={{
                                                                padding: "8px 16px",
                                                                background: "#f59e0b",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius: 8,
                                                                cursor: "pointer",
                                                                fontWeight: 700,
                                                                fontSize: 13,
                                                                whiteSpace: "nowrap"
                                                            }}
                                                        >
                                                            Mark as Completed
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div style={{ background: "white", borderRadius: 8, padding: 12 }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Daily Schedule:</p>
                                            {program.days.slice(0, 3).map((day: any) => (
                                                <div key={day.day} style={{
                                                    background: "#f9fafb",
                                                    borderRadius: 6,
                                                    padding: 8,
                                                    marginBottom: 6,
                                                    borderLeft: "3px solid #f59e0b"
                                                }}>
                                                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Day {day.day}: {day.title}</p>
                                                    <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{day.description}</p>
                                                </div>
                                            ))}
                                            {program.days.length > 3 && (
                                                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>+ {program.days.length - 3} more days...</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {workoutPrograms.length === 0 && (
                                <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
                                    <p style={{ fontSize: 32, marginBottom: 8 }}>🏋️</p>
                                    <p>No workout programs yet</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowProgramsView(false)} style={{ width: "100%", marginTop: 12, padding: 10, background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Create Program Modal */}
            {showProgramModal && (
                <div className={styles.modalBackdrop}>
                    <div className={`${styles.modal} ${styles.createProgramModal}`}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>🏆 Create Workout Program</h3>

                        <div style={{ maxHeight: 500, overflowY: "auto", marginBottom: 12 }}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Program Name</label>
                                <input
                                    type="text"
                                    value={programName}
                                    onChange={(e) => setProgramName(e.target.value)}
                                    placeholder="30-Day HIIT Challenge"
                                    style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}
                                />
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</label>
                                <textarea
                                    value={programDescription}
                                    onChange={(e) => setProgramDescription(e.target.value)}
                                    placeholder="Transform your fitness with high-intensity interval training..."
                                    style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, minHeight: 80, resize: "none" }}
                                />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Duration (days)</label>
                                <input
                                    type="number"
                                    value={programDuration}
                                    onChange={(e) => setProgramDuration(e.target.value)}
                                    min={1}
                                    max={90}
                                    style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}
                                />
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Daily Workouts</label>
                                    <button
                                        onClick={addProgramDay}
                                        style={{ padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
                                    >
                                        + Add Day
                                    </button>
                                </div>
                                {programDays.map((day, index) => (
                                    <div key={index} style={{ background: "#f9fafb", padding: 12, borderRadius: 8, marginBottom: 8 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Day {day.day}</p>
                                        <input
                                            type="text"
                                            value={day.title}
                                            onChange={(e) => updateProgramDay(index, 'title', e.target.value)}
                                            placeholder="Upper Body Strength"
                                            style={{ width: "100%", padding: 8, border: "1px solid #e5e7eb", borderRadius: 6, marginBottom: 6, fontSize: 13 }}
                                        />
                                        <textarea
                                            value={day.description}
                                            onChange={(e) => updateProgramDay(index, 'description', e.target.value)}
                                            placeholder="3 sets of push-ups, pull-ups, dumbbell press..."
                                            style={{ width: "100%", padding: 8, border: "1px solid #e5e7eb", borderRadius: 6, minHeight: 60, resize: "none", fontSize: 13 }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={handleCreateProgram}
                                style={{ flex: 1, padding: 10, borderRadius: 8, background: "#ec4899", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}
                            >
                                Create Program
                            </button>
                            <button
                                onClick={() => setShowProgramModal(false)}
                                style={{ padding: 10, borderRadius: 8, background: "#f3f4f6", color: "#374151", border: "none", cursor: "pointer", fontWeight: 700 }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pin Message Modal */}
            {showPinModal && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>📌 Pin Message</h3>
                        <textarea
                            value={newPinMessage}
                            onChange={(e) => setNewPinMessage(e.target.value)}
                            placeholder="Enter message to pin (e.g., '3 rounds x 15 reps')"
                            style={{ width: "100%", padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 12, minHeight: 96, resize: "none" }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={handlePinMessage} style={{ flex: 1, padding: 10, background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                                Pin Message
                            </button>
                            <button onClick={() => setShowPinModal(false)} style={{ padding: 10, background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", color: "#374151", fontWeight: 700 }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timer Settings Modal */}
            {showTimerSettings && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>⚙️ Timer Settings</h3>

                        {timer.mode === "countdown" && (
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Countdown Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={countdownMinutes}
                                    onChange={(e) => dispatch(setCountdownMinutesAction(parseInt(e.target.value, 10) || 0))}
                                    style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}
                                    min={1}
                                    max={60}
                                />
                            </div>
                        )}

                        {timer.mode === "interval" && (
                            <>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Work Duration (seconds)</label>
                                    <input
                                        type="number"
                                        value={intervalWork}
                                        onChange={(e) => dispatch(setIntervalWorkAction(parseInt(e.target.value, 10) || 0))}
                                        style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}
                                        min={5}
                                        max={300}
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Rest Duration (seconds)</label>
                                    <input
                                        type="number"
                                        value={intervalRest}
                                        onChange={(e) => dispatch(setIntervalRestAction(parseInt(e.target.value, 10) || 0))}
                                        style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}
                                        min={5}
                                        max={300}
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Number of Rounds</label>
                                    <input
                                        type="number"
                                        value={intervalRounds}
                                        onChange={(e) => dispatch(setIntervalRoundsAction(parseInt(e.target.value, 10) || 0))}
                                        style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}
                                        min={1}
                                        max={20}
                                    />
                                </div>
                            </>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                                onClick={() => {
                                    dispatch(persistTimerSettings({
                                        roomId,
                                        settings: {
                                            room_id: roomId,
                                            mode: timer.mode,
                                            countdown_minutes: countdownMinutes,
                                            interval_work: intervalWork,
                                            interval_rest: intervalRest,
                                            interval_rounds: intervalRounds
                                        }
                                    }));
                                    setShowTimerSettings(false);
                                }}
                                style={{ width: "100%", padding: 12, borderRadius: 8, background: "#7c3aed", color: "white", border: "none", fontWeight: 700 }}>
                                Save Settings
                            </button>
                            <button
                                onClick={() => setShowTimerSettings(false)}
                                disabled={uploading}
                                style={{
                                    padding: 10,
                                    borderRadius: 8,
                                    background: uploading ? "#e5e7eb" : "#f3f4f6",
                                    color: uploading ? "#9ca3af" : "#374151",
                                    border: "none",
                                    cursor: uploading ? "not-allowed" : "pointer",
                                    fontWeight: 700
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Upload Modal */}
            {showFileUpload && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                            📄 Upload Resource
                        </h3>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                                File Name
                            </label>
                            <input
                                type="text"
                                value={uploadFileName}
                                onChange={(e) => setUploadFileName(e.target.value)}
                                placeholder="Full-Body HIIT"
                                style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                                Type
                            </label>
                            <select
                                value={uploadType}
                                onChange={(e) => setUploadType(e.target.value)}
                                style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}
                            >
                                <option value="workout">💪 Workout</option>
                                <option value="meal_plan">🥗 Meal Plan</option>
                                <option value="routine">📋 Routine</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <input type="checkbox" checked={uploadIsPaid} onChange={(e) => setUploadIsPaid(e.target.checked)} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Mark as Paid</span>
                            </label>
                        </div>

                        {uploadIsPaid && (
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                                    Price ($)
                                </label>
                                <input
                                    type="number"
                                    value={uploadPrice}
                                    onChange={(e) => setUploadPrice(e.target.value)}
                                    placeholder="29.99"
                                    style={{
                                        width: "100%",
                                        padding: 10,
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 8,
                                    }}
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                                Select File (PDF only, max 10MB)
                            </label>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                style={{ display: "none" }}
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                style={{
                                    width: "100%",
                                    padding: 10,
                                    borderRadius: 8,
                                    border: "1px solid #e5e7eb",
                                    background: "#f9fafb",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                }}
                            >
                                {selectedFile ? `✅ ${selectedFile.name}` : "📁 Choose File"}
                            </button>

                            {uploadError && (
                                <div style={{
                                    marginTop: 8,
                                    padding: 8,
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    color: "#dc2626"
                                }}>
                                    ❌ {uploadError}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={handleFileUpload}
                                disabled={uploading || !selectedFile}
                                style={{
                                    flex: 1,
                                    padding: 10,
                                    borderRadius: 8,
                                    background: uploading ? "#9ca3af" : "#2563eb",
                                    color: "white",
                                    border: "none",
                                    cursor: uploading ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                }}
                            >
                                {uploading ? "📤 Uploading..." : "Upload File"}
                            </button>

                            <button
                                onClick={() => setShowFileUpload(false)}
                                disabled={uploading}
                                style={{
                                    padding: 10,
                                    borderRadius: 8,
                                    background: uploading ? "#e5e7eb" : "#f3f4f6",
                                    color: uploading ? "#9ca3af" : "#374151",
                                    border: "none",
                                    cursor: uploading ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Private Upload Modal */}
            {showPrivateUpload && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>📸 Send Progress to Host</h3>

                        <div style={{ marginBottom: 12, background: "#f3e8ff", border: "1px solid #ede9fe", borderRadius: 8, padding: 12 }}>
                            <p style={{ fontSize: 13, color: "#374151" }}>
                                <span style={{ fontWeight: 800, color: "#6b21a8" }}>🔒 Private Upload:</span> Only the host will see this file. Perfect for progress photos, personal notes, or questions.
                            </p>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Select File</label>
                            <input
                                ref={privateFileInputRef}
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={handlePrivateUpload}
                                style={{ width: "100%" }}
                                disabled={uploading}
                            />
                            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>Accepted: Images, PDFs, Documents</p>
                            {uploading && (
                                <div style={{ marginTop: 8, padding: 8, background: "#f3f4f6", borderRadius: 6, fontSize: 12, color: "#374151" }}>
                                    📤 Uploading file...
                                </div>
                            )}
                            {uploadError && (
                                <div style={{ marginTop: 8, padding: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, color: "#dc2626" }}>
                                    ❌ {uploadError}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => privateFileInputRef.current?.click()}
                                disabled={uploading}
                                style={{
                                    flex: 1,
                                    padding: 10,
                                    borderRadius: 8,
                                    background: uploading ? "#9ca3af" : "#7c3aed",
                                    color: "white",
                                    border: "none",
                                    cursor: uploading ? "not-allowed" : "pointer",
                                    fontWeight: 700
                                }}
                            >
                                {uploading ? "📤 Sending..." : "📤 Send to Host"}
                            </button>
                            <button
                                onClick={() => setShowPrivateUpload(false)}
                                disabled={uploading}
                                style={{
                                    padding: 10,
                                    borderRadius: 8,
                                    background: uploading ? "#e5e7eb" : "#f3f4f6",
                                    color: uploading ? "#9ca3af" : "#374151",
                                    border: "none",
                                    cursor: uploading ? "not-allowed" : "pointer",
                                    fontWeight: 700
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Program Participants Modal */}
            {showProgramParticipants && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>👥 Program Participants</h3>
                        <div style={{ maxHeight: 400, overflowY: "auto" }}>
                            {selectedProgramId && programEnrollments[selectedProgramId] && Array.isArray(programEnrollments[selectedProgramId]) ? (
                                programEnrollments[selectedProgramId].map((enrollment: any) => (
                                    <div key={enrollment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#f9fafb", borderRadius: 8, marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            {enrollment.user?.profileImage ? (
                                                <img
                                                    src={enrollment.user.profileImage}
                                                    alt="Profile"
                                                    style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#6b7280" }}>
                                                    {enrollment.user?.firstName?.charAt(0) || "?"}
                                                </div>
                                            )}
                                            <div>
                                                <p style={{ fontWeight: 700, color: "#111827", margin: 0 }}>
                                                    {enrollment.user?.firstName} {enrollment.user?.lastName}
                                                </p>
                                                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                                                    Joined {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {enrollment.completed ? (
                                                <Tag color="green">✅ Completed</Tag>
                                            ) : (
                                                <Tag color="blue">🏃 In Progress</Tag>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : selectedProgramId && !programEnrollments[selectedProgramId] ? (
                                <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
                                    <p style={{ fontSize: 32, marginBottom: 8 }}>⏳</p>
                                    <p>Loading participants...</p>
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
                                    <p style={{ fontSize: 32, marginBottom: 8 }}>👥</p>
                                    <p>No participants yet</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowProgramParticipants(false)}
                            style={{ width: "100%", marginTop: 12, padding: 10, background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Music Player Modal */}
            <AddMusic
                showModal={showMusicModal}
                setShowModal={setShowMusicModal}
                roomId={roomId}
                bgMusic={bgMusic}
                setIsMusicPlaying={setIsMusicPlaying}
                isMusicPlaying={isMusicPlaying}
            />

            {/* Background Audio Element */}
            {bgMusic && bgMusic.is_playing && (
                <audio
                    ref={audioRef}
                    loop
                    preload="auto"
                    autoPlay
                >
                    <source src={bgMusic.music_url} type="audio/mpeg" />
                </audio>
            )}
        </div>
    );
};

export default CollabFitnessRoom;