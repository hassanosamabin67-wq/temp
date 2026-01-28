import React, { useState } from 'react'
import styles from './style.module.css'
import { Button, Modal } from 'antd'
import { HeartOutlined } from '@ant-design/icons'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js';
import Tip from '@/Components/pages/SoundScapeStreamComp/Tab/Tip'
import { useAppSelector } from '@/store'
import { supabase } from '@/config/supabase'
import { useNotification } from '@/Components/custom/custom-notification'
import DonationForm from '@/Components/pages/SoundScapeStreamComp/Tab/DonationForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const ArtistInfo = ({ roomId, hostId, artistInfo }: any) => {
    const [tipModalVisible, setTipModalVisible] = useState(false)
    const [tipAmount, setTipAmount] = useState<number>(5);
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification()
    const [donationAmount, setDonationAmount] = useState<number>(5);
    const [donationModalVisible, setDonationModalVisible] = useState(false);

    const handleTipSuccess = async (paymentIntentId: string, amount: number, paymentIntentStatus: any) => {
        try {
            const { error } = await supabase.from('transactions').insert({
                stripe_transaction_id: paymentIntentId,
                amount: amount,
                user_id: hostId,
                client_id: profile.profileId,
                type: "Artwork Tip",
                category: "Collab Room",
                status: paymentIntentStatus,
                purchase_name: `Tip given for ${artistInfo?.firstName} ${artistInfo?.lastName}'s Artwork`
            });
            if (error) {
                console.error('Error recording tip:', error);
                return;
            }
            notify({ type: 'success', message: `Thank you for your $${amount} tip!` });
            setTipModalVisible(false);
        } catch (error) {
            console.error('Error handling tip success:', error);
        }
    };

    const handleDonationSuccess = async (paymentIntentId: string, amount: number, paymentIntentStatus: any) => {
        try {
            const { error } = await supabase.from('transactions').insert({
                stripe_transaction_id: paymentIntentId,
                amount: amount,
                user_id: hostId,
                client_id: profile.profileId,
                type: "Artwork Donation",
                category: "Collab Room",
                status: paymentIntentStatus,
                purchase_name: `Donation for ${artistInfo?.firstName} ${artistInfo?.lastName}'s Artwork`
            });

            if (error) {
                console.error('Error recording donation:', error);
                return;
            }
            notify({ type: 'success', message: `Thank you for your $${amount} donation!` });
            setDonationModalVisible(false);
        } catch (error) {
            console.error('Error handling donation success:', error);
        }
    };

    return (
        <>
            <div className={styles.artistInfo}>
                <div className={styles.artistInfoHeader}>
                    <span className={styles.artistImageBg}>{artistInfo?.firstName.charAt(0)}</span>
                    <div className={styles.nameDiv}>
                        <span className={styles.artistName}>{artistInfo?.firstName} {artistInfo?.lastName}</span>
                        <span className={styles.artistCat}>{artistInfo?.title || 'Artist'}</span>
                    </div>
                </div>
                <p className={styles.artistInfoDesc}>{artistInfo?.overview || 'No description available'}</p>
                <div className={styles.artistInfoFooter}>
                    <Button className={styles.artistInfoFooterButton} icon={<HeartOutlined />} variant='solid' color='green' onClick={() => setTipModalVisible(true)} >Tip Artist</Button>
                    <Button className={styles.artistInfoFooterButton} icon={<HeartOutlined />} variant='solid' color='cyan' onClick={() => setDonationModalVisible(true)} >Donate</Button>
                </div>
            </div>

            <Modal
                title="Send a Tip"
                open={tipModalVisible}
                onCancel={() => setTipModalVisible(false)}
                footer={null}
                centered
                width={500}
            >
                <Elements
                    stripe={stripePromise}
                    options={{
                        mode: 'payment',
                        amount: Math.round(tipAmount * 100),
                        currency: 'usd',
                    }}
                >
                    <Tip
                        amount={tipAmount}
                        setAmount={setTipAmount}
                        hostId={hostId}
                        streamId={roomId}
                        userId={profile.profileId as any}
                        onSuccess={handleTipSuccess}
                        onCancel={() => setTipModalVisible(false)}
                        title="Send a Tip to the Artist"
                    />
                </Elements>
            </Modal>

            <Modal
                title="Send a Donation"
                open={donationModalVisible}
                onCancel={() => setDonationModalVisible(false)}
                footer={null}
                centered
                width={500}
            >
                <Elements
                    stripe={stripePromise}
                    options={{
                        mode: 'payment',
                        amount: Math.round(donationAmount * 100),
                        currency: 'usd',
                    }}
                >
                    <DonationForm
                        amount={donationAmount}
                        setAmount={setDonationAmount}
                        hostId={hostId}
                        streamId={roomId}
                        userId={profile.profileId as any}
                        onSuccess={handleDonationSuccess}
                        onCancel={() => setDonationModalVisible(false)}
                        title="Donate to the Artist"
                    />
                </Elements>
            </Modal>

        </>
    )
}

export default ArtistInfo