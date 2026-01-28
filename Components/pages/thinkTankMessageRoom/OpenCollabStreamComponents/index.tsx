import React, { useState, useEffect } from 'react';
import { Tabs, Button, Upload, Card, Typography, Progress, Modal, Input, Radio, Space, List, Avatar, Spin } from 'antd';
import { InboxOutlined, FileOutlined, BellOutlined, HeartOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps, TabsProps } from 'antd';
import { useAppSelector } from '@/store';
import Tip from '../../SoundScapeStreamComp/Tab/Tip';
import { useNotification } from '@/Components/custom/custom-notification';
import styles from './styles.module.css';
import { supabase } from '@/config/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const { Dragger } = Upload;
const { Title, Text } = Typography;

interface OpenCollabStreamComponentsProps {
    roomId: string;
    hostId: string;
    isHost: boolean;
    participants?: any[];
}

interface SharedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
    downloadCount: number;
}

interface Poll {
    id: string;
    question: string;
    options: string[];
    votes: { [key: string]: number };
    createdBy: string;
    createdAt: string;
    isActive: boolean;
}

interface PollVote {
    pollId: string;
    optionIndex: number;
}

const OpenCollabStreamComponents: React.FC<OpenCollabStreamComponentsProps> = ({
    roomId,
    hostId,
    isHost,
    participants = []
}) => {
    const profile = useAppSelector((state) => state.auth);
    const { liveStreamId } = useAppSelector((state) => state.liveStream);
    const { notify } = useNotification();

    // File sharing state
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [loadingFiles, setLoadingFiles] = useState(true);

    // Polling state
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loadingPolls, setLoadingPolls] = useState(true);
    const [showCreatePoll, setShowCreatePoll] = useState(false);
    const [newPollQuestion, setNewPollQuestion] = useState('');
    const [newPollOptions, setNewPollOptions] = useState(['', '']);
    const [userVotes, setUserVotes] = useState<{ [pollId: string]: number }>({});

    // Tipping state
    const [showTipModal, setShowTipModal] = useState(false);
    const [tipAmount, setTipAmount] = useState(5);

    // Load shared files on mount
    useEffect(() => {
        loadSharedFiles();
    }, [roomId]);

    // Load polls on mount
    useEffect(() => {
        loadPolls();
        loadUserVotes();
    }, [roomId, profile.profileId]);

    // Setup real-time subscriptions
    useEffect(() => {
        // Subscribe to new files
        const filesSubscription = supabase
            .channel(`room_${roomId}_files`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'shared_files',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    const newFile: SharedFile = {
                        id: payload.new.id,
                        name: payload.new.file_name,
                        size: payload.new.file_size,
                        type: payload.new.file_type,
                        url: payload.new.file_url,
                        uploadedBy: payload.new.uploaded_by,
                        uploadedAt: payload.new.uploaded_at,
                        downloadCount: payload.new.download_count
                    };
                    setSharedFiles(prev => [...prev, newFile]);
                }
            )
            .subscribe();

        // Subscribe to new polls
        const pollsSubscription = supabase
            .channel(`room_${roomId}_polls`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'polls',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    const newPoll: Poll = {
                        id: payload.new.id,
                        question: payload.new.question,
                        options: payload.new.options,
                        votes: payload.new.votes || {},
                        createdBy: payload.new.created_by,
                        createdAt: payload.new.created_at,
                        isActive: payload.new.is_active
                    };
                    setPolls(prev => [...prev, newPoll]);
                }
            )
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'polls',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    setPolls(prev => prev.map(poll =>
                        poll.id === payload.new.id
                            ? {
                                ...poll,
                                votes: payload.new.votes || {},
                                isActive: payload.new.is_active
                            }
                            : poll
                    ));
                }
            )
            .subscribe();

        // Subscribe to poll votes
        const votesSubscription = supabase
            .channel(`room_${roomId}_votes`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'poll_votes'
                },
                async (payload) => {
                    // Reload poll to get updated vote counts
                    const { data } = await supabase
                        .from('polls')
                        .select('*')
                        .eq('id', payload.new.poll_id)
                        .single();

                    if (data) {
                        // Aggregate votes
                        const { data: votes } = await supabase
                            .from('poll_votes')
                            .select('option_index')
                            .eq('poll_id', data.id);

                        const voteCount: { [key: string]: number } = {};
                        votes?.forEach(vote => {
                            voteCount[vote.option_index] = (voteCount[vote.option_index] || 0) + 1;
                        });

                        setPolls(prev => prev.map(poll =>
                            poll.id === data.id
                                ? { ...poll, votes: voteCount }
                                : poll
                        ));
                    }
                }
            )
            .subscribe();

        return () => {
            filesSubscription.unsubscribe();
            pollsSubscription.unsubscribe();
            votesSubscription.unsubscribe();
        };
    }, [roomId]);

    const loadSharedFiles = async () => {
        try {
            setLoadingFiles(true);
            const { data, error } = await supabase
                .from('shared_files')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const files: SharedFile[] = data.map(record => ({
                    id: record.id,
                    name: record.file_name,
                    size: record.file_size,
                    type: record.file_type,
                    url: record.file_url,
                    uploadedBy: record.uploaded_by,
                    uploadedAt: record.uploaded_at,
                    downloadCount: record.download_count
                }));
                setSharedFiles(files);
            }
        } catch (error) {
            console.error('Error loading files:', error);
            notify({ type: 'error', message: 'Failed to load shared files' });
        } finally {
            setLoadingFiles(false);
        }
    };

    const loadPolls = async () => {
        try {
            setLoadingPolls(true);
            const { data, error } = await supabase
                .from('polls')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // For each poll, get vote counts
                const pollsWithVotes = await Promise.all(
                    data.map(async (poll) => {
                        const { data: votes } = await supabase
                            .from('poll_votes')
                            .select('option_index')
                            .eq('poll_id', poll.id);

                        const voteCount: { [key: string]: number } = {};
                        votes?.forEach(vote => {
                            voteCount[vote.option_index] = (voteCount[vote.option_index] || 0) + 1;
                        });

                        return {
                            id: poll.id,
                            question: poll.question,
                            options: poll.options,
                            votes: voteCount,
                            createdBy: poll.created_by,
                            createdAt: poll.created_at,
                            isActive: poll.is_active
                        };
                    })
                );

                setPolls(pollsWithVotes);
            }
        } catch (error) {
            console.error('Error loading polls:', error);
            notify({ type: 'error', message: 'Failed to load polls' });
        } finally {
            setLoadingPolls(false);
        }
    };

    const loadUserVotes = async () => {
        try {
            const { data, error } = await supabase
                .from('poll_votes')
                .select('poll_id, option_index')
                .eq('user_id', profile.profileId);

            if (error) throw error;

            if (data) {
                const votes: { [pollId: string]: number } = {};
                data.forEach(vote => {
                    votes[vote.poll_id] = vote.option_index;
                });
                setUserVotes(votes);
            }
        } catch (error) {
            console.error('Error loading user votes:', error);
        }
    };

    // File upload configuration
    const uploadProps: UploadProps = {
        name: 'file',
        multiple: true,
        maxCount: 10,
        beforeUpload: (file) => {
            const isValidSize = file.size / 1024 / 1024 < 50; // 50MB limit
            if (!isValidSize) {
                notify({ type: 'error', message: 'File must be smaller than 50MB!' });
                return false;
            }
            return true;
        },
        customRequest: async (options) => {
            const { file, onProgress, onSuccess, onError } = options;
            const uploadFile = file as File;

            try {
                // Upload to Supabase Storage in 'shared-files' folder
                const fileName = `${Date.now()}_${uploadFile.name}`;
                const filePath = `shared-files/${roomId}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('collab-room')
                    .upload(filePath, uploadFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                // Simulate progress
                onProgress?.({ percent: 100 });

                // Construct public URL
                const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collab-room/${filePath}`;

                // Save metadata to database
                const { data: fileRecord, error: dbError } = await supabase
                    .from('shared_files')
                    .insert({
                        room_id: roomId,
                        file_name: uploadFile.name,
                        file_size: uploadFile.size,
                        file_type: uploadFile.type || 'unknown',
                        file_url: fileUrl,
                        uploaded_by: profile.profileId
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;

                onSuccess?.(fileRecord);
                notify({ type: "success", message: `${uploadFile.name} uploaded successfully` });

            } catch (error) {
                console.error('Upload error:', error);
                onError?.(error as Error);
                notify({ type: 'error', message: 'Upload failed. Please try again.' });
            }
        }
    };

    // Poll functions
    const createPoll = async () => {
        if (!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())) {
            notify({ type: 'error', message: 'Please fill in all fields' });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('polls')
                .insert({
                    room_id: roomId,
                    question: newPollQuestion,
                    options: newPollOptions.filter(opt => opt.trim()),
                    created_by: profile.profileId,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            setShowCreatePoll(false);
            setNewPollQuestion('');
            setNewPollOptions(['', '']);
            notify({ type: 'success', message: 'Poll created successfully' });

        } catch (error) {
            console.error('Error creating poll:', error);
            notify({ type: 'error', message: 'Failed to create poll' });
        }
    };

    const votePoll = async (pollId: string, optionIndex: number) => {
        // Check if user already voted
        if (userVotes[pollId] !== undefined) {
            notify({ type: 'warning', message: 'You have already voted on this poll' });
            return;
        }

        try {
            const { error } = await supabase
                .from('poll_votes')
                .insert({
                    poll_id: pollId,
                    user_id: profile.profileId,
                    option_index: optionIndex
                });

            if (error) {
                // Check if it's a unique constraint error
                if (error.code === '23505') {
                    notify({ type: 'warning', message: 'You have already voted on this poll' });
                } else {
                    throw error;
                }
                return;
            }

            // Update local state
            setUserVotes(prev => ({ ...prev, [pollId]: optionIndex }));
            notify({ type: 'success', message: 'Vote recorded successfully' });

        } catch (error) {
            console.error('Error voting:', error);
            notify({ type: 'error', message: 'Failed to record vote' });
        }
    };

    const closePoll = async (pollId: string) => {
        try {
            const { error } = await supabase
                .from('polls')
                .update({ is_active: false })
                .eq('id', pollId);

            if (error) throw error;

            notify({ type: 'success', message: 'Poll closed successfully' });

        } catch (error) {
            console.error('Error closing poll:', error);
            notify({ type: 'error', message: 'Failed to close poll' });
        }
    };

    // Tipping functions
    const handleTipSuccess = (paymentIntentId: string, amount: number, status: any) => {
        setShowTipModal(false);
        notify({
            type: 'success',
            message: `Successfully tipped $${amount} to the host!`
        });
    };

    const handleTipCancel = () => {
        setShowTipModal(false);
    };

    const downloadFile = async (file: SharedFile) => {
        try {
            // Fetch the file as a blob
            const response = await fetch(file.url);
            if (!response.ok) throw new Error('Failed to fetch file');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link for download
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name || 'download';
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);

            // Update download count in database
            const { error } = await supabase
                .from('shared_files')
                .update({ download_count: file.downloadCount + 1 })
                .eq('id', file.id);

            if (!error) {
                setSharedFiles(prev =>
                    prev.map(f =>
                        f.id === file.id ? { ...f, downloadCount: f.downloadCount + 1 } : f
                    )
                );
            }
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const deleteFile = async (file: SharedFile) => {
        try {
            // Extract file path from URL
            const urlParts = file.url.split('/collab-room/');
            const filePath = urlParts[1];

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('collab-room')
                .remove([filePath]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await supabase
                .from('shared_files')
                .delete()
                .eq('id', file.id);

            if (dbError) throw dbError;

            setSharedFiles(prev => prev.filter(f => f.id !== file.id));
            notify({ type: 'success', message: 'File deleted successfully' });

        } catch (error) {
            console.error('Delete error:', error);
            notify({ type: 'error', message: 'Failed to delete file' });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const tabItems: TabsProps['items'] = [
        {
            key: 'files',
            label: (
                <span>
                    <FileOutlined />
                    File Share
                </span>
            ),
            children: (
                <div className={styles.tabContent}>
                    <Title level={4}>📁 File Sharing Hub</Title>
                    <Text type="secondary">Share files for real-time demos, mentorship, and collaboration</Text>

                    <Card style={{ margin: '16px 0' }}>
                        <Dragger {...uploadProps} className={styles.uploadArea}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Click or drag files to upload</p>
                            <p className="ant-upload-hint">
                                Support for documents, images, videos, and more. Max 50MB per file.
                            </p>
                        </Dragger>
                    </Card>

                    {loadingFiles ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin size="large" />
                        </div>
                    ) : sharedFiles.length > 0 ? (
                        <Card title="Shared Files" style={{ margin: '16px 0', maxWidth: "300px", overflow: "auto" }}>
                            <List
                                dataSource={sharedFiles}
                                renderItem={(file) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                icon={<DownloadOutlined />}
                                                onClick={() => downloadFile(file)}
                                                size="small"
                                            >
                                                Download ({file.downloadCount})
                                            </Button>,
                                            (isHost || file.uploadedBy === profile.profileId) && (
                                                <Button
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    size="small"
                                                    onClick={() => deleteFile(file)}
                                                >
                                                    Delete
                                                </Button>
                                            )
                                        ].filter(Boolean)}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<FileOutlined />} />}
                                            title={file.name}
                                            description={`${formatFileSize(file.size)} • Uploaded ${new Date(file.uploadedAt).toLocaleString()}`}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    ) : (
                        <Card>
                            <div style={{ textAlign: 'center', }}>
                                <FileOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                                <Title level={4} type="secondary">No files shared yet</Title>
                                <Text type="secondary">Upload files to share with participants</Text>
                            </div>
                        </Card>
                    )}
                </div>
            )
        },
        {
            key: 'polls',
            label: (
                <span>
                    <BellOutlined />
                    Polls
                </span>
            ),
            children: (
                <div className={styles.tabContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <Title level={4}>📊 Live Polls</Title>
                            <Text type="secondary">Create and participate in real-time polls</Text>
                        </div>
                        {isHost && (
                            <Button type="primary" onClick={() => setShowCreatePoll(true)}>
                                Create Poll
                            </Button>
                        )}
                    </div>

                    {loadingPolls ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin size="large" />
                        </div>
                    ) : polls.length === 0 ? (
                        <Card>
                            <div style={{ textAlign: 'center' }}>
                                <BellOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                                <Title level={4} type="secondary">No polls yet</Title>
                                <Text type="secondary">
                                    {isHost ? 'Create your first poll to engage with participants' : 'Wait for the host to create a poll'}
                                </Text>
                            </div>
                        </Card>
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            {polls.map((poll) => {
                                const hasVoted = userVotes[poll.id] !== undefined;
                                const totalVotes = Object.values(poll.votes).reduce((sum, count) => sum + count, 0);

                                return (
                                    <Card
                                        key={poll.id}
                                        title={poll.question}
                                        extra={
                                            isHost && poll.isActive && (
                                                <Button size="small" onClick={() => closePoll(poll.id)}>
                                                    Close Poll
                                                </Button>
                                            )
                                        }
                                    >
                                        {!poll.isActive && (
                                            <Text type="warning" style={{ display: 'block', marginBottom: '8px' }}>
                                                This poll is closed
                                            </Text>
                                        )}
                                        <Radio.Group
                                            style={{ width: '100%' }}
                                            value={userVotes[poll.id]}
                                            disabled={hasVoted || !poll.isActive}
                                        >
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                {poll.options.map((option, index) => {
                                                    const voteCount = poll.votes[index] || 0;
                                                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                                                    return (
                                                        <div key={index} style={{ width: '100%' }}>
                                                            <Radio
                                                                value={index}
                                                                onClick={() => !hasVoted && poll.isActive && votePoll(poll.id, index)}
                                                                style={{ width: '100%' }}
                                                            >
                                                                {option}
                                                            </Radio>
                                                            <Progress
                                                                percent={Math.round(percentage)}
                                                                size="small"
                                                                format={() => `${voteCount} vote${voteCount !== 1 ? 's' : ''}`}
                                                                style={{ marginTop: '4px' }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </Space>
                                        </Radio.Group>
                                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                            <Text type="secondary">
                                                Created {new Date(poll.createdAt).toLocaleString()}
                                            </Text>
                                            <Text type="secondary">
                                                Total votes: {totalVotes}
                                            </Text>
                                        </div>
                                        {hasVoted && (
                                            <Text type="success" style={{ display: 'block', marginTop: '8px' }}>
                                                ✓ You voted for: {poll.options[userVotes[poll.id]]}
                                            </Text>
                                        )}
                                    </Card>
                                );
                            })}
                        </Space>
                    )}

                    <Modal
                        title="Create New Poll"
                        open={showCreatePoll}
                        onOk={createPoll}
                        onCancel={() => setShowCreatePoll(false)}
                        okText="Create Poll"
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div>
                                <Text strong>Poll Question:</Text>
                                <Input
                                    placeholder="Enter your poll question"
                                    value={newPollQuestion}
                                    onChange={(e) => setNewPollQuestion(e.target.value)}
                                    style={{ marginTop: '8px' }}
                                />
                            </div>
                            <div>
                                <Text strong>Options:</Text>
                                {newPollOptions.map((option, index) => (
                                    <Input
                                        key={index}
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => {
                                            const newOptions = [...newPollOptions];
                                            newOptions[index] = e.target.value;
                                            setNewPollOptions(newOptions);
                                        }}
                                        style={{ marginTop: '8px' }}
                                    />
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => setNewPollOptions([...newPollOptions, ''])}
                                    style={{ marginTop: '8px', width: '100%' }}
                                    disabled={newPollOptions.length >= 6}
                                >
                                    Add Option
                                </Button>
                            </div>
                        </Space>
                    </Modal>
                </div>
            )
        },
        {
            key: 'support',
            label: (
                <span>
                    <HeartOutlined />
                    Support
                </span>
            ),
            children: (
                <div className={styles.tabContent}>
                    <Title level={4}>💝 Support the Host</Title>
                    <Text type="secondary">Show your appreciation with tips and donations</Text>

                    <Card style={{ margin: '16px 0', textAlign: 'center' }}>
                        <HeartOutlined style={{ fontSize: '48px', color: '#ffb300', marginBottom: '16px' }} />
                        <Title level={4}>Support This Open Collab</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                            Help support the host's efforts in creating this collaborative space
                        </Text>
                        <Button
                            type="primary"
                            size="large"
                            icon={<HeartOutlined />}
                            onClick={() => setShowTipModal(true)}
                            disabled={profile.profileId === hostId}
                        >
                            {profile.profileId === hostId ? 'You are the host' : 'Tip Host'}
                        </Button>
                    </Card>

                    <Modal
                        title="Support the Host"
                        open={showTipModal}
                        onCancel={handleTipCancel}
                        footer={null}
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
                                streamId={liveStreamId || ''}
                                userId={profile.profileId!}
                                onSuccess={handleTipSuccess}
                                onCancel={handleTipCancel}
                                title="Tip Host"
                            />
                        </Elements>
                    </Modal>
                </div>
            )
        }
    ];

    return (
        <div className={styles.openCollabContainer}>
            <div className={styles.header}>
                <Title level={3}>🚀 Open Collab — Visionary Freeform Space</Title>
                <Text type="secondary">
                    A collaborative environment for file sharing, polling, and community support
                </Text>
            </div>

            <Tabs
                defaultActiveKey="files"
                items={tabItems}
                className={styles.collabTabs}
                size="large"
            />
        </div>
    );
};

export default OpenCollabStreamComponents;