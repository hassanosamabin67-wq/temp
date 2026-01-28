'use client'
import Image from 'next/image'
import styles from './style.module.css'
import emailImg from '@/public/assets/img/email.webp'
import { FC } from 'react'
import { Modal } from 'antd'

const SignupConfirmation: FC<{ onOpen: boolean; onCancel: () => void; email: string }> = ({ onOpen, onCancel, email }) => {
    return (
        <Modal
            open={onOpen}
            onCancel={onCancel}
            centered
            footer={null}
            width={700}
            mask={true}
        >
            <div className={styles.confirmContainer}>
                <div className={styles.confirmationHeader}>
                    <Image src={emailImg} alt='email-image' width={100} height={100} />
                    <span className={styles.confirmH1}>Confirm your email</span>
                    <p className={styles.confirmTxt}>Thanks for signing up! We’ve sent a confirmation link to your email <span className={styles.userEmail}>{email}</span>. Please check your inbox and click the link to activate your account.</p>
                </div>
                <p className={styles.confirmationShortTxt}>Didn’t get the email? Make sure to check your spam or junk folder.</p>
            </div>
        </Modal>
    )
}

export default SignupConfirmation