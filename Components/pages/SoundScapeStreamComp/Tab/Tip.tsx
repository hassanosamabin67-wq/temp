import React from 'react';
import { IoMdHeart } from 'react-icons/io';
import StreamPaymentForm from './StreamPaymentForm';
import { useNotification } from '@/Components/custom/custom-notification';

interface TipFormProps {
    amount: number;
    setAmount: (amount: number) => void;
    hostId: string;
    streamId: string;
    userId: string;
    onSuccess: (paymentIntentId: string, amount: number, paymentIntentStatus: any) => void;
    onCancel: () => void;
    title: string;
}

const Tip: React.FC<TipFormProps> = (props) => {
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
            icon={<IoMdHeart size={48} style={{ color: '#ffb300', marginBottom: '16px' }} />}
            description="Show your appreciation to the host!"
            buttonLabel="Tip"
            notify={(args: { type: string; message: string; description?: string }) => {
                // Map the expected args to the ArgsProps shape if needed
                notify({
                    type: args.type as any, // Cast to any or the correct IconType if possible
                    message: args.message
                });
            }}
        />
    );
};

export default Tip; 