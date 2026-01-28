'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, Upload, Typography, Space, Alert } from 'antd';
import { UploadOutlined, PlayCircleOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store';
import {
    AD_PRICE,
    AD_BUYER_MESSAGE,
    VIDEO_LENGTH_MIN,
    VIDEO_LENGTH_MAX,
    VALIDATION_MESSAGES,
    formatAdPrice
} from '@/utils/constants/adConstants';
import {
    validateVideoFile,
    getVideoDuration
} from '@/utils/adUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import Stripe from 'stripe';
import dayjs from 'dayjs';
import styles from './styles.module.css';
import { useRouter } from 'next/navigation';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface RoomOption {
    id: string;
    title: string;
    sessions: SessionOption[];
}

interface SessionOption {
    id: string;
    event_name: string;
    event_date: string;
    event_start_time: string;
}

const UploadForm = () => {
    const profile = useAppSelector((state) => state.auth);
    const router = useRouter();
    const [form] = Form.useForm();
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<string>('');
    const [sessions, setSessions] = useState<SessionOption[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [step, setStep] = useState<'upload' | 'payment'>('upload');
    const [createdAdId, setCreatedAdId] = useState<string>('');
    const { notify } = useNotification();

    useEffect(() => {
        fetchRooms();
    }, []);

    const checkAdSlotsAvailable = async (roomId: string): Promise<{ available: boolean; currentCount: number }> => {
        try {
            const { count, error } = await supabase
                .from('ads')
                .select('id', { count: 'exact', head: true })
                .eq('room_id', roomId)
                .in('status', ['active', 'pending']);

            if (error) throw error;

            return {
                available: (count || 0) < 10,
                currentCount: count || 0
            };
        } catch (error) {
            console.error('Error checking ad slots:', error);
            return { available: false, currentCount: 0 };
        }
    };

    const fetchRooms = async () => {
        try {
            const { data: allRooms, error: roomsError } = await supabase
                .from('thinktank')
                .select('id, title, recurring, one_time_date, end_datetime');

            if (roomsError) {
                console.error('Error fetching rooms:', roomsError);
                return;
            }

            const now = new Date();
            const validRooms = (allRooms || []).filter((room: any) => {
                if (room.recurring === 'One-Time Think Tank') {
                    const expiryDate = new Date(room.one_time_date);
                    if (!expiryDate || isNaN(expiryDate.getTime())) return false;
                    return expiryDate >= now;
                }
                const expiryDate = new Date(room.end_datetime);
                if (!expiryDate || isNaN(expiryDate.getTime())) return false;
                return expiryDate >= now;
            });

            const formattedRooms: RoomOption[] = (validRooms || []).map((room: any) => ({
                ...room,
                sessions: room.sessions || [],
            }));

            setRooms(formattedRooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const handleRoomChange = (roomId: string) => {
        setSelectedRoom(roomId);
        const room = rooms.find(r => r.id === roomId);
        setSessions(room?.sessions || []);
        form.setFieldValue('session_id', undefined);
    };

    const handleVideoUpload = async (file: File) => {
        try {
            const validation = validateVideoFile(file);
            if (!validation.isValid) {
                notify({ type: 'error', message: validation.errors.join(', ') })
                return false;
            }

            const duration = await getVideoDuration(file);

            if (duration < VIDEO_LENGTH_MIN || duration > VIDEO_LENGTH_MAX) {
                notify({ type: "error", message: `Video must be between ${VIDEO_LENGTH_MIN} and ${VIDEO_LENGTH_MAX} seconds` });
                return false;
            }

            setVideoFile(file);
            setVideoDuration(duration);
            notify({ type: "success", message: 'Video validated successfully' });
            return false;
        } catch (error) {
            notify({ type: "error", message: 'Failed to validate video' });
            return false;
        }
    };

    const handleSubmit = async () => {
        try {
            await form.validateFields();
            setLoading(true);

            const values = form.getFieldsValue();

            if (!videoFile) {
                notify({ type: "error", message: VALIDATION_MESSAGES.VIDEO_REQUIRED });
                return;
            }

            const { available, currentCount } = await checkAdSlotsAvailable(values.room_id);

            if (!available) {
                notify({ type: "error", message: `Maximum number of ads (10) reached for this room. Please choose a different room or contact support.` });
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('room_id', values.room_id);
            if (values.session_id) formData.append('session_id', values.session_id);
            formData.append('advertiser_id', profile.profileId!);
            formData.append('title', values.title);
            if (values.description) formData.append('description', values.description);
            formData.append('video_file', videoFile);
            formData.append('video_duration', videoDuration.toString());
            formData.append('video_format', videoFile.name.split('.').pop()!);

            const uploadResponse = await fetch('/api/ads/upload', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                notify({ type: "error", message: uploadResult.error || 'Failed to upload ad' });
                return;
            }

            setCreatedAdId(uploadResult.ad.id);
            setStep('payment');
            notify({ type: "success", message: 'Ad uploaded successfully! Please complete payment.' });

        } catch (error: any) {
            console.error('Error submitting ad:', error);
            notify({ type: "error", message: error.message || 'Failed to upload ad' });
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!stripe || !elements) return;

        try {
            setLoading(true);

            const paymentResponse = await fetch('/api/ads/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_id: createdAdId,
                    advertiser_id: profile.profileId
                })
            });

            const paymentResult = await paymentResponse.json();

            if (!paymentResult.success) {
                notify({ type: "error", message: paymentResult.error || 'Failed to create payment' });
                return;
            }

            const cardElement = elements.getElement(CardElement);
            if (!cardElement) return;

            const { error, paymentIntent } = await stripe.confirmCardPayment(
                paymentResult.clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: `${profile.firstName} ${profile.lastName}`,
                            email: profile.email
                        }
                    }
                }
            );

            if (error) {
                notify({ type: "error", message: error.message || 'Payment failed' });
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                await fetch('/api/ads/payment', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                        status: 'succeeded',
                        charge_id: (paymentIntent as Stripe.PaymentIntent).latest_charge
                    })
                });

                await fetch('/api/admin-email/ad-notifications/new-ad', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        adId: createdAdId,
                        adTitle: form.getFieldValue('title'),
                        roomTitle: rooms.find(r => r.id === selectedRoom)?.title || 'Unknown',
                        advertiserName: `${profile.firstName} ${profile.lastName}`,
                        advertiserEmail: profile.email,
                        adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
                        approvalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin-dashboard`
                    })
                });

                notify({ type: "success", message: 'Payment successful! Your ad is pending approval.' });
                router.push('/advertise/confirmation');

                form.resetFields();
                setVideoFile(null);
                setVideoDuration(0);
                setStep('upload');
                setCreatedAdId('');
            }

        } catch (error: any) {
            console.error('Payment error:', error);
            notify({ type: "error", message: error.message || 'Payment failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.uploadContainer}>
            {step === 'upload' ? (
                <Card title="Upload New Advertisement" className={styles.uploadCard}>
                    <Alert
                        message="Approval Notice"
                        description="All ads must pass review. If rejected, you may revise and resubmit at no cost."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item
                            label="Ad Title"
                            name="title"
                            rules={[{ required: true, message: VALIDATION_MESSAGES.TITLE_REQUIRED }]}
                        >
                            <Input placeholder="Enter a catchy title for your ad" maxLength={200} showCount />
                        </Form.Item>

                        <Form.Item
                            label="Description (Optional)"
                            name="description"
                        >
                            <TextArea
                                rows={3}
                                placeholder="Brief description of your ad"
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item
                            label="Select Room"
                            name="room_id"
                            rules={[{ required: true, message: VALIDATION_MESSAGES.ROOM_REQUIRED }]}
                        >
                            <Select
                                placeholder="Choose a room"
                                onChange={handleRoomChange}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {rooms.map(room => (
                                    <Option key={room.id} value={room.id}>
                                        {room.title}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {selectedRoom && sessions.length > 0 && (
                            <Form.Item
                                label="Select Session (Optional)"
                                name="session_id"
                            >
                                <Select placeholder="Choose a specific session or leave blank for all">
                                    {sessions.map(session => (
                                        <Option key={session.id} value={session.id}>
                                            {session.event_name} - {dayjs(session.event_date).format('MMM DD, YYYY')}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                        <Form.Item
                            label={`Video Upload (${VIDEO_LENGTH_MIN}-${VIDEO_LENGTH_MAX} seconds, MP4/MOV)`}
                            required
                        >
                            <Upload
                                accept="video/mp4,video/quicktime"
                                beforeUpload={handleVideoUpload}
                                maxCount={1}
                                onRemove={() => {
                                    setVideoFile(null);
                                    setVideoDuration(0);
                                }}
                            >
                                <Button icon={<UploadOutlined />} block>
                                    Select Video File
                                </Button>
                            </Upload>
                            {videoFile && (
                                <Alert
                                    message={`Video: ${videoFile.name} (${videoDuration}s)`}
                                    type="success"
                                    showIcon
                                    icon={<CheckCircleOutlined />}
                                    style={{ marginTop: 8 }}
                                />
                            )}
                        </Form.Item>

                        <Form.Item>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Alert
                                    message={`Price: ${formatAdPrice(AD_PRICE)}`}
                                    description="Payment will be processed in the next step"
                                    type="warning"
                                    showIcon
                                />
                                <ActionButton
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<PlayCircleOutlined />}
                                    block
                                    size="large"
                                >
                                    Continue to Payment
                                </ActionButton>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            ) : (
                <Card title="Complete Payment" className={styles.paymentCard}>
                    <Alert
                        message="Ad Uploaded Successfully"
                        description="Complete payment to submit your ad for admin approval"
                        type="success"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <div style={{ marginBottom: 24 }}>
                        <Title level={4}>Payment Details</Title>
                        <Paragraph>
                            <Text strong>Amount:</Text> {formatAdPrice(AD_PRICE)}
                        </Paragraph>
                        <Paragraph>
                            <Text strong>Ad Title:</Text> {form.getFieldValue('title')}
                        </Paragraph>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handlePayment();
                    }} style={{
                        padding: 20,
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        background: "#fff",
                    }}>
                        <h3 style={{ textAlign: "center", marginBottom: 20 }}>Card Payment</h3>

                        <div style={{
                            padding: '12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            marginBottom: '20px',
                            backgroundColor: '#fafafa'
                        }}>
                            <CardElement
                                options={{
                                    hidePostalCode: true,
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                                        },
                                        invalid: {
                                            color: '#fa755a',
                                            iconColor: '#fa755a'
                                        }
                                    },
                                }}
                            />
                        </div>

                        <ActionButton
                            htmlType="submit"
                            loading={loading}
                            icon={<DollarOutlined />}
                            block
                            size="large"
                            disabled={!stripe || loading}
                            style={{
                                marginBottom: 10,
                                height: 45,
                                fontSize: 16,
                                fontWeight: 'bold'
                            }}
                        >
                            {loading ? "Processing..." : `Pay ${formatAdPrice(AD_PRICE)}`}
                        </ActionButton>

                        <Button
                            onClick={() => setStep('upload')}
                            disabled={loading}
                            block
                            size="large"
                            style={{ height: 45 }}
                        >
                            Back to Form
                        </Button>
                    </form>

                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            🔒 Secured by Stripe. Your payment information is safe.
                        </Text>
                    </div>
                </Card>
            )}
        </div>
    );
};

const UploadNewAd = () => {
    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Upload New Ad</Title>
                <Paragraph>Create and upload your advertisement to reach your target audience</Paragraph>
            </div>
            <Elements stripe={stripePromise}>
                <UploadForm />
            </Elements>
        </div>
    );
};

export default UploadNewAd;