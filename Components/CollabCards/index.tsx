'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Modal, Progress, Typography, Alert, Spin, Tag } from 'antd';
import { CreditCardOutlined, DollarOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store';
import { useNotification } from '../custom/custom-notification';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePayment from '@/Components/StripePayment';
import './style.css';
import { supabase } from '@/config/supabase';

const { Title, Text } = Typography;
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CardStatus {
    currentEarnings: number;
    isEligibleForFreeCard: boolean;
    hasActiveCard: boolean;
    cardEligible: boolean;
    activeCard: any;
    hasCollabCard?: boolean;
}

type CollabCardsProps = {
    userId?: string;
};

const CollabCards: React.FC<CollabCardsProps> = ({ userId }) => {
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();
    const [cardStatus, setCardStatus] = useState<CardStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [creatingCard, setCreatingCard] = useState(false);

    const effectiveUserId = useMemo(() => userId || profile.profileId || null, [userId, profile.profileId]);

    useEffect(() => {
        fetchCardStatus();
    }, [effectiveUserId]);

    const fetchCardStatus = async () => {
        try {
            setLoading(true);
            if (!effectiveUserId) {
                setCardStatus(null);
                return;
            }
            const response = await fetch(`/api/stripe/issuing/card-status?userId=${effectiveUserId}`);
            const data = await response.json();

            if (data.success) {
                setCardStatus(data.data);
            } else {
                notify({ type: 'error', message: data.error || 'Failed to fetch card status' });
            }
        } catch (error) {
            console.error('Error fetching card status:', error);
            notify({ type: 'error', message: 'Failed to fetch card status' });
        } finally {
            setLoading(false);
        }
    };

    const handleEarnItCard = async () => {
        try {
            if (!effectiveUserId) {
                notify({ type: 'error', message: 'Missing user ID' });
                return;
            }
            setCreatingCard(true);
            const { error } = await supabase
                .from('users')
                .update({ has_collab_card: true })
                .eq('userId', effectiveUserId);

            if (error) {
                notify({ type: 'error', message: 'Failed to claim card' });
                return;
            }

            notify({ type: 'success', message: 'Card claimed successfully!' });
            setShowCardModal(true);
            fetchCardStatus();
        } catch (error) {
            console.error('Error claiming card:', error);
            notify({ type: 'error', message: 'Failed to claim card' });
        } finally {
            setCreatingCard(false);
        }
    };

    const handlePurchasedCard = async () => {
        try {
            setCreatingCard(true);
            const response = await fetch('/api/stripe/issuing/create-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: effectiveUserId,
                    cardType: 'purchased'
                })
            });

            const data = await response.json();

            if (data.success) {
                notify({ type: 'success', message: 'Collab Card created successfully!' });
                setShowCardModal(true);
                fetchCardStatus();
            } else {
                notify({ type: 'error', message: data.error || 'Failed to create card' });
            }
        } catch (error) {
            console.error('Error creating card:', error);
            notify({ type: 'error', message: 'Failed to create card' });
        } finally {
            setCreatingCard(false);
        }
    };

    const handleBuyCard = () => {
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        notify({ type: 'success', message: 'Payment successful! Creating your Collab Card...' });

        // Supabase flags are set by the payment flow; refresh UI and show modal
        setShowCardModal(true);
        fetchCardStatus();
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Loading Collab Card status...</div>
            </div>
        );
    }

    if (!effectiveUserId) {
        return (
            <Alert
                message="No user specified"
                description="Missing user. Provide a user in the URL or sign in."
                type="warning"
                showIcon
            />
        );
    }

    if (!cardStatus) {
        return (
            <Alert
                message="Error"
                description="Unable to load Collab Card information"
                type="error"
                showIcon
            />
        );
    }

    // If user already has an active card
    if (cardStatus.hasActiveCard && cardStatus.activeCard) {
        return (
            <Card className="collab-card-container">
                <div className="card-header">
                    <CreditCardOutlined className="card-icon" />
                    <Title level={3}>Your Collab Card</Title>
                </div>
                
                <div className="active-card-info">
                    <div className="card-details">
                        <div className="card-number">
                            •••• •••• •••• {cardStatus.activeCard.last_four}
                        </div>
                        <div className="card-meta">
                            <span>Expires {cardStatus.activeCard.expires_month}/{cardStatus.activeCard.expires_year}</span>
                            <Tag color={cardStatus.activeCard.card_type === 'earn_it' ? 'green' : 'blue'}>
                                {cardStatus.activeCard.card_type === 'earn_it' ? 'Earned' : 'Purchased'}
                            </Tag>
                        </div>
                    </div>
                    
                    <Alert
                        message="Card Active"
                        description="Your Collab Card is ready to use! You can now access your earnings instantly."
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                    />
                </div>
            </Card>
        );
    }

    // If user has a collab card flag but no issuing card details, show a simple confirmed state
    if (cardStatus.hasCollabCard) {
        return (
            <Card className="collab-card-container">
                <div className="card-header">
                    <CreditCardOutlined className="card-icon" />
                    <Title level={3}>Your Collab Card</Title>
                </div>

                <div className="active-card-info">
                    <Alert
                        message="Card Available"
                        description="Your Collab Card is enabled on your account. Use it within the platform as needed."
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                    />
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className="collab-card-container">
                <div className="card-header">
                    <CreditCardOutlined className="card-icon" />
                    <Title level={3}>Collab Cards</Title>
                </div>

                <div className="card-description">
                    <Text>
                        Get instant access to your earnings with a branded Collab Card. 
                        Two ways to get your card:
                    </Text>
                </div>

                <div className="card-options">
                    {/* Earn It Option */}
                    <Card className="card-option">
                        <div className="option-header">
                            <DollarOutlined className="option-icon" />
                            <Title level={4}>Earn It</Title>
                        </div>
                        
                        <div className="option-content">
                            <Text>Free Collab Card after earning $500 in platform revenue</Text>
                            
                            <div className="earnings-progress">
                                <Text>Current Earnings: ${cardStatus.currentEarnings}</Text>
                                <Progress 
                                    percent={Math.min((cardStatus.currentEarnings / 500) * 100, 100)} 
                                    status={cardStatus.isEligibleForFreeCard ? 'success' : 'active'}
                                />
                                <Text type="secondary">
                                    {cardStatus.isEligibleForFreeCard 
                                        ? 'You qualify for a free card!' 
                                        : `$${500 - cardStatus.currentEarnings} more to qualify`
                                    }
                                </Text>
                            </div>

                            {(() => {
                                const eligible = Boolean(cardStatus.isEligibleForFreeCard || cardStatus.cardEligible || (cardStatus.currentEarnings >= 500));
                                const alreadyClaimed = Boolean(cardStatus.hasCollabCard);
                                return (
                                    <Button
                                        type={alreadyClaimed ? 'default' : 'primary'}
                                        size="large"
                                        onClick={handleEarnItCard}
                                        loading={creatingCard}
                                        disabled={!eligible || alreadyClaimed}
                                        icon={eligible && !alreadyClaimed ? <CheckCircleOutlined /> : <LockOutlined />}
                                    >
                                        {alreadyClaimed ? 'Claimed' : (eligible ? 'Claim Card' : 'Not Yet Eligible')}
                                    </Button>
                                );
                            })()}
                        </div>
                    </Card>

                    {/* Buy It Now Option */}
                    <Card className="card-option">
                        <div className="option-header">
                            <CreditCardOutlined className="option-icon" />
                            <Title level={4}>Buy It Now</Title>
                        </div>
                        
                        <div className="option-content">
                            <Text>Purchase a Collab Card for $10 any time</Text>
                            
                            <div className="purchase-info">
                                <Text strong>One-time payment of $10</Text>
                                <Text type="secondary">Virtual card available immediately</Text>
                                <Text type="secondary">Physical card option coming soon</Text>
                            </div>

                            <Button
                                type="default"
                                size="large"
                                onClick={handleBuyCard}
                                icon={<CreditCardOutlined />}
                            >
                                Buy Card for $10
                            </Button>
                        </div>
                    </Card>
                </div>
            </Card>

            {/* Payment Modal */}
            <Modal
                title="Purchase Collab Card"
                open={showPaymentModal}
                onCancel={() => setShowPaymentModal(false)}
                footer={null}
                width={600}
                centered
            >
                <StripePayment
                    paymentAmount={10}
                    clientId={effectiveUserId}
                    description="Collab Card Purchase"
                    setShowHireModal={setShowPaymentModal}
                    collabCardPurchase
                    onSuccess={handlePaymentSuccess}
                />
            </Modal>

            {/* Card Created Modal */}
            <Modal
                title="Collab Card Created!"
                open={showCardModal}
                onCancel={() => setShowCardModal(false)}
                footer={[
                    <Button key="close" onClick={() => setShowCardModal(false)}>
                        Close
                    </Button>
                ]}
                centered
            >
                <div style={{ textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                    <Title level={4}>Your Collab Card is Ready!</Title>
                    <Text>
                        Your virtual Collab Card has been created and is ready to use. 
                        You can now access your earnings instantly through your card.
                    </Text>
                </div>
            </Modal>
        </>
    );
};

export default CollabCards; 