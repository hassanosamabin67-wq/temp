'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Image, Typography, Divider, message, Space, TabsProps, Tabs, Empty, Rate, Input } from 'antd';
import { ShoppingCartOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAppSelector } from '@/store';
import styles from './style.module.css';
import { Artwork } from '../types';
import ArtworkPaymentForm from '../ArtworkPaymentForm';
import { useNotification } from '@/Components/custom/custom-notification';
import { trackArtworkView } from '@/utils/artworkViewTracker';
import { supabase } from '@/config/supabase';
import ThemedModal from '@/Components/UIComponents/ThemedModal';
import { HiOutlineEye, HiOutlineCreditCard } from 'react-icons/hi2';

const { Title, Text, Paragraph } = Typography;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface ArtWorkDetailModalProps {
    artwork: Artwork | null;
    visible: boolean;
    onClose: () => void;
    onBuyNow: (artwork: Artwork) => void;
    roomId?: string;
    hostId: string;
}

const ArtWorkDetailModal: React.FC<ArtWorkDetailModalProps> = ({
    artwork,
    visible,
    onClose,
    onBuyNow,
    roomId,
    hostId,
}) => {
    const [showPayment, setShowPayment] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();
    const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
    const [reviewMessage, setReviewMessage] = useState("");
    const [ratingValue, setRatingValue] = useState(0);
    const [feedback, setFeedback] = useState<any>([]);
    const currentUserName = `${profile.firstName} ${profile.lastName}`

    // Track view when modal opens
    useEffect(() => {
        if (visible && artwork && roomId) {
            trackArtworkView(artwork.id, roomId, profile?.profileId);
        }
    }, [visible, artwork, roomId, profile?.profileId]);

    // Handle audio play/pause
    const handleAudioPlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Handle audio ended
    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    // Handle video ended
    const handleVideoEnded = () => {
        setIsVideoPlaying(false);
    };

    const handleBuyNow = () => {
        // Check if user is authenticated
        if (!profile?.profileId) {
            notify({ type: 'error', message: 'Please log in to purchase artwork' });
            return;
        }
        setShowPayment(true);
    };

    const handlePaymentSuccess = () => {
        setShowPayment(false);
        onBuyNow(artwork!);
        onClose();
    };

    const handlePaymentCancel = () => {
        setShowPayment(false);
    };

    const handleModalClose = () => {
        setShowPayment(false);
        onClose();
    };

    const handleFeedback = async (artoworkId: string, userId: string, userName: string, rating: number, comment?: string) => {
        try {
            if (!rating) {
                notify({ type: "error", message: "Please provide a rating." });
                return;
            }
            const payload = {
                artwork_id: artoworkId,
                user_id: userId,
                user_name: userName,
                rating,
                comment
            }
            const { error } = await supabase
                .from("artwork_feedback")
                .insert([payload])

            if (error) {
                console.error("Failed to submit rating:", error);
                return;
            } else {
                notify({ type: "success", message: "Thanks for your feedback!" });
                setRatingValue(0);
                setReviewMessage("");
                handleModalClose()
            }
        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    const fetchFeedbacks = async (artworkId: string) => {
        try {
            const { data, error } = await supabase
                .from("artwork_feedback")
                .select('*')
                .eq('artwork_id', artworkId)

            if (error) {
                console.error('Error fetching feedbacks');
                return;
            }

            setFeedback(data)

        } catch (err) {
            console.error('Unexpected error while fetching feedback');
        }
    }

    useEffect(() => {
        if (artwork?.id) {
            fetchFeedbacks(artwork.id);
        }
    }, [artwork?.id]);

    if (!artwork) return null;

    const detailTab = (
        <div className={styles.modalContent}>
            <div className={styles.imageSection}>
                <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    width={300}
                    height={300}
                    className={styles.artworkImage}
                    preview={true}
                />
            </div>

            <div className={styles.detailsSection}>
                <Title level={2} className={styles.artworkTitle}>
                    {artwork.title}
                </Title>

                <div className={styles.priceSection}>
                    <Text className={styles.priceLabel}>Price:</Text>
                    <Text className={styles.priceValue}>${artwork.price}</Text>
                </div>

                {artwork.description && (
                    <div className={styles.descriptionSection}>
                        <Text className={styles.descriptionLabel}>Description:</Text>
                        <Paragraph className={styles.descriptionText}>
                            {artwork.description}
                        </Paragraph>
                    </div>
                )}

                <div className={styles.actionButtons}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        onClick={handleBuyNow}
                        className={styles.buyNowButton}
                    >
                        Buy Now
                    </Button>
                </div>
            </div>
        </div>
    )

    const commentaryTab = (
        <>
            {artwork.commentaryUrl ? (
                <>
                    <div className={styles.commentarySection}>
                        <Text className={styles.commentaryLabel}>Artist Commentary:</Text>
                        <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                            {artwork.commentaryUrl.includes('audio') || artwork.commentaryUrl.includes('soundscape-audio') ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Button
                                        type="primary"
                                        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                        onClick={handleAudioPlayPause}
                                        size="small"
                                    >
                                        {isPlaying ? 'Pause' : 'Play'} Audio
                                    </Button>
                                    <audio
                                        ref={audioRef}
                                        src={artwork.commentaryUrl}
                                        onEnded={handleAudioEnded}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {/* <Button
                                                    type="primary"
                                                    icon={isVideoPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                                    onClick={handleVideoPlayPause}
                                                    size="small"
                                                >
                                                    {isVideoPlaying ? 'Pause' : 'Play'} Video
                                                </Button> */}
                                    <video
                                        ref={videoRef}
                                        src={artwork.commentaryUrl}
                                        onEnded={handleVideoEnded}
                                        width={500}
                                        controls
                                    />
                                </div>
                            )}
                        </Space>
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 330 }}>
                    <Empty description='No Commentary uploaded by host' />
                </div>
            )}
        </>
    );

    const reviewTab = (
        <div className={styles.reviewTab}>
            <span className={styles.feedbackHeading}>Write your feedback</span>
            <div className={styles.feedbackDiv}>
                <Rate tooltips={desc} allowHalf style={{ fontSize: 35 }} value={ratingValue} onChange={(value) => setRatingValue(value)} />
                <Input.TextArea
                    name="message"
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    className={styles.feedbackInput}
                    placeholder="Leave a comment"
                    rows={6}
                />
                <Button className={styles.feedbackBtn} disabled={ratingValue === 0} variant='solid' color='blue' onClick={() => handleFeedback(artwork.id, profile.profileId!, currentUserName, ratingValue, reviewMessage)}>Submit</Button>
            </div>
        </div>
    )

    const feedbacksTab = (
        <div className={styles.feedbacksTab}>
            {feedback && feedback.length > 0 ? (
                <div className={styles.userFeedbackDiv}>
                    {feedback.map((review: any) => (
                        <div key={review.id} className={styles.userFeedback}>
                            <div className={styles.userDetail}>
                                <span className={styles.reviewUser}>{review.user_name}</span>
                                <p className={styles.feedbackMessage}>{review.comment}</p>
                            </div>
                            <div className={styles.userRating}>
                                <Rate allowHalf disabled value={review.rating} style={{ fontSize: 18 }} />
                                <span className={styles.numericRating}>{review.rating.toFixed(1)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ height: 330, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Empty description="No Feedback for this artwork" />
                </div>
            )}
        </div>
    )

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Artwork Detail',
            children: detailTab
        },
        {
            key: '2',
            label: 'Host Commentary',
            children: commentaryTab
        },
        {
            key: '3',
            label: 'Add Feedback',
            children: reviewTab
        },
        {
            key: '4',
            label: 'Feedbacks',
            children: feedbacksTab
        }
    ];

    return (
        <ThemedModal
            roomType="art_exhibit"
            themedTitle={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                        {showPayment ? <HiOutlineCreditCard size={20} /> : <HiOutlineEye size={20} />}
                    </span>
                    <span>{showPayment ? "Complete Purchase" : "Artwork Details"}</span>
                </div>
            }
            open={visible}
            onCancel={handleModalClose}
            footer={null}
            width={showPayment ? 600 : 800}
            className={styles.modal}
        >
            {showPayment ? (
                <Elements
                    stripe={stripePromise}
                    options={{
                        mode: 'payment',
                        amount: Math.round((artwork.price || 0) * 100),
                        currency: 'usd',
                    }}
                >
                    <ArtworkPaymentForm
                        artwork={artwork}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handlePaymentCancel}
                        hostId={hostId}
                        createdBy={artwork.createdBy}
                    />
                </Elements>
            ) : (
                <Tabs
                    items={items}
                    indicator={{ size: (origin) => origin - 20, align: "center" }}
                    centered
                />
            )}
        </ThemedModal>
    );
};

export default ArtWorkDetailModal; 