import React from 'react';
import { IoMdHeart } from 'react-icons/io';
import StreamPaymentForm from './StreamPaymentForm';
import { useNotification } from '@/Components/custom/custom-notification';

interface DonationFormProps {
    amount: number;
    setAmount: (amount: number) => void;
    hostId: string;
    streamId: string;
    userId: string;
    onSuccess: (paymentIntentId: string, amount: number, paymentIntentStatus: any) => void;
    onCancel: () => void;
    title: string;
}

const DonationForm: React.FC<DonationFormProps> = (props) => {
    const { amount, setAmount, hostId, streamId, userId, onSuccess, onCancel, title } = props;
    const { notify } = useNotification();
    return (
        <StreamPaymentForm
            amount={amount}
            setAmount={setAmount}
            hostId={hostId}
            streamId={streamId}
            userId={userId}
            onSuccess={onSuccess}
            onCancel={onCancel}
            apiEndpoint="/api/stripe/stream-donation"
            title={title}
            icon={<IoMdHeart size={48} style={{ color: '#ff4d4f', marginBottom: '16px' }} />}
            description="Your donation helps keep the music flowing!"
            buttonLabel="Donate"
            notify={(args: { type: string; message: string }) => {
                notify({
                    type: args.type as any,
                    message: args.message
                });
            }}
        />
    );
};

export default DonationForm; 