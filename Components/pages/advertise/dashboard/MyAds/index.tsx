'use client';
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Typography, Alert, Progress, Form, Input, Upload } from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    StopOutlined,
    UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppSelector } from '@/store';
import { Ad } from '@/types/adTypes';
import {
    validateVideoFile,
    getVideoDuration,
    calculateAdMetrics
} from '@/utils/adUtils';
import { VIDEO_LENGTH_MIN, VIDEO_LENGTH_MAX } from '@/utils/constants/adConstants';
import { useNotification } from '@/Components/custom/custom-notification';
import dayjs from 'dayjs';
import styles from './styles.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const MyAds = () => {
    const profile = useAppSelector((state) => state.auth);
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm] = Form.useForm();
    const { notify } = useNotification();
    const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
    const [newVideoDuration, setNewVideoDuration] = useState<number>(0);

    const fetchAds = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/ads/my-ads?advertiser_id=${profile.profileId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setAds(result.ads);
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
            notify({
                type: 'error',
                message: 'Failed to load ads. Please check your ad blocker settings or try again later.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

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
            const validation = validateVideoFile(file);
            if (!validation.isValid) {
                notify({ type: 'error', message: validation.errors.join(', ') });
                return false;
            }

            const duration = await getVideoDuration(file);

            if (duration < VIDEO_LENGTH_MIN || duration > VIDEO_LENGTH_MAX) {
                notify({ type: "error", message: `Video must be between ${VIDEO_LENGTH_MIN} and ${VIDEO_LENGTH_MAX} seconds` });
                return false;
            }

            setNewVideoFile(file);
            setNewVideoDuration(duration);
            notify({ type: "success", message: 'Video validated successfully' });
            return false;
        } catch (error) {
            notify({ type: "error", message: 'Failed to validate video' });
            return false;
        }
    };

    const handleEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();
            setEditLoading(true);

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
                } else {
                    notify({ type: 'error', message: result.error || 'Failed to update ad' });
                }
            } else {
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
            title: 'Ad Title',
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
        <div className={styles.myAdsContainer}>
            <div className={styles.header}>
                <Title level={2}>My Ads</Title>
                <Paragraph>Manage and track your advertising campaigns</Paragraph>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={ads}
                    loading={loading}
                    scroll={{ x: 1000 }}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Preview Modal */}
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
                    description="You can update the title, description, and video. If rejected, you may revise and resubmit at no cost."
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                />

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

export default MyAds;