import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
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
} from '@/store/slices/fitnessRoom';
import ChatBox from '../StreamComponents/ChatBox';
import styles from './styles.module.css';

type TimerMode = "stopwatch" | "countdown" | "interval";

interface FitnessStreamComponentsProps {
    roomId: string;
    roomType: string;
    hostId: string;
    participants: any[];
    isHost: boolean;
    elapsedTime: string;
}

const FitnessStreamComponents: React.FC<FitnessStreamComponentsProps> = ({
    roomId,
    roomType,
    hostId,
    participants,
    isHost,
    elapsedTime
}) => {
    const dispatch = useAppDispatch();
    const { timer } = useAppSelector((s) => s.fitnessRoom);
    const [showTimerSettings, setShowTimerSettings] = useState(false);

    const countdownMinutes = timer.countdownMinutes;
    const intervalWork = timer.intervalWork;
    const intervalRest = timer.intervalRest;
    const intervalRounds = timer.intervalRounds;
    const currentRound = timer.currentRound;
    const isWorkPhase = timer.isWorkPhase;

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    }, [timer.isRunning, dispatch]);

    const formatTime = (minutes: number, seconds: number) => {
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    return (
        <div className={styles.sidebar}>
            {/* Timer Section */}
            <div className={styles.timerSection}>
                <div className={styles.timerCard}>
                    <div className={styles.timerHeader}>
                        <div className={styles.timerMode}>
                            {timer.mode === "interval" ? (isWorkPhase ? "🔥 WORK" : "😌 REST") : timer.mode.toUpperCase()}
                        </div>
                        <div className={styles.timerDisplay}>
                            {formatTime(timer.minutes, timer.seconds)}
                        </div>
                        {timer.mode === "interval" && (
                            <div className={styles.roundInfo}>
                                Round {currentRound} / {intervalRounds}
                            </div>
                        )}
                    </div>

                    <div className={styles.timerControls}>
                        <button
                            onClick={timer.isRunning ? pauseTimer : startTimer}
                            className={`${styles.timerButton} ${styles.startButton}`}
                        >
                            {timer.isRunning ? "⏸️ Pause" : "▶️ Start"}
                        </button>
                        <button
                            onClick={resetTimer}
                            className={`${styles.timerButton} ${styles.resetButton}`}
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* Timer Mode Selector */}
                <div className={styles.timerModeSelector}>
                    <div className={styles.modeLabel}>Timer Mode</div>
                    <div className={styles.modeButtons}>
                        {(["stopwatch", "countdown", "interval"] as TimerMode[]).map((mode) => {
                            const active = timer.mode === mode;
                            return (
                                <button
                                    key={mode}
                                    onClick={() => setTimerMode(mode)}
                                    className={`${styles.modeButton} ${active ? styles.activeMode : ''}`}
                                >
                                    <div className={styles.modeIcon}>
                                        {mode === "stopwatch" ? "⏱️" : mode === "countdown" ? "⏲️" : "🔁"}
                                    </div>
                                    <div className={styles.modeText}>
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {(isHost && timer.mode !== "stopwatch") && (
                        <button
                            onClick={() => setShowTimerSettings(true)}
                            className={styles.settingsButton}
                        >
                            ⚙️ Settings
                        </button>
                    )}
                </div>
            </div>

            {/* Timer Settings Modal */}
            {showTimerSettings && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>⚙️ Timer Settings</h3>

                        {timer.mode === "countdown" && (
                            <div className={styles.settingGroup}>
                                <label className={styles.settingLabel}>Countdown Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={countdownMinutes}
                                    onChange={(e) => dispatch(setCountdownMinutesAction(parseInt(e.target.value, 10) || 0))}
                                    className={styles.settingInput}
                                    min={1}
                                    max={60}
                                />
                            </div>
                        )}

                        {timer.mode === "interval" && (
                            <>
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Work Duration (seconds)</label>
                                    <input
                                        type="number"
                                        value={intervalWork}
                                        onChange={(e) => dispatch(setIntervalWorkAction(parseInt(e.target.value, 10) || 0))}
                                        className={styles.settingInput}
                                        min={5}
                                        max={300}
                                    />
                                </div>
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Rest Duration (seconds)</label>
                                    <input
                                        type="number"
                                        value={intervalRest}
                                        onChange={(e) => dispatch(setIntervalRestAction(parseInt(e.target.value, 10) || 0))}
                                        className={styles.settingInput}
                                        min={5}
                                        max={300}
                                    />
                                </div>
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Number of Rounds</label>
                                    <input
                                        type="number"
                                        value={intervalRounds}
                                        onChange={(e) => dispatch(setIntervalRoundsAction(parseInt(e.target.value, 10) || 0))}
                                        className={styles.settingInput}
                                        min={1}
                                        max={20}
                                    />
                                </div>
                            </>
                        )}

                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setShowTimerSettings(false)}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FitnessStreamComponents;