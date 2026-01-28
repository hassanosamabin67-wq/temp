import React, { useState, useEffect, useRef } from 'react'
import styles from './styles.module.css'
import { Button, Input, Tabs, TabsProps, Upload, Modal, Select, Spin, Popconfirm, Form, Typography } from 'antd';
import { supabase } from '@/config/supabase';
import { IoMdDownload, IoMdTrash, IoMdAdd, IoMdLink, IoMdHeart } from "react-icons/io";
import { MdMusicNote, MdLoop, MdGraphicEq, MdMusicOff } from "react-icons/md";
import { FaBandcamp, FaSpotify } from "react-icons/fa";
import LyricChords from '../LyricChords';
import { uploadAudioFile, getAudioFiles, deleteAudioFile, downloadAudioFile, AudioFileMetadata } from '@/utils/supabase-audio-upload';
import { useNotification } from '@/Components/custom/custom-notification';
import { DAWEmbed, DAW_PLATFORMS, validateDAWUrl, getPlatformInfo } from '@/utils/daw-embed-utils';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import DonationForm from './DonationForm';
import Tip from './Tip';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const { Option } = Select;
const { Text } = Typography;

interface TabProps {
    participants: Array<any>;
    liveStreamId: string;
    host: any;
    profile: any;
    roomId: string;
}

const Tab: React.FC<TabProps> = ({ participants, liveStreamId, host, profile, roomId }) => {
    const [message, setMessage] = useState('');
    const [audioFiles, setAudioFiles] = useState<AudioFileMetadata[]>([]);
    const [dawEmbeds, setDawEmbeds] = useState<DAWEmbed[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [embedModalVisible, setEmbedModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'stem' | 'loop' | 'mix'>('stem');
    const [fileDescription, setFileDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [embedLoading, setEmbedLoading] = useState(false);
    const [embedForm] = Form.useForm();
    const stream = liveStreamId;
    const { notify } = useNotification();
    const isHost = host.id === profile.profileId;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessageCountRef = useRef(0);
    const [donationModalVisible, setDonationModalVisible] = useState(false);
    const [donationAmount, setDonationAmount] = useState<number>(5);
    const [donationLoading, setDonationLoading] = useState(false);
    const [donations, setDonations] = useState<any[]>([]);
    const [donationStats, setDonationStats] = useState({ total: 0, count: 0 });
    const [tipModalVisible, setTipModalVisible] = useState(false);
    const [tipAmount, setTipAmount] = useState<number>(5);

    useEffect(() => {
        fetchAudioFiles();
        fetchDAWEmbeds();
        if (host?.id) {
            console.log('Host ID available, fetching donations:', host.id);
            fetchDonations();
        } else {
            console.log('Host ID not available yet:', host);
        }
    }, [roomId, host?.id]);

    useEffect(() => {
        if (!host?.id) {
            return;
        }

        const channel = supabase
            .channel(`donations-${roomId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `type=eq.Stream Donation AND user_id=eq.${host.id}` },
                (payload) => {
                    console.log('Donations subscription event:', payload);
                    if (payload.eventType === 'INSERT') {
                        setDonations(prev => [payload.new, ...prev.slice(0, 9)]);
                        setDonationStats(prev => ({
                            total: prev.total + payload.new.amount,
                            count: prev.count + 1
                        }));
                    }
                }
            )
            .subscribe((status) => {
                console.log('Donations subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, host.id]);

    useEffect(() => {
        const channel = supabase
            .channel(`audio-files-${roomId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'soundscape_audio_files', filter: `room_id=eq.${roomId}` },
                (payload) => {
                    console.log('Audio files subscription event:', payload);
                    if (payload.eventType === 'INSERT') {
                        setAudioFiles(prev => [payload.new as AudioFileMetadata, ...prev]);
                    } else if (payload.eventType === 'DELETE') {
                        console.log('Deleting audio file with ID:', payload.old.id);
                        setAudioFiles(prev => prev.filter(file => file.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status) => {
                console.log('Audio files subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    useEffect(() => {
        const channel = supabase
            .channel(`daw-embeds-${roomId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'soundscape_daw_embeds', filter: `room_id=eq.${roomId}` },
                (payload) => {
                    console.log('DAW embeds subscription event:', payload);
                    if (payload.eventType === 'INSERT') {
                        setDawEmbeds(prev => [payload.new as DAWEmbed, ...prev]);
                    } else if (payload.eventType === 'DELETE') {
                        console.log('Deleting DAW embed with ID:', payload.old.id);
                        setDawEmbeds(prev => prev.filter(embed => embed.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status) => {
                console.log('DAW embeds subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    const fetchAudioFiles = async () => {
        try {
            setLoading(true);
            const files = await getAudioFiles(roomId);
            setAudioFiles(files);
        } catch (error: any) {
            notify({ type: 'error', message: 'Failed to load audio files' });
            console.error('Error fetching audio files:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDAWEmbeds = async () => {
        try {
            setEmbedLoading(true);
            const { data, error } = await supabase
                .from('soundscape_daw_embeds')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching DAW embeds:', error);
                return;
            }

            console.log('Fetched DAW embeds:', data);
            setDawEmbeds(data || []);
        } catch (error: any) {
            notify({ type: 'error', message: 'Failed to load DAW embeds' });
            console.error('Error fetching DAW embeds:', error);
        } finally {
            setEmbedLoading(false);
        }
    };

    const fetchDonations = async () => {
        try {
            if (!host?.id) {
                console.log('Host ID not available, skipping donation fetch');
                return;
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'Stream Donation')
                .eq('user_id', host.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching donations:', error);
                return;
            }

            setDonations(data || []);

            const total = data?.reduce((sum, donation) => sum + donation.amount, 0) || 0;
            setDonationStats({ total, count: data?.length || 0 });
        } catch (error) {
            console.error('Error fetching donations:', error);
        }
    };

    const handleEmbedSubmit = async (values: any) => {
        try {
            setEmbedLoading(true);

            const { data, error } = await supabase
                .from('soundscape_daw_embeds')
                .insert([{
                    room_id: roomId,
                    platform: values.platform,
                    embed_url: values.embedUrl,
                    title: values.title,
                    description: values.description,
                    added_by: profile.profileId
                }]);

            if (error) {
                throw error;
            }

            notify({ type: 'success', message: 'DAW project embedded successfully!' });
            setEmbedModalVisible(false);
            embedForm.resetFields();
        } catch (error: any) {
            notify({ type: 'error', message: error.message || 'Failed to embed project' });
        } finally {
            setEmbedLoading(false);
        }
    };

    const handleEmbedDelete = async (embedId: string) => {
        try {
            console.log('Deleting DAW embed:', embedId);
            const { error } = await supabase
                .from('soundscape_daw_embeds')
                .delete()
                .eq('id', embedId);

            if (error) {
                console.error('Error deleting DAW embed:', error);
                throw error;
            }

            console.log('DAW embed deleted successfully');
            // Manually update state as fallback in case subscription doesn't work
            // Add small delay to prevent conflicts with real-time subscription
            setTimeout(() => {
                setDawEmbeds(prev => prev.filter(embed => embed.id !== embedId));
            }, 100);
            notify({ type: 'success', message: 'Embed removed successfully!' });
        } catch (error: any) {
            console.error('Error in handleEmbedDelete:', error);
            notify({ type: 'error', message: 'Failed to remove embed' });
        }
    };

    const getPlatformIcon = (platform: string) => {
        const platformInfo = getPlatformInfo(platform);
        if (!platformInfo) return <MdMusicOff />;

        switch (platform) {
            case 'bandlab':
                return <FaBandcamp style={{ color: platformInfo.color }} />;
            case 'soundtrap':
                return <FaSpotify style={{ color: platformInfo.color }} />;
            case 'soundation':
                return <MdMusicNote style={{ color: platformInfo.color }} />;
            default:
                return <MdMusicOff />;
        }
    };

    const getPlatformName = (platform: string) => {
        const platformInfo = getPlatformInfo(platform);
        return platformInfo ? platformInfo.name : 'Unknown';
    };

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;

        const newMessage = {
            room_id: roomId,
            profileImg: profile.profileImage,
            user_id: profile.profileId,
            host: host?.id,
            message: messageText,
            user_name: profile.firstName + ' ' + profile.lastName,
        };

        const { error } = await supabase
            .from('stream_messages')
            .insert([newMessage])
            .eq('room_id', roomId);

        if (error) {
            console.error('Message send failed:', error);
            return;
        } else {
            setMessage('');
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            notify({ type: 'error', message: 'Please select a file' });
            return;
        }

        try {
            setUploading(true);
            await uploadAudioFile(
                selectedFile,
                roomId,
                fileType,
                profile.profileId!,
                fileDescription
            );

            notify({ type: 'success', message: 'File uploaded successfully!' });
            setUploadModalVisible(false);
            setSelectedFile(null);
            setFileType('stem');
            setFileDescription('');
        } catch (error: any) {
            notify({ type: 'error', message: error.message || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleFileDelete = async (fileId: string, filePath: string) => {
        try {
            console.log('Deleting audio file:', { fileId, filePath });
            const result = await deleteAudioFile(fileId, filePath);
            console.log('Delete result:', result);
            if (result) {
                // Manually update state as fallback in case subscription doesn't work
                // Add small delay to prevent conflicts with real-time subscription
                setTimeout(() => {
                    setAudioFiles(prev => prev.filter(file => file.id !== fileId));
                }, 100);
                notify({ type: 'success', message: 'File deleted successfully!' });
            } else {
                notify({ type: 'error', message: 'Failed to delete file' });
            }
        } catch (error: any) {
            console.error('Error in handleFileDelete:', error);
            notify({ type: 'error', message: 'Failed to delete file' });
        }
    };

    const handleFileDownload = async (filePath: string, fileName: string) => {
        try {
            await downloadAudioFile(filePath, fileName);
            notify({ type: 'success', message: 'Download started!' });
        } catch (error: any) {
            notify({ type: 'error', message: 'Failed to download file' });
        }
    };

    const getFileTypeIcon = (type: string) => {
        switch (type) {
            case 'stem':
                return <MdMusicNote />;
            case 'loop':
                return <MdLoop />;
            case 'mix':
                return <MdGraphicEq />;
            default:
                return <MdMusicNote />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDonationSuccess = async (paymentIntentId: string, amount: number, paymentIntentStatus: any) => {
        try {
            const { error } = await supabase.from('transactions').insert({
                stripe_transaction_id: paymentIntentId,
                amount: amount,
                user_id: host.id,
                client_id: profile.profileId,
                type: "Stream Donation",
                status: paymentIntentStatus,
                purchase_name: `Donation to ${host.displayName}'s Live Stream`
            });

            if (error) {
                console.error('Error recording donation:', error);
                return;
            }

            const donationMessage = `🎉 ${profile.firstName} donated $${amount}!`;
            await sendMessage(donationMessage);
            await fetchDonations();

            notify({ type: 'success', message: `Thank you for your $${amount} donation!` });
            setDonationModalVisible(false);
        } catch (error) {
            console.error('Error handling donation success:', error);
        }
    };

    const handleTipSuccess = async (paymentIntentId: string, amount: number, paymentIntentStatus: any) => {
        try {
            const { error } = await supabase.from('transactions').insert({
                stripe_transaction_id: paymentIntentId,
                amount: amount,
                user_id: host.id,
                client_id: profile.profileId,
                type: "Stream Tip",
                status: paymentIntentStatus,
                purchase_name: `Tip given during ${host.displayName}'s live stream`
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

    const AudioUploads = (
        <div className={styles.audioUploadsContainer}>
            <div className={styles.audioUploadsHeader}>
                <h3>Audio Files</h3>
                {isHost && <Button
                    type="primary"
                    icon={<IoMdAdd />}
                    onClick={() => setUploadModalVisible(true)}
                >
                    Upload Audio
                </Button>
                }
            </div>

            <div className={styles.audioUploadsDiv}>
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                        <p>Loading audio files...</p>
                    </div>
                ) : audioFiles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <MdMusicNote size={48} />
                        <p>No audio files uploaded yet</p>
                        <span>Upload stems, loops, or mixes to get started</span>
                    </div>
                ) : (
                    audioFiles.map((file) => {
                        const truncatedDescription = file?.description &&
                            file?.description?.length > 100
                            ? file.description.slice(0, 100) + '......'
                            : file?.description;
                        return (
                            <div key={file.id} className={styles.audioUpload}>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileTypeIcon}>
                                        {getFileTypeIcon(file.file_type)}
                                    </div>
                                    <div className={styles.fileDetails}>
                                        <span className={styles.fileName}>{file.file_name}</span>
                                        <span className={styles.fileMeta}>
                                            {file.file_type.toUpperCase()} • {formatFileSize(file.file_size)}
                                        </span>
                                        {file.description && (
                                            <span className={styles.fileDescription}>{truncatedDescription}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.fileActions}>
                                    <Button
                                        type="text"
                                        icon={<IoMdDownload />}
                                        onClick={() => handleFileDownload(file.file_path, file.file_name)}
                                        title="Download"
                                    />
                                    {(profile.profileId === host.id || file.uploaded_by === profile.profileId) && (
                                        <Popconfirm
                                            title="Delete this file?"
                                            description="This action cannot be undone."
                                            onConfirm={() => handleFileDelete(file.id!, file.file_path)}
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <Button
                                                type="text"
                                                danger
                                                icon={<IoMdTrash />}
                                                title="Delete"
                                            />
                                        </Popconfirm>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <Modal
                title="Upload Audio File"
                open={uploadModalVisible}
                onOk={handleFileUpload}
                onCancel={() => {
                    setUploadModalVisible(false);
                    setSelectedFile(null);
                    setFileType('stem');
                    setFileDescription('');
                }}
                confirmLoading={uploading}
                okText="Upload"
                cancelText="Cancel"
            >
                <div className={styles.uploadForm}>
                    <div className={styles.uploadField}>
                        <label>File Type:</label>
                        <Select
                            value={fileType}
                            onChange={setFileType}
                            style={{ width: '100%' }}
                        >
                            <Option value="stem">Stem</Option>
                            <Option value="loop">Loop</Option>
                            <Option value="mix">Mix</Option>
                        </Select>
                    </div>

                    <div className={styles.uploadField}>
                        <label>Audio File:</label>
                        <Upload
                            beforeUpload={(file) => {
                                setSelectedFile(file);
                                return false;
                            }}
                            accept="audio/*"
                            maxCount={1}
                            showUploadList={true}
                        >
                            <Button icon={<IoMdAdd />}>Select Audio File</Button>
                        </Upload>
                    </div>

                    <div className={styles.uploadField}>
                        <label>Description (Optional):</label>
                        <Input.TextArea
                            value={fileDescription}
                            onChange={(e) => setFileDescription(e.target.value)}
                            placeholder="Describe your audio file..."
                            rows={3}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );

    const DAWEmbeds = (
        <div className={styles.audioUploadsContainer}>
            <div className={styles.audioUploadsHeaderDaw}>
                <div>
                    <span style={{ display: "block", fontSize: "14px" }}>DAW Projects</span>
                    <p style={{ fontSize: '12px', marginTop: '4px', color: "white" }}>Embed projects from BandLab, Soundtrap, or Soundation</p>
                </div>
                {isHost && <Button
                    type="primary"
                    icon={<IoMdLink />}
                    onClick={() => setEmbedModalVisible(true)}
                >
                    Add DAW Project
                </Button>}
            </div>

            <div className={styles.audioUploadsDiv}>
                {embedLoading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                        <p>Loading DAW projects...</p>
                    </div>
                ) : dawEmbeds.length === 0 ? (
                    <div className={styles.emptyState}>
                        <MdMusicNote size={48} />
                        <p>No DAW projects embedded yet</p>
                        <span>Add projects from BandLab, Soundtrap, or Soundation to collaborate</span>
                    </div>
                ) : (
                    dawEmbeds.map((embed) => {
                        const truncatedDescription = embed?.description &&
                            embed?.description?.length > 100
                            ? embed.description.slice(0, 100) + '......'
                            : embed?.description;
                        return (
                            <div key={embed.id} className={styles.audioUpload}>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileTypeIcon}>
                                        {getPlatformIcon(embed.platform)}
                                    </div>
                                    <div className={styles.fileDetails}>
                                        <span className={styles.fileName}>{embed.title}</span>
                                        <span className={styles.fileMeta}>
                                            {getPlatformName(embed.platform)} • {new Date(embed.created_at).toLocaleDateString()}
                                        </span>
                                        {embed.description && (
                                            <span className={styles.fileDescription}>{truncatedDescription}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.fileActions}>
                                    <Button
                                        type="text"
                                        icon={<IoMdLink />}
                                        onClick={() => {
                                            console.log('Opening URL:', embed.embed_url);
                                            window.open(embed.embed_url, '_blank');
                                        }}
                                        title="Open Project"
                                    />
                                    {(profile.profileId === host.id || embed.added_by === profile.profileId) && (
                                        <Popconfirm
                                            title="Remove this project?"
                                            description="This will remove the embed from the session."
                                            onConfirm={() => handleEmbedDelete(embed.id)}
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <Button
                                                type="text"
                                                danger
                                                icon={<IoMdTrash />}
                                                title="Remove"
                                            />
                                        </Popconfirm>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <Modal
                title="Add DAW Project"
                open={embedModalVisible}
                onOk={() => embedForm.submit()}
                onCancel={() => {
                    setEmbedModalVisible(false);
                    embedForm.resetFields();
                }}
                confirmLoading={embedLoading}
                okText="Add Project"
                cancelText="Cancel"
            >
                <Form
                    form={embedForm}
                    layout="vertical"
                    onFinish={handleEmbedSubmit}
                >
                    <Form.Item
                        name="platform"
                        label="Platform"
                        rules={[{ required: true, message: 'Please select a platform' }]}
                    >
                        <Select placeholder="Select a DAW platform">
                            {Object.entries(DAW_PLATFORMS).map(([key, platform]) => (
                                <Option key={key} value={key}>
                                    {platform.icon} {platform.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="title"
                        label="Project Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="Enter project title" />
                    </Form.Item>

                    <Form.Item
                        name="embedUrl"
                        label="Project URL"
                        rules={[
                            { required: true, message: 'Please enter the project URL' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || validateDAWUrl(value, getFieldValue('platform'))) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Please enter a valid URL for the selected platform'));
                                },
                            }),
                        ]}
                    >
                        <Input placeholder="https://..." />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description (Optional)"
                    >
                        <Input.TextArea
                            placeholder="Describe this project..."
                            rows={3}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );

    const Donations = (
        <div className={styles.donationsContainer}>
            <div className={styles.donationsHeader}>
                <h3>Support the Stream</h3>
                <div className={styles.donationStats}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>${(donationStats.total / 100).toFixed(2)}</span>
                        <span className={styles.statLabel}>Total Raised</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{donationStats.count}</span>
                        <span className={styles.statLabel}>Donations</span>
                    </div>
                </div>
            </div>

            <div className={styles.donationActions}>
                <Button
                    type="primary"
                    size="large"
                    icon={<IoMdHeart />}
                    onClick={() => setDonationModalVisible(true)}
                    className={styles.donateButton}
                >
                    Send Donation
                </Button>
            </div>

            {donations.length > 0 && (
                <div className={styles.recentDonations}>
                    <h4>Recent Donations</h4>
                    <div className={styles.donationsList}>
                        {donations.slice(0, 5).map((donation) => (
                            <div key={donation.id} className={styles.donationItem}>
                                <div className={styles.donationInfo}>
                                    <span className={styles.donationAmount}>
                                        ${(donation.amount / 100).toFixed(2)}
                                    </span>
                                    <span className={styles.donationDate}>
                                        {new Date(donation.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                        hostId={host.id}
                        streamId={liveStreamId}
                        userId={profile.profileId}
                        onSuccess={handleDonationSuccess}
                        onCancel={() => setDonationModalVisible(false)}
                        title="Support the Stream"
                    />
                </Elements>
            </Modal>
        </div>
    );

    const TipTab = (
        <div className={styles.donationsContainer}>
            <div className={styles.donationsHeader}>
                <h3>Send a Tip</h3>
                <div className={styles.donationActions}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<IoMdHeart />}
                        onClick={() => setTipModalVisible(true)}
                        className={styles.donateButton}
                    >
                        Tip the Host
                    </Button>
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
                        hostId={host.id}
                        streamId={liveStreamId}
                        userId={profile.profileId}
                        onSuccess={handleTipSuccess}
                        onCancel={() => setTipModalVisible(false)}
                        title="Send a Tip to the Host"
                    />
                </Elements>
            </Modal>
        </div>
    );

    const items: TabsProps['items'] = [
        { key: '1', label: <span style={{ color: "white" }}>Audio Files</span>, children: AudioUploads },
        { key: '3', label: <span style={{ color: "white" }}>Lyrics</span>, children: <LyricChords roomId={roomId} participants={participants} profile={profile} host={host} liveStreamId={liveStreamId} /> },
        { key: '4', label: <span style={{ color: "white" }}>DAW Projects</span>, children: DAWEmbeds },
        { key: '5', label: <span style={{ color: "white" }}>Donations</span>, children: Donations },
        { key: '6', label: <span style={{ color: "white" }}>Tip</span>, children: TipTab }
    ];

    return (
        <Tabs
            defaultActiveKey="1"
            items={items}
            indicator={{ size: (origin) => origin - 20, align: "center" }}
            centered
            className={styles.streamContentTab}
        />
    )
}

export default Tab