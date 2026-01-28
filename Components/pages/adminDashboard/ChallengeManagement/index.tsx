'use client'
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Input, Select, Modal, Form, Space, Statistic, Row, Col, Card, Typography, Tooltip, DatePicker, List, Avatar, Badge, Popconfirm, Upload, Image } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, TrophyOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, StarOutlined, CrownOutlined, DownloadOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/es/form';
import type { UploadFile, UploadProps, RcFile } from 'antd/es/upload';
import { supabase } from '@/config/supabase';
import { CommunityChallenge, ChallengeSubmission, ChallengeStatistics, ChallengeStatus, ChallengePrize } from '@/types/challengeTypes';
import dayjs from 'dayjs';
import styles from './style.module.css';
import { useNotification } from '@/Components/custom/custom-notification';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ChallengeFormProps {
    formInstance: FormInstance;
    onFinish: (values: any) => void;
    isEdit?: boolean;
    prizes: ChallengePrize[];
    setPrizes: React.Dispatch<React.SetStateAction<ChallengePrize[]>>;
    rules: string[];
    setRules: React.Dispatch<React.SetStateAction<string[]>>;
    coverImageFile: File | null;
    setCoverImageFile: React.Dispatch<React.SetStateAction<File | null>>;
    coverImagePreview: string;
    setCoverImagePreview: React.Dispatch<React.SetStateAction<string>>;
    uploadingCoverImage: boolean;
}

const ChallengeForm: React.FC<ChallengeFormProps> = ({
    formInstance,
    onFinish,
    isEdit = false,
    prizes,
    setPrizes,
    rules,
    setRules,
    coverImageFile,
    setCoverImageFile,
    coverImagePreview,
    setCoverImagePreview,
    uploadingCoverImage
}) => {
    const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
        // Validate file type
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            return Upload.LIST_IGNORE;
        }

        // Store the file as File type
        setCoverImageFile(file as File);

        // Create preview URL using URL.createObjectURL for immediate display
        const previewUrl = URL.createObjectURL(file);
        setCoverImagePreview(previewUrl);

        // Return false to prevent auto upload
        return false;
    };

    const handleRemoveCoverImage = () => {
        // Revoke the blob URL to free memory (only if it's a blob URL)
        if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(coverImagePreview);
        }
        setCoverImageFile(null);
        setCoverImagePreview('');
    };

    return (
        <Form form={formInstance} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="title"
                        label="Challenge Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g., Design a Digital Album Cover" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select placeholder="Select category">
                            <Select.Option value="Visual Arts">Visual Arts</Select.Option>
                            <Select.Option value="Music">Music</Select.Option>
                            <Select.Option value="Writing">Writing</Select.Option>
                            <Select.Option value="Video">Video</Select.Option>
                            <Select.Option value="Design">Design</Select.Option>
                            <Select.Option value="Other">Other</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="brief"
                label="Creative Brief"
                rules={[{ required: true, message: 'Please enter a brief' }]}
            >
                <Input placeholder="Short tagline for the challenge" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Full Description"
                rules={[{ required: true, message: 'Please enter a description' }]}
            >
                <TextArea rows={4} placeholder="Detailed description of the challenge..." />
            </Form.Item>

            <Form.Item
                name="submission_format"
                label="Submission Format"
                rules={[{ required: true, message: 'Please specify the submission format' }]}
            >
                <Input placeholder="e.g., JPEG/PNG - 3000x3000px, Max 10MB" />
            </Form.Item>

            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item
                        name="deadline"
                        label="Submission Deadline"
                        rules={[{ required: true, message: 'Please select a deadline' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="voting_start_date" label="Voting Start Date">
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="voting_end_date" label="Voting End Date">
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item label="Cover Image">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {coverImagePreview ? (
                        <div style={{ position: 'relative', width: 'fit-content' }}>
                            <Image
                                src={coverImagePreview}
                                alt="Cover preview"
                                style={{ maxWidth: 300, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                            />
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleRemoveCoverImage}
                                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)' }}
                            />
                        </div>
                    ) : (
                        <Upload
                            accept="image/*"
                            showUploadList={false}
                            beforeUpload={handleBeforeUpload}
                            maxCount={1}
                        >
                            <Button icon={uploadingCoverImage ? <LoadingOutlined /> : <UploadOutlined />} disabled={uploadingCoverImage}>
                                {uploadingCoverImage ? 'Uploading...' : 'Select Cover Image'}
                            </Button>
                        </Upload>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Recommended: 1200x630px, Max 5MB (JPG, PNG, WebP)
                    </Text>
                </div>
            </Form.Item>

            {isEdit && (
                <Form.Item name="status" label="Status">
                    <Select>
                        <Select.Option value="draft">Draft</Select.Option>
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="voting">Voting</Select.Option>
                        <Select.Option value="completed">Completed</Select.Option>
                        <Select.Option value="cancelled">Cancelled</Select.Option>
                    </Select>
                </Form.Item>
            )}

            <Form.Item name="featured_on_homepage" valuePropName="checked" label="Featured">
                <Select placeholder="Feature on homepage?">
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                </Select>
            </Form.Item>

            <div style={{ marginBottom: 16 }}>
                <Text strong>Prizes</Text>
                {prizes.map((prize, index) => (
                    <Row gutter={8} key={prize.place} style={{ marginTop: 8 }}>
                        <Col span={4}>
                            <Input value={prize.title} disabled />
                        </Col>
                        <Col span={12}>
                            <Input
                                placeholder="Prize description"
                                value={prize.description}
                                onChange={(e) => {
                                    const newPrizes = [...prizes];
                                    newPrizes[index] = { ...newPrizes[index], description: e.target.value };
                                    setPrizes(newPrizes);
                                }}
                            />
                        </Col>
                        <Col span={8}>
                            <Input
                                placeholder="Badge name"
                                value={prize.badge_name}
                                onChange={(e) => {
                                    const newPrizes = [...prizes];
                                    newPrizes[index] = { ...newPrizes[index], badge_name: e.target.value };
                                    setPrizes(newPrizes);
                                }}
                            />
                        </Col>
                    </Row>
                ))}
            </div>

            <div style={{ marginBottom: 16 }}>
                <Text strong>Rules</Text>
                {rules.map((rule, index) => (
                    <Row gutter={8} key={index} style={{ marginTop: 8 }}>
                        <Col span={22}>
                            <Input
                                value={rule}
                                onChange={(e) => {
                                    const newRules = [...rules];
                                    newRules[index] = e.target.value;
                                    setRules(newRules);
                                }}
                            />
                        </Col>
                        <Col span={2}>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => setRules(rules.filter((_, i) => i !== index))}
                            />
                        </Col>
                    </Row>
                ))}
                <Button
                    type="dashed"
                    onClick={() => setRules([...rules, ''])}
                    style={{ marginTop: 8 }}
                    icon={<PlusOutlined />}
                >
                    Add Rule
                </Button>
            </div>
        </Form>
    );
};

interface ChallengeManagementProps {
    adminProfile: any;
}

const ChallengeManagement: React.FC<ChallengeManagementProps> = ({ adminProfile }) => {
    const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statistics, setStatistics] = useState<ChallengeStatistics | null>(null);
    const { notify } = useNotification()

    // Modal states
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [submissionsModalVisible, setSubmissionsModalVisible] = useState(false);
    const [finalistsModalVisible, setFinalistsModalVisible] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<CommunityChallenge | null>(null);
    const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
    const [selectedFinalists, setSelectedFinalists] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    // Prizes state
    const [prizes, setPrizes] = useState<ChallengePrize[]>([
        { place: 1, title: '1st Place', description: '', badge_name: 'Challenge Winner' },
        { place: 2, title: '2nd Place', description: '', badge_name: '' },
        { place: 3, title: '3rd Place', description: '', badge_name: '' }
    ]);

    // Rules state
    const [rules, setRules] = useState<string[]>([
        'No guaranteed hiring or contracts',
        'No IP ownership transfer required',
        'Challenges are not a substitute for paid services'
    ]);

    // Cover image state
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string>('');
    const [uploadingCoverImage, setUploadingCoverImage] = useState(false);

    // Helper function to upload cover image to Supabase
    const uploadCoverImage = async (file: File): Promise<string | null> => {
        try {
            setUploadingCoverImage(true);
            const fileName = `${Date.now()}_cover_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const filePath = `challenge-covers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('challenge-submissions')
                .upload(filePath, file, {
                    contentType: file.type,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Cover image upload error:', uploadError);
                notify({ type: "error", message: "Failed to upload cover image" });
                return null;
            }

            const uploadedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/challenge-submissions/${filePath}`;
            return uploadedUrl;
        } catch (error) {
            console.error('Error uploading cover image:', error);
            notify({ type: "error", message: "Error uploading cover image" });
            return null;
        } finally {
            setUploadingCoverImage(false);
        }
    };

    // Reset cover image state
    const resetCoverImageState = () => {
        setCoverImageFile(null);
        setCoverImagePreview('');
    };

    useEffect(() => {
        fetchChallenges();
        fetchStatistics();
    }, [statusFilter, searchTerm]);

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('community_challenges')
                .select('*')
                .order('created_at', { ascending: false });

            if (statusFilter) {
                query = query.eq('status', statusFilter);
            }

            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching challenges:', error);
                notify({ type: "error", message: "Failed to fetch challenges" })
                return;
            }

            setChallenges(data || []);
        } catch (error) {
            console.error('Error:', error);
            notify({ type: "error", message: "Error loading challenges" })
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const { data: challengeData } = await supabase
                .from('community_challenges')
                .select('status');

            const { data: submissionData } = await supabase
                .from('challenge_submissions')
                .select('id, visionary_id');

            const { data: voteData } = await supabase
                .from('challenge_votes')
                .select('id');

            const stats: ChallengeStatistics = {
                total_challenges: challengeData?.length || 0,
                active_challenges: challengeData?.filter(c => c.status === 'active' || c.status === 'voting').length || 0,
                completed_challenges: challengeData?.filter(c => c.status === 'completed').length || 0,
                total_submissions: submissionData?.length || 0,
                total_votes: voteData?.length || 0,
                total_participants: new Set(submissionData?.map(s => s.visionary_id)).size || 0
            };

            setStatistics(stats);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleCreateChallenge = async (values: any) => {
        try {
            setActionLoading(true);

            // Upload cover image if provided
            let coverImageUrl: string | null = null;
            if (coverImageFile) {
                coverImageUrl = await uploadCoverImage(coverImageFile);
                if (!coverImageUrl) {
                    setActionLoading(false);
                    return; // Upload failed, error already shown
                }
            }

            const challengeData = {
                title: values.title,
                brief: values.brief,
                description: values.description,
                category: values.category,
                submission_format: values.submission_format,
                deadline: values.deadline.toISOString(),
                voting_start_date: values.voting_start_date?.toISOString(),
                voting_end_date: values.voting_end_date?.toISOString(),
                status: 'draft' as ChallengeStatus,
                prizes: prizes,
                rules: rules,
                created_by: adminProfile.profileId,
                cover_image: coverImageUrl,
                featured_on_homepage: values.featured_on_homepage || false
            };

            const { data, error } = await supabase
                .from('community_challenges')
                .insert(challengeData)
                .select()
                .single();

            if (error) {
                console.error('Error creating challenge:', error);
                notify({ type: "error", message: "Failed to create challenge" });
                return;
            }

            notify({ type: "success", message: "Challenge created successfully!" })
            setCreateModalVisible(false);
            form.resetFields();
            resetCoverImageState();
            fetchChallenges();
            fetchStatistics();
        } catch (error) {
            console.error('Error:', error);
            notify({ type: "error", message: "Error creating challenge" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateChallenge = async (values: any) => {
        if (!selectedChallenge) return;

        try {
            setActionLoading(true);

            // Upload new cover image if provided, otherwise keep existing
            let coverImageUrl: string | null = coverImagePreview || selectedChallenge.cover_image || null;
            if (coverImageFile) {
                const uploadedUrl = await uploadCoverImage(coverImageFile);
                if (!uploadedUrl) {
                    setActionLoading(false);
                    return; // Upload failed, error already shown
                }
                coverImageUrl = uploadedUrl;
            }

            const updateData = {
                title: values.title,
                brief: values.brief,
                description: values.description,
                category: values.category,
                submission_format: values.submission_format,
                deadline: values.deadline.toISOString(),
                voting_start_date: values.voting_start_date?.toISOString(),
                voting_end_date: values.voting_end_date?.toISOString(),
                status: values.status,
                prizes: prizes,
                rules: rules,
                cover_image: coverImageUrl,
                featured_on_homepage: values.featured_on_homepage || false,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('community_challenges')
                .update(updateData)
                .eq('id', selectedChallenge.id);

            if (error) {
                console.error('Error updating challenge:', error);
                notify({ type: "error", message: "Failed to update challenge" });
                return;
            }
            notify({ type: "success", message: "Challenge updated successfully!" });
            setEditModalVisible(false);
            editForm.resetFields();
            setSelectedChallenge(null);
            resetCoverImageState();
            fetchChallenges();
        } catch (error) {
            console.error('Error:', error);
            notify({ type: "error", message: "Error updating challenge" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteChallenge = async (challengeId: string) => {
        try {
            const { error } = await supabase
                .from('community_challenges')
                .delete()
                .eq('id', challengeId);

            if (error) {
                console.error('Error deleting challenge:', error);
                notify({ type: "error", message: "Failed to delete challenge" });
                return;
            }
            notify({ type: "success", message: "Challenge deleted successfully" });
            fetchChallenges();
            fetchStatistics();
        } catch (error) {
            console.error('Error:', error);
            notify({ type: "error", message: "Error deleting challenge" });
        }
    };

    const handleStatusChange = async (challengeId: string, newStatus: ChallengeStatus) => {
        try {
            const { error } = await supabase
                .from('community_challenges')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', challengeId);

            if (error) {
                console.error('Error updating status:', error);
                notify({ type: "error", message: "Failed to update status" });
                return;
            }
            notify({ type: "success", message: `Challenge status updated to ${newStatus}` });
            fetchChallenges();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchSubmissions = async (challengeId: string) => {
        try {
            // First try with join
            const { data, error } = await supabase
                .from('challenge_submissions')
                .select(`
                    *,
                    visionary:visionary_id(
                        userId, firstName, lastName, userName, profileImage, isVerified
                    )
                `)
                .eq('challenge_id', challengeId)
                .order('created_at', { ascending: false });

            if (error) {
                console.log('Join query failed, fetching without join:', error);
                // Fallback: fetch submissions without join
                const { data: basicSubmissions } = await supabase
                    .from('challenge_submissions')
                    .select('*')
                    .eq('challenge_id', challengeId)
                    .order('created_at', { ascending: false });

                if (basicSubmissions && basicSubmissions.length > 0) {
                    // Manually fetch user data
                    const userIds = [...new Set(basicSubmissions.map(s => s.visionary_id))];
                    const { data: users } = await supabase
                        .from('users')
                        .select('userId, firstName, lastName, userName, profileImage, isVerified')
                        .in('userId', userIds);

                    const userMap = new Map(users?.map(u => [u.userId, u]) || []);
                    const submissionsWithUsers = basicSubmissions.map(s => ({
                        ...s,
                        visionary: userMap.get(s.visionary_id) || null
                    }));
                    setSubmissions(submissionsWithUsers);
                } else {
                    setSubmissions(basicSubmissions || []);
                }
                return;
            }

            setSubmissions(data || []);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDownloadFile = (fileUrl: string, fileName: string) => {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName || 'submission-file';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleApproveSubmission = async (submissionId: string) => {
        try {
            const { error } = await supabase
                .from('challenge_submissions')
                .update({ status: 'approved', updated_at: new Date().toISOString() })
                .eq('id', submissionId);

            if (error) {
                notify({ type: "error", message: "Failed to approve submission" });
                return;
            }
            notify({ type: "success", message: "Submission approved" });
            if (selectedChallenge) {
                fetchSubmissions(selectedChallenge.id);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleRejectSubmission = async (submissionId: string) => {
        try {
            const { error } = await supabase
                .from('challenge_submissions')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('id', submissionId);

            if (error) {
                notify({ type: "error", message: "Failed to reject submission" });
                return;
            }
            notify({ type: "success", message: "Submission rejected" });
            if (selectedChallenge) {
                fetchSubmissions(selectedChallenge.id);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleViewSubmissions = (challenge: CommunityChallenge) => {
        setSelectedChallenge(challenge);
        fetchSubmissions(challenge.id);
        setSubmissionsModalVisible(true);
    };

    const handleSelectFinalists = (challenge: CommunityChallenge) => {
        setSelectedChallenge(challenge);
        fetchSubmissions(challenge.id);
        setSelectedFinalists([]);
        setFinalistsModalVisible(true);
    };

    const handleSaveFinalists = async () => {
        if (!selectedChallenge) return;

        if (selectedFinalists.length < 3 || selectedFinalists.length > 5) {
            notify({ type: "warning", message: "Please select 3-5 finalists" });
            return;
        }

        try {
            setActionLoading(true);

            // Update all submissions to not be finalists first
            await supabase
                .from('challenge_submissions')
                .update({ status: 'approved' })
                .eq('challenge_id', selectedChallenge.id)
                .eq('status', 'finalist');

            // Set selected submissions as finalists
            const { error } = await supabase
                .from('challenge_submissions')
                .update({ status: 'finalist', updated_at: new Date().toISOString() })
                .in('id', selectedFinalists);

            if (error) {
                console.error('Error saving finalists:', error);
                notify({ type: "error", message: "Failed to save finalists" });
                return;
            }

            // Update challenge status to voting
            await supabase
                .from('community_challenges')
                .update({ status: 'voting', updated_at: new Date().toISOString() })
                .eq('id', selectedChallenge.id);

            notify({ type: "success", message: "Finalists selected! Voting phase started." });
            setFinalistsModalVisible(false);
            fetchChallenges();
        } catch (error) {
            console.error('Error:', error);
            notify({ type: "error", message: "Error saving finalists" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSelectWinner = async (submissionId: string, visionaryId: string) => {
        if (!selectedChallenge) return;

        try {
            setActionLoading(true);

            // Update submission status to winner
            await supabase
                .from('challenge_submissions')
                .update({ status: 'winner', updated_at: new Date().toISOString() })
                .eq('id', submissionId);

            // Update challenge with winner and status
            await supabase
                .from('community_challenges')
                .update({
                    winner_id: visionaryId,
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedChallenge.id);

            // Award badge to winner
            await supabase
                .from('challenge_badges')
                .insert({
                    user_id: visionaryId,
                    challenge_id: selectedChallenge.id,
                    badge_type: 'winner',
                    badge_name: selectedChallenge.prizes?.[0]?.badge_name || 'Challenge Winner',
                    awarded_at: new Date().toISOString()
                });
            notify({ type: "success", message: "Winner selected! Challenge completed" });
            setSubmissionsModalVisible(false);
            fetchChallenges();
            fetchStatistics();
        } catch (error) {
            console.error('Error:', error);
            notify({ type: "error", message: "Error selecting winner" })
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (challenge: CommunityChallenge) => {
        setSelectedChallenge(challenge);
        setPrizes(challenge.prizes || []);
        setRules(challenge.rules || []);
        // Set existing cover image preview
        setCoverImagePreview(challenge.cover_image || '');
        setCoverImageFile(null);
        editForm.setFieldsValue({
            ...challenge,
            deadline: dayjs(challenge.deadline),
            voting_start_date: challenge.voting_start_date ? dayjs(challenge.voting_start_date) : null,
            voting_end_date: challenge.voting_end_date ? dayjs(challenge.voting_end_date) : null
        });
        setEditModalVisible(true);
    };

    const getStatusColor = (status: ChallengeStatus) => {
        switch (status) {
            case 'draft': return 'default';
            case 'active': return 'green';
            case 'voting': return 'blue';
            case 'completed': return 'gold';
            case 'cancelled': return 'red';
            default: return 'default';
        }
    };

    const columns: ColumnsType<CommunityChallenge> = [
        {
            title: 'Challenge',
            dataIndex: 'title',
            key: 'title',
            width: 300,
            render: (text, record) => (
                <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.category} • {dayjs(record.deadline).format('MMM DD, YYYY')}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: ChallengeStatus) => (
                <Tag color={getStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Deadline',
            dataIndex: 'deadline',
            key: 'deadline',
            width: 150,
            render: (date) => dayjs(date).format('MMM DD, YYYY'),
        },
        {
            title: 'Featured',
            dataIndex: 'featured_on_homepage',
            key: 'featured',
            width: 100,
            align: 'center',
            render: (featured) => featured ? <StarOutlined style={{ color: '#faad14' }} /> : '-',
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 300,
            render: (_, record) => (
                <Space wrap>
                    <Tooltip title="View Submissions">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewSubmissions(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(record)}
                        />
                    </Tooltip>
                    {record.status === 'active' && (
                        <Tooltip title="Select Finalists">
                            <Button
                                type="primary"
                                size="small"
                                icon={<TrophyOutlined />}
                                onClick={() => handleSelectFinalists(record)}
                            >
                                Finalists
                            </Button>
                        </Tooltip>
                    )}
                    {record.status === 'draft' && (
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => handleStatusChange(record.id, 'active')}
                        >
                            Publish
                        </Button>
                    )}
                    <Popconfirm
                        title="Delete this challenge?"
                        onConfirm={() => handleDeleteChallenge(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <Title level={3}>
                <TrophyOutlined /> Community Challenge Management
            </Title>

            {/* Statistics Cards */}
            {statistics && (
                <div className={styles.statsGrid}>
                    <Card>
                        <Statistic
                            title="Total Challenges"
                            value={statistics.total_challenges}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Active"
                            value={statistics.active_challenges}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Completed"
                            value={statistics.completed_challenges}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Total Submissions"
                            value={statistics.total_submissions}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Total Votes"
                            value={statistics.total_votes}
                        />
                    </Card>
                    <Card>
                        <Statistic
                            title="Participants"
                            value={statistics.total_participants}
                        />
                    </Card>
                </div>
            )}

            {/* Filters & Actions */}
            <div className={styles.filterDiv}>
                <Input
                    placeholder="Search challenges..."
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
                    <Select.Option value="draft">Draft</Select.Option>
                    <Select.Option value="active">Active</Select.Option>
                    <Select.Option value="voting">Voting</Select.Option>
                    <Select.Option value="completed">Completed</Select.Option>
                    <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={fetchChallenges}>
                    Refresh
                </Button>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                >
                    Create Challenge
                </Button>
            </div>

            {/* Challenges Table */}
            <Table
                columns={columns}
                dataSource={challenges}
                loading={loading}
                rowKey="id"
                scroll={{ x: 1200 }}
            />

            {/* Create Challenge Modal */}
            <Modal
                title="Create New Challenge"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    form.resetFields();
                    resetCoverImageState();
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setCreateModalVisible(false);
                        resetCoverImageState();
                    }}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={actionLoading || uploadingCoverImage}
                        onClick={() => form.submit()}
                    >
                        Create Challenge
                    </Button>
                ]}
                width={900}
                centered
            >
                <ChallengeForm
                    formInstance={form}
                    onFinish={handleCreateChallenge}
                    prizes={prizes}
                    setPrizes={setPrizes}
                    rules={rules}
                    setRules={setRules}
                    coverImageFile={coverImageFile}
                    setCoverImageFile={setCoverImageFile}
                    coverImagePreview={coverImagePreview}
                    setCoverImagePreview={setCoverImagePreview}
                    uploadingCoverImage={uploadingCoverImage}
                />
            </Modal>

            {/* Edit Challenge Modal */}
            <Modal
                title="Edit Challenge"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    editForm.resetFields();
                    setSelectedChallenge(null);
                    resetCoverImageState();
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setEditModalVisible(false);
                        resetCoverImageState();
                    }}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={actionLoading || uploadingCoverImage}
                        onClick={() => editForm.submit()}
                    >
                        Update Challenge
                    </Button>
                ]}
                width={900}
                centered
            >
                <ChallengeForm
                    formInstance={editForm}
                    onFinish={handleUpdateChallenge}
                    isEdit
                    prizes={prizes}
                    setPrizes={setPrizes}
                    rules={rules}
                    setRules={setRules}
                    coverImageFile={coverImageFile}
                    setCoverImageFile={setCoverImageFile}
                    coverImagePreview={coverImagePreview}
                    setCoverImagePreview={setCoverImagePreview}
                    uploadingCoverImage={uploadingCoverImage}
                />
            </Modal>

            {/* View Submissions Modal */}
            <Modal
                title={`Submissions - ${selectedChallenge?.title}`}
                open={submissionsModalVisible}
                onCancel={() => {
                    setSubmissionsModalVisible(false);
                    setSelectedChallenge(null);
                    setSubmissions([]);
                }}
                footer={null}
                width={1100}
                centered
            >
                {submissions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Text type="secondary">No submissions yet</Text>
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={submissions}
                        renderItem={(submission) => (
                            <List.Item
                                actions={[
                                    // Download button
                                    submission.file_url && (
                                        <Tooltip title="Download File" key="download">
                                            <Button
                                                type="default"
                                                icon={<DownloadOutlined />}
                                                onClick={() => handleDownloadFile(
                                                    submission.file_url,
                                                    `${submission.title}-${submission.visionary?.userName || 'submission'}`
                                                )}
                                            >
                                                Download
                                            </Button>
                                        </Tooltip>
                                    ),
                                    // Approve/Reject buttons for pending submissions
                                    submission.status === 'pending' && (
                                        <Space key="approve-reject">
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<CheckCircleOutlined />}
                                                onClick={() => handleApproveSubmission(submission.id)}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                danger
                                                size="small"
                                                icon={<CloseCircleOutlined />}
                                                onClick={() => handleRejectSubmission(submission.id)}
                                            >
                                                Reject
                                            </Button>
                                        </Space>
                                    ),
                                    // Select winner button for finalists
                                    submission.status === 'finalist' && selectedChallenge?.status === 'voting' && (
                                        <Button
                                            key="winner"
                                            type="primary"
                                            icon={<CrownOutlined />}
                                            onClick={() => handleSelectWinner(submission.id, submission.visionary_id)}
                                            loading={actionLoading}
                                        >
                                            Select Winner
                                        </Button>
                                    ),
                                    // Status tag
                                    <Tag
                                        key="status"
                                        color={
                                            submission.status === 'winner' ? 'gold' :
                                                submission.status === 'finalist' ? 'blue' :
                                                    submission.status === 'approved' ? 'green' :
                                                        submission.status === 'pending' ? 'orange' :
                                                            submission.status === 'rejected' ? 'red' : 'default'
                                        }
                                    >
                                        {submission.status.toUpperCase()}
                                    </Tag>
                                ].filter(Boolean)}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <div style={{ width: 100, height: 100, position: 'relative' }}>
                                            {submission.thumbnail_url || submission.file_url ? (
                                                <img
                                                    src={submission.thumbnail_url || submission.file_url}
                                                    alt={submission.title}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: 8
                                                    }}
                                                />
                                            ) : (
                                                <Avatar size={100} icon={<EyeOutlined />} />
                                            )}
                                        </div>
                                    }
                                    title={
                                        <Space direction="vertical" size={4}>
                                            <Text strong style={{ fontSize: 16 }}>{submission.title}</Text>
                                            <Space>
                                                <Text type="secondary">
                                                    by {submission.visionary?.userName || submission.visionary?.firstName || 'Unknown'}
                                                </Text>
                                                <Badge count={submission.vote_count} showZero style={{ backgroundColor: '#1890ff' }} />
                                            </Space>
                                        </Space>
                                    }
                                    description={
                                        <div>
                                            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 4 }}>
                                                {submission.description || 'No description provided'}
                                            </Paragraph>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Submitted: {dayjs(submission.created_at).format('MMM DD, YYYY h:mm A')}
                                            </Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Modal>

            {/* Select Finalists Modal */}
            <Modal
                title={`Select Finalists (3-5) - ${selectedChallenge?.title}`}
                open={finalistsModalVisible}
                onCancel={() => {
                    setFinalistsModalVisible(false);
                    setSelectedChallenge(null);
                    setSubmissions([]);
                    setSelectedFinalists([]);
                }}
                footer={[
                    <Button key="cancel" onClick={() => setFinalistsModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={actionLoading}
                        onClick={handleSaveFinalists}
                        disabled={selectedFinalists.length < 3 || selectedFinalists.length > 5}
                    >
                        Save Finalists ({selectedFinalists.length}/5)
                    </Button>
                ]}
                width={1000}
                centered
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Select 3-5 submissions to advance to the voting stage. Consider quality and relevance.
                </Text>
                <List
                    itemLayout="horizontal"
                    dataSource={submissions.filter(s => s.status === 'approved' || s.status === 'finalist' || s.status === 'pending')}
                    renderItem={(submission) => (
                        <List.Item
                            actions={[
                                submission.file_url && (
                                    <Tooltip title="Download File" key="download">
                                        <Button
                                            type="text"
                                            icon={<DownloadOutlined />}
                                            onClick={() => handleDownloadFile(
                                                submission.file_url,
                                                `${submission.title}-${submission.visionary?.userName || 'submission'}`
                                            )}
                                        />
                                    </Tooltip>
                                ),
                                <Tag
                                    key="status"
                                    color={
                                        submission.status === 'approved' ? 'green' :
                                            submission.status === 'pending' ? 'orange' :
                                                submission.status === 'finalist' ? 'blue' : 'default'
                                    }
                                >
                                    {submission.status.toUpperCase()}
                                </Tag>,
                                <Button
                                    key="select"
                                    type={selectedFinalists.includes(submission.id) ? 'primary' : 'default'}
                                    icon={selectedFinalists.includes(submission.id) ? <CheckCircleOutlined /> : null}
                                    onClick={() => {
                                        if (selectedFinalists.includes(submission.id)) {
                                            setSelectedFinalists(selectedFinalists.filter(id => id !== submission.id));
                                        } else if (selectedFinalists.length < 5) {
                                            setSelectedFinalists([...selectedFinalists, submission.id]);
                                        } else {
                                            notify({ type: "warning", message: "Maximum 5 finalists allowed" })
                                        }
                                    }}
                                >
                                    {selectedFinalists.includes(submission.id) ? 'Selected' : 'Select'}
                                </Button>
                            ].filter(Boolean)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <div style={{ width: 80, height: 80 }}>
                                        {submission.thumbnail_url || submission.file_url ? (
                                            <img
                                                src={submission.thumbnail_url || submission.file_url}
                                                alt={submission.title}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: 8
                                                }}
                                            />
                                        ) : (
                                            <Avatar size={80} icon={<EyeOutlined />} />
                                        )}
                                    </div>
                                }
                                title={
                                    <Space>
                                        <Text strong>{submission.title}</Text>
                                        <Text type="secondary">by {submission.visionary?.userName || submission.visionary?.firstName || 'Unknown'}</Text>
                                    </Space>
                                }
                                description={submission.description || 'No description'}
                            />
                        </List.Item>
                    )}
                />
            </Modal>
        </div>
    );
};

export default ChallengeManagement;