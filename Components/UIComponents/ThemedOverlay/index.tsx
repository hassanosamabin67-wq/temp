'use client'
import React, { FC, ReactNode } from 'react'
import { getTheme, RoomType } from '@/lib/roomThemes'
import styles from './style.module.css'

interface ThemedOverlayProps {
    roomType?: RoomType | string;
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'countdown' | 'header' | 'card';
}

const ThemedOverlay: FC<ThemedOverlayProps> = ({
    roomType,
    children,
    className,
    variant = 'default',
}) => {
    const theme = getTheme(roomType);

    const overlayStyles = {
        '--themed-overlay-primary': theme.primary,
        '--themed-overlay-secondary': theme.secondary,
        '--themed-overlay-accent': theme.accent,
        '--themed-overlay-gradient': theme.gradient,
        '--themed-overlay-font': theme.fontFamily,
        '--themed-overlay-border': theme.borderColor,
        '--themed-overlay-text': theme.textColor,
        '--themed-overlay-countdown-bg': theme.countdownBg,
        '--themed-overlay-countdown-border': theme.countdownBorder,
        '--themed-overlay-button-bg': theme.buttonBg,
        '--themed-overlay-button-hover': theme.buttonHoverBg,
    } as React.CSSProperties;

    const getVariantClass = () => {
        switch (variant) {
            case 'countdown':
                return styles.countdownVariant;
            case 'header':
                return styles.headerVariant;
            case 'card':
                return styles.cardVariant;
            default:
                return styles.defaultVariant;
        }
    };

    return (
        <div
            className={`${styles.themedOverlay} ${getVariantClass()} ${className || ''}`}
            style={overlayStyles}
            data-room-type={roomType}
        >
            {children}
        </div>
    )
}

export default ThemedOverlay

interface ThemedCountdownProps {
    roomType?: RoomType | string;
    time: string;
    eventName: string;
    eventDate: string;
    isStartingSoon?: boolean;
    children?: ReactNode;
}

export const ThemedCountdown: FC<ThemedCountdownProps> = ({
    roomType,
    time,
    eventName,
    eventDate,
    isStartingSoon,
    children,
}) => {
    const theme = getTheme(roomType);

    const countdownStyles = {
        '--themed-overlay-primary': theme.primary,
        '--themed-overlay-gradient': theme.gradient,
        '--themed-overlay-font': theme.fontFamily,
        '--themed-overlay-countdown-bg': theme.countdownBg,
        '--themed-overlay-countdown-border': theme.countdownBorder,
    } as React.CSSProperties;

    return (
        <div className={styles.themedCountdown} style={countdownStyles}>
            <div className={styles.countdownContent}>
                <div className={styles.countdownStatus}>
                    {isStartingSoon ? (
                        <span className={styles.startingIn}>Starting In</span>
                    ) : (
                        <span className={styles.startingSoon}>Starting Soon</span>
                    )}
                </div>
                <div className={styles.countdownTimer}>{time}</div>
                <div className={styles.countdownEventName}>{eventName}</div>
                <div className={styles.countdownEventDate}>{eventDate}</div>
                {children}
            </div>
        </div>
    )
}

interface ThemedLobbyHeaderProps {
    roomType?: RoomType | string;
    title: string;
    tagline?: string;
}

export const ThemedLobbyHeader: FC<ThemedLobbyHeaderProps> = ({
    roomType,
    title,
    tagline,
}) => {
    const theme = getTheme(roomType);

    const headerStyles = {
        '--themed-overlay-primary': theme.primary,
        '--themed-overlay-gradient': theme.gradient,
        '--themed-overlay-font': theme.fontFamily,
        '--themed-overlay-text': theme.textColor,
    } as React.CSSProperties;

    return (
        <div className={styles.themedLobbyHeader} style={headerStyles}>
            <h1 className={styles.lobbyTitle}>{title}</h1>
            {tagline && <p className={styles.lobbyTagline}>{tagline}</p>}
        </div>
    )
}
