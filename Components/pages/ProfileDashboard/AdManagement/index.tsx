'use client'
import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, Upload, Typography, Space, Row, Col, Progress, Alert, Table, Tag, Modal, Statistic } from 'antd';
import { UploadOutlined, PlayCircleOutlined, DollarOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, StopOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
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
    getVideoDuration,
    fetchUserAdStats,
    calculateAdMetrics
} from '@/utils/adUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Ad } from '@/types/adTypes';
import dayjs from 'dayjs';
import styles from './style.module.css';
import Stripe from 'stripe';
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';

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

const AdUploadForm = () => {
    const profile = useAppSelector((state) => state.auth);
    const [form] = Form.useForm();
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<string>('');
    const [sessions, setSessions] = useState<SessionOption[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [uploadProgress, setUploadProgress] = useState(0);
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
                .in('status', ['active', 'pending']); // Count both active and pending ads

            if (error) throw error;

            return {
                available: (count || 0) < 10, // Max 10 ads per room
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
                .select('id, title, recurring, one_time_date, end_datetime')
            // .eq('host', profile.profileId);

            if (roomsError) {
                console.error('Error fetching rooms:', roomsError);
                return;
            }

            // Filter out expired rooms (same logic as useAllRoom.ts)
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

            // Map validRooms to ensure each has the 'sessions' property (even if it's empty)
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
            // Validate file
            const validation = validateVideoFile(file);
            if (!validation.isValid) {
                notify({ type: 'error', message: validation.errors.join(', ') })
                return false;
            }

            // Get duration
            const duration = await getVideoDuration(file);

            if (duration < VIDEO_LENGTH_MIN || duration > VIDEO_LENGTH_MAX) {
                notify({ type: "error", message: `Video must be between ${VIDEO_LENGTH_MIN} and ${VIDEO_LENGTH_MAX} seconds` });
                return false;
            }

            setVideoFile(file);
            setVideoDuration(duration);
            notify({ type: "success", message: 'Video validated successfully' });
            return false; // Prevent auto upload
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

            // Create FormData
            const formData = new FormData();
            formData.append('room_id', values.room_id);
            if (values.session_id) formData.append('session_id', values.session_id);
            formData.append('advertiser_id', profile.profileId!);
            formData.append('title', values.title);
            if (values.description) formData.append('description', values.description);
            formData.append('video_file', videoFile);
            formData.append('video_duration', videoDuration.toString());
            formData.append('video_format', videoFile.name.split('.').pop()!);

            // Upload ad
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

            // Create payment intent
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

            // Confirm payment
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
                // Update payment status
                await fetch('/api/ads/payment', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                        status: 'succeeded',
                        charge_id: (paymentIntent as Stripe.PaymentIntent).latest_charge
                    })
                });

                // Notify admin
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

                // Reset form
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
        <div className={styles.adUploadContainer}>
            {step === 'upload' ? (
                <Card title="Upload New Ad" className={styles.uploadCard}>
                    <Alert
                        message="Ad Placement Information"
                        description={AD_BUYER_MESSAGE}
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
                                    message={`Ad Price: ${formatAdPrice(AD_PRICE)}`}
                                    description="Payment will be processed in the next step"
                                    type="warning"
                                    showIcon
                                />
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<PlayCircleOutlined />}
                                    block
                                    size="large"
                                >
                                    Continue to Payment
                                </Button>
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

                        <Button
                            type="primary"
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
                        </Button>

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

const AdList = () => {
    const profile = useAppSelector((state) => state.auth);
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm] = Form.useForm();
    const { notify } = useNotification();
    const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
    const [newVideoDuration, setNewVideoDuration] = useState<number>(0);

    useEffect(() => {
        fetchAds();
        fetchStats();
    }, []);

    const fetchAds = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/ads/upload?advertiser_id=${profile.profileId}`);
            const result = await response.json();

            if (result.success) {
                setAds(result.ads);
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const userStats = await fetchUserAdStats(profile.profileId!);
        setStats(userStats);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'gold';
            case 'active': return 'green';
            case 'rejected': return 'red';
            case 'expired': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <ClockCircleOutlined />;
            case 'active': return <CheckCircleOutlined />;
            case 'rejected': return <StopOutlined />;
            case 'expired': return <StopOutlined />;
            default: return null;
        }
    };

    const handleEditClick = (ad: Ad) => {
        setSelectedAd(ad);
        editForm.setFieldsValue({
            title: ad.title,
            description: ad.description || ''
        });
        setNewVideoFile(null);
        setNewVideoDuration(0);
        setEditVisible(true);
    };

    const handleEditVideoUpload = async (file: File) => {
        try {
            // Validate file
            const validation = validateVideoFile(file);
            if (!validation.isValid) {
                notify({ type: 'error', message: validation.errors.join(', ') });
                return false;
            }

            // Get duration
            const duration = await getVideoDuration(file);

            if (duration < VIDEO_LENGTH_MIN || duration > VIDEO_LENGTH_MAX) {
                notify({ type: "error", message: `Video must be between ${VIDEO_LENGTH_MIN} and ${VIDEO_LENGTH_MAX} seconds` });
                return false;
            }

            setNewVideoFile(file);
            setNewVideoDuration(duration);
            notify({ type: "success", message: 'Video validated successfully' });
            return false; // Prevent auto upload
        } catch (error) {
            notify({ type: "error", message: 'Failed to validate video' });
            return false;
        }
    };

    const handleEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();
            setEditLoading(true);

            // Create FormData if video is being updated
            if (newVideoFile) {
                const formData = new FormData();
                formData.append('ad_id', selectedAd?.id || '');
                formData.append('advertiser_id', profile.profileId!);
                formData.append('title', values.title);
                if (values.description) formData.append('description', values.description);
                formData.append('video_file', newVideoFile);
                formData.append('video_duration', newVideoDuration.toString());
                formData.append('video_format', newVideoFile.name.split('.').pop()!);

                const response = await fetch('/api/ads/user/update', {
                    method: 'PATCH',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    notify({ type: 'success', message: 'Ad updated successfully!' });
                    setEditVisible(false);
                    editForm.resetFields();
                    setSelectedAd(null);
                    setNewVideoFile(null);
                    setNewVideoDuration(0);
                    fetchAds();
                    fetchStats();
                } else {
                    notify({ type: 'error', message: result.error || 'Failed to update ad' });
                }
            } else {
                // Update only text fields (no video)
                const response = await fetch('/api/ads/user/update', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ad_id: selectedAd?.id,
                        advertiser_id: profile.profileId,
                        title: values.title,
                        description: values.description
                    })
                });

                const result = await response.json();

                if (result.success) {
                    notify({ type: 'success', message: 'Ad updated successfully!' });
                    setEditVisible(false);
                    editForm.resetFields();
                    setSelectedAd(null);
                    fetchAds();
                    fetchStats();
                } else {
                    notify({ type: 'error', message: result.error || 'Failed to update ad' });
                }
            }
        } catch (error: any) {
            console.error('Error updating ad:', error);
            notify({ type: 'error', message: 'Failed to update ad' });
        } finally {
            setEditLoading(false);
        }
    };

    const columns: ColumnsType<Ad> = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(record.created_at).format('MMM DD, YYYY')}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Impressions',
            dataIndex: 'impressions_count',
            key: 'impressions',
            render: (count, record) => {
                const metrics = calculateAdMetrics(record);
                const roundedPercentage = Math.round(metrics.impressionPercentage * 100) / 100;
                return (
                    <div>
                        <Text>{count} / 2000</Text>
                        <Progress
                            percent={roundedPercentage}
                            size="small"
                            showInfo={false}
                        />
                    </div>
                );
            },
        },
        {
            title: 'Duration',
            dataIndex: 'video_duration',
            key: 'duration',
            render: (duration) => `${duration}s`,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedAd(record);
                            setPreviewVisible(true);
                        }}
                    >
                        Preview
                    </Button>
                    {(record.status === 'pending' || record.status === 'rejected') && (
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEditClick(record)}
                        >
                            Edit
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.adListContainer}>
            {stats && (
                <div className={styles.adListGrid}>
                    <Card>
                        <Statistic title="Total Ads" value={stats.totalAds} />
                    </Card>
                    <Card>
                        <Statistic title="Active" value={stats.activeAds} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                    <Card>
                        <Statistic title="Total Impressions" value={stats.totalImpressions} />
                    </Card>
                    <Card>
                        <Statistic title="Total Spent" value={stats.totalSpent} prefix="$" />
                    </Card>
                </div>
            )}

            <Card title="My Ads">
                <Table
                    columns={columns}
                    dataSource={ads}
                    loading={loading}
                    scroll={{ x: 900 }}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Ad Preview"
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={null}
                width={800}
            >
                {selectedAd && (
                    <div>
                        <video
                            src={selectedAd.video_url}
                            controls
                            style={{ width: '100%', marginBottom: 16 }}
                        />
                        <Title level={5}>{selectedAd.title}</Title>
                        <Paragraph>{selectedAd.description}</Paragraph>
                        {selectedAd.rejection_reason && (
                            <Alert
                                message="Rejection Reason"
                                description={selectedAd.rejection_reason}
                                type="error"
                                showIcon
                            />
                        )}
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Ad"
                open={editVisible}
                onOk={handleEditSubmit}
                onCancel={() => {
                    setEditVisible(false);
                    editForm.resetFields();
                    setSelectedAd(null);
                    setNewVideoFile(null);
                    setNewVideoDuration(0);
                }}
                confirmLoading={editLoading}
                okText="Save Changes"
                cancelText="Cancel"
                width={700}
            >
                <Alert
                    message="Edit Ad"
                    description="You can update the title, description, and video. All fields are optional, only changed fields will be updated."
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                />

                {/* Current Video Preview */}
                {selectedAd && !newVideoFile && (
                    <div style={{ marginBottom: 20 }}>
                        <Text strong>Current Video:</Text>
                        <video
                            src={selectedAd.video_url}
                            controls
                            style={{ width: '100%', marginTop: 8, borderRadius: 8 }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Duration: {selectedAd.video_duration}s
                        </Text>
                    </div>
                )}

                <Form form={editForm} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Ad Title"
                        rules={[
                            { required: true, message: 'Please enter ad title' },
                            { max: 200, message: 'Title cannot exceed 200 characters' }
                        ]}
                    >
                        <Input placeholder="Enter ad title" maxLength={200} showCount />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description (Optional)"
                        rules={[
                            { max: 500, message: 'Description cannot exceed 500 characters' }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Enter ad description"
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item
                        label={`Replace Video (Optional - ${VIDEO_LENGTH_MIN}-${VIDEO_LENGTH_MAX} seconds, MP4/MOV)`}
                    >
                        <Upload
                            accept="video/mp4,video/quicktime"
                            beforeUpload={handleEditVideoUpload}
                            maxCount={1}
                            onRemove={() => {
                                setNewVideoFile(null);
                                setNewVideoDuration(0);
                            }}
                        >
                            <Button icon={<UploadOutlined />} block>
                                {newVideoFile ? 'Change Video' : 'Upload New Video (Optional)'}
                            </Button>
                        </Upload>
                        {newVideoFile && (
                            <Alert
                                message={`New Video: ${newVideoFile.name} (${newVideoDuration}s)`}
                                type="success"
                                showIcon
                                icon={<CheckCircleOutlined />}
                                style={{ marginTop: 8 }}
                            />
                        )}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

const AdManagement = () => {
    const [activeTab, setActiveTab] = useState<'upload' | 'list'>('list');

    return (
        <div className={styles.adLayoutMain}>
            <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
                <Button
                    type={activeTab === 'list' ? 'primary' : 'default'}
                    onClick={() => setActiveTab('list')}
                >
                    My Ads
                </Button>
                <Button
                    type={activeTab === 'upload' ? 'primary' : 'default'}
                    onClick={() => setActiveTab('upload')}
                >
                    Upload New Ad
                </Button>
            </div>

            <Elements stripe={stripePromise}>
                {activeTab === 'upload' ? <AdUploadForm /> : <AdList />}
            </Elements>
        </div>
    );
};

export default AdManagement;

