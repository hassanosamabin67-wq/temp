'use client'
import React, { FC, ReactNode } from 'react'
import { Modal, ModalProps } from 'antd'
import { getTheme, RoomType } from '@/lib/roomThemes'
import styles from './style.module.css'

interface ThemedModalProps extends ModalProps {
    roomType?: RoomType | string;
    children: ReactNode;
    themedTitle?: ReactNode;
}

const ThemedModal: FC<ThemedModalProps> = ({
    roomType,
    children,
    themedTitle,
    title,
    className,
    ...props
}) => {
    const theme = getTheme(roomType);

    const modalStyles = {
        '--themed-modal-primary': theme.primary,
        '--themed-modal-secondary': theme.secondary,
        '--themed-modal-accent': theme.accent,
        '--themed-modal-gradient': theme.gradient,
        '--themed-modal-gradient-hover': theme.gradientHover,
        '--themed-modal-font': theme.fontFamily,
        '--themed-modal-bg': theme.modalBg,
        '--themed-modal-header-bg': theme.modalHeaderBg,
        '--themed-modal-border': theme.borderColor,
        '--themed-modal-text': theme.textColor,
        '--themed-modal-button-bg': theme.buttonBg,
        '--themed-modal-button-hover': theme.buttonHoverBg,
    } as React.CSSProperties;

    const renderTitle = () => {
        if (themedTitle) {
            return (
                <div className={styles.themedHeader}>
                    {themedTitle}
                </div>
            );
        }
        if (title) {
            return (
                <div className={styles.themedHeader}>
                    <span className={styles.themedTitle}>{title}</span>
                </div>
            );
        }
        return null;
    };

    return (
        <Modal
            {...props}
            title={renderTitle()}
            className={`${styles.themedModal} ${className || ''}`}
            style={modalStyles}
            centered
        >
            <div className={styles.themedContent}>
                {children}
            </div>
        </Modal>
    )
}

export default ThemedModal
