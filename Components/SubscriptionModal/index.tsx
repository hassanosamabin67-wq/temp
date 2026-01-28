"use client";

import React from 'react';
import { Modal } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import SubscriptionForm from '../SubscriptionForm';
import { collabRoomJoining } from '@/lib/collabRoomNotifications';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionModalProps {
    visible: boolean;
    onCancel: () => void;
    roomId: string;
    roomTitle: string;
    subscriptionPrice: number;
    hostName: string;
    onSubscriptionSuccess?: () => void;
    hostId: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
    visible,
    onCancel,
    roomId,
    roomTitle,
    subscriptionPrice,
    hostName,
    onSubscriptionSuccess,
    hostId
}) => {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth);

    const handleSubscriptionSuccess = async () => {
        onSubscriptionSuccess?.();
        onCancel();
        try {
            await collabRoomJoining(profile.profileId!, `${profile.firstName} ${profile.lastName}`, hostId, roomTitle, true)
            router.push(`/think-tank/room/${roomId}`);
        } catch (error) {
            console.error("Error Sending Room Joining Notification: ", error)
        }
    };

    return (
        <Modal
            title="Subscribe to Room"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={500}
            centered
            destroyOnClose
        >
            <Elements stripe={stripePromise}>
                <SubscriptionForm
                    roomId={roomId}
                    roomTitle={roomTitle}
                    subscriptionPrice={subscriptionPrice}
                    hostName={hostName}
                    onSubscriptionSuccess={handleSubscriptionSuccess}
                    onCancel={onCancel}
                />
            </Elements>
        </Modal>
    );
};

export default SubscriptionModal;