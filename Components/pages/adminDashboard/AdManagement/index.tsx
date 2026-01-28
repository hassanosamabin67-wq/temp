'use client'
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Input, Select, Modal, Form, Spin, Space, Statistic, Row, Col, Card, Typography, message, Tooltip } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { supabase } from '@/config/supabase';
import { AdWithDetails } from '@/types/adTypes';
import { AD_STATUS } from '@/utils/constants/adConstants';
import dayjs from 'dayjs';
import styles from './style.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AdManagementProps {
    adminProfile: any;
}

const AdManagement: React.FC<AdManagementProps> = ({ adminProfile }) => {
    const [ads, setAds] = useState<AdWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [statistics, setStatistics] = useState<any>(null);

    // Modal states
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedAd, setSelectedAd] = useState<AdWithDetails | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [form] = Form.useForm();

    useEffect(() => {
        fetchAds();
    }, [statusFilter, searchTerm, pagination.current]);

    const fetchAds = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/ads/admin/list?admin_id=${adminProfile.profileId}&status=${statusFilter}&search=${searchTerm}&page=${pagination.current}&pageSize=${pagination.pageSize}`
            );

            const result = await response.json();

            if (result.success) {
                setAds(result.ads);
                setPagination(prev => ({ ...prev, total: result.total }));
                setStatistics(result.statistics);
            } else {
                message.error('Failed to fetch ads');
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
            message.error('Error loading ads');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (ad: AdWithDetails) => {
        setSelectedAd(ad);
        setApproveModalVisible(true);
    };

    const confirmApprove = async () => {
        if (!selectedAd) return;

        try {
            setActionLoading(true);
            const response = await fetch('/api/ads/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_id: selectedAd.id,
                    admin_id: adminProfile.profileId
                })
            });

            const result = await response.json();

            if (result.success) {
                message.success('Ad approved successfully');
                setApproveModalVisible(false);
                setSelectedAd(null);
                fetchAds();
            } else {
                message.error(result.error || 'Failed to approve ad');
            }
        } catch (error) {
            console.error('Error approving ad:', error);
            message.error('Error approving ad');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            await form.validateFields();
            setActionLoading(true);

            const response = await fetch('/api/ads/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_id: selectedAd?.id,
                    admin_id: adminProfile.profileId,
                    rejection_reason: rejectionReason
                })
            });

            const result = await response.json();

            if (result.success) {
                message.success('Ad rejected successfully');
                setRejectModalVisible(false);
                setRejectionReason('');
                form.resetFields();
                fetchAds();
            } else {
                message.error(result.error || 'Failed to reject ad');
            }
        } catch (error) {
            console.error('Error rejecting ad:', error);
            message.error('Error rejecting ad');
        } finally {
            setActionLoading(false);
        }
    };

    const showPreviewModal = (ad: AdWithDetails) => {
        setSelectedAd(ad);
        setPreviewModalVisible(true);
    };

    const showRejectModal = (ad: AdWithDetails) => {
        setSelectedAd(ad);
        setRejectModalVisible(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case AD_STATUS.PENDING: return 'gold';
            case AD_STATUS.ACTIVE: return 'green';
            case AD_STATUS.REJECTED: return 'red';
            case AD_STATUS.EXPIRED: return 'default';
            default: return 'default';
        }
    };

    const columns: ColumnsType<AdWithDetails> = [
        {
            title: 'Ad Title',
            dataIndex: 'title',
            key: 'title',
            width: 250,
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
            title: 'Advertiser',
            key: 'advertiser',
            width: 200,
            render: (_, record) => (
                <div>
                    <Text>{record.advertiser?.firstName} {record.advertiser?.lastName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.advertiser?.email}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Room',
            dataIndex: ['room', 'title'],
            key: 'room',
            width: 200,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Impressions',
            dataIndex: 'impressions_count',
            key: 'impressions',
            width: 100,
            align: 'center',
            render: (count) => <Text>{count || 0}</Text>,
        },
        {
            title: 'Duration',
            dataIndex: 'video_duration',
            key: 'duration',
            width: 100,
            align: 'center',
            render: (duration) => <Text>{duration}s</Text>,
        },
        {
            title: 'Payment',
            key: 'payment',
            width: 120,
            render: (_, record) => {
                const purchase = Array.isArray(record.purchase) ? record.purchase[0] : record.purchase;
                if (!purchase) return <Tag>No Payment</Tag>;

                return (
                    <Tag color={purchase.payment_status === 'succeeded' ? 'green' : 'orange'}>
                        {purchase.payment_status?.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Preview">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => showPreviewModal(record)}
                        />
                    </Tooltip>
                    {record.status === AD_STATUS.PENDING && (
                        <>
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleApprove(record)}
                                loading={actionLoading}
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                size="small"
                                icon={<CloseCircleOutlined />}
                                onClick={() => showRejectModal(record)}
                                loading={actionLoading}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={3}>Ad Management</Title>

            {/* Statistics Cards */}
            {statistics && (
                <div className={styles.statsGrid}>
                    <Card>
                        <Statistic
                            title="Total Ads"
                            value={statistics.totalAds}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Pending"
                            value={statistics.pendingAds}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Active"
                            value={statistics.activeAds}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Rejected"
                            value={statistics.rejectedAds}
                            valueStyle={{ color: '#f5222d' }}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Expired"
                            value={statistics.expiredAds}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Total Impressions"
                            value={statistics.totalImpressions}
                        />
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className={styles.filterContainer}>
                <Input
                    placeholder="Search ads..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 300 }}
                />
                <Select
                    placeholder="Filter by status"
                    value={statusFilter || undefined}
                    onChange={setStatusFilter}
                    style={{ width: 200 }}
                    allowClear
                >
                    <Select.Option value="">All Status</Select.Option>
                    <Select.Option value={AD_STATUS.PENDING}>Pending</Select.Option>
                    <Select.Option value={AD_STATUS.ACTIVE}>Active</Select.Option>
                    <Select.Option value={AD_STATUS.REJECTED}>Rejected</Select.Option>
                    <Select.Option value={AD_STATUS.EXPIRED}>Expired</Select.Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={fetchAds}>
                    Refresh
                </Button>
            </div>

            {/* Table */}
            <Table
                columns={columns}
                dataSource={ads}
                loading={loading}
                rowKey="id"
                scroll={{ x: 1400 }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} ads`,
                    onChange: (page, pageSize) => {
                        setPagination({ ...pagination, current: page, pageSize });
                    },
                }}
            />

            {/* Preview Modal */}
            <Modal
                title="Ad Preview"
                open={previewModalVisible}
                onCancel={() => setPreviewModalVisible(false)}
                footer={null}
                width={800}
                centered
                zIndex={1000}
                getContainer={() => document.body}
            >
                {selectedAd && (
                    <div>
                        <Row gutter={16}>
                            <Col span={24}>
                                <video
                                    src={selectedAd.video_url}
                                    controls
                                    style={{ width: '100%', borderRadius: 8, marginBottom: 16 }}
                                />
                            </Col>
                        </Row>
                        <Row gutter={16} style={{ borderBottom: "1px solid gray", padding: "10px 0" }}>
                            <Col span={12}>
                                <Text strong>Title:</Text>
                                <p>{selectedAd.title}</p>
                            </Col>
                            <Col span={12}>
                                <Text strong>Status:</Text>
                                <p><Tag color={getStatusColor(selectedAd.status)}>{selectedAd.status.toUpperCase()}</Tag></p>
                            </Col>
                        </Row>
                        <Row gutter={16} style={{ borderBottom: "1px solid gray", padding: "10px 0" }}>
                            <Col span={24}>
                                <Text strong>Description:</Text>
                                <p>{selectedAd.description || 'No description'}</p>
                            </Col>
                        </Row>
                        <Row gutter={16} style={{ borderBottom: "1px solid gray", padding: "10px 0" }}>
                            <Col span={8}>
                                <Text strong>Duration:</Text>
                                <p>{selectedAd.video_duration} seconds</p>
                            </Col>
                            <Col span={8}>
                                <Text strong>Format:</Text>
                                <p>{selectedAd.video_format.toUpperCase()}</p>
                            </Col>
                            <Col span={8}>
                                <Text strong>Impressions:</Text>
                                <p>{selectedAd.impressions_count}</p>
                            </Col>
                        </Row>
                        <Row gutter={16} style={{ borderBottom: "1px solid gray", padding: "10px 0" }}>
                            <Col span={12}>
                                <Text strong>Room:</Text>
                                <p>{selectedAd.room?.title}</p>
                            </Col>
                            <Col span={12}>
                                <Text strong>Advertiser:</Text>
                                <p>{selectedAd.advertiser?.firstName} {selectedAd.advertiser?.lastName}</p>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>

            {/* Reject Modal */}
            <Modal
                title="Reject Ad"
                open={rejectModalVisible}
                onOk={handleReject}
                onCancel={() => {
                    setRejectModalVisible(false);
                    setRejectionReason('');
                    form.resetFields();
                }}
                confirmLoading={actionLoading}
                okText="Reject"
                okButtonProps={{ danger: true }}
                centered
                zIndex={1000}
                getContainer={() => document.body}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="rejection_reason"
                        label="Rejection Reason"
                        rules={[{ required: true, message: 'Please provide a rejection reason' }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Explain why this ad is being rejected..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </Form.Item>
                </Form>
                <Text type="secondary">
                    The advertiser will be notified and their payment will be refunded.
                </Text>
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal
                title="Approve Ad?"
                open={approveModalVisible}
                onOk={confirmApprove}
                onCancel={() => {
                    setApproveModalVisible(false);
                    setSelectedAd(null);
                }}
                confirmLoading={actionLoading}
                okText="Approve"
                okType="primary"
                cancelText="Cancel"
                centered
                zIndex={1000}
                getContainer={() => document.body}
            >
                <div style={{ padding: '20px 0' }}>
                    {selectedAd && (
                        <>
                            <Text>Are you sure you want to approve the following ad?</Text>
                            <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                                <Text strong>Title: </Text>
                                <Text>{selectedAd.title}</Text>
                                <br />
                                <Text strong>Advertiser: </Text>
                                <Text>{selectedAd.advertiser?.email || 'N/A'}</Text>
                                <br />
                                <Text strong>Room: </Text>
                                <Text>{selectedAd.room?.title || 'N/A'}</Text>
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <Text type="secondary">
                                    Once approved, this ad will be active and start showing to users.
                                </Text>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default AdManagement;