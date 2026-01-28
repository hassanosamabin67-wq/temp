import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Switch, Typography, Tabs, Spin } from 'antd';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import styles from './styles.module.css';
import { MdTextFields } from 'react-icons/md';
import { IoMdHeart, IoMdAdd, IoMdBulb, IoMdRefresh } from 'react-icons/io';
import { FaRobot } from 'react-icons/fa';
import DonationForm from '../../SoundScapeStreamComp/Tab/DonationForm';
import Tip from '../../SoundScapeStreamComp/Tab/Tip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import kaiLogo from '@/public/assets/img/kai-logo.png'
import Image from 'next/image';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const { TextArea } = Input;
const { Text, Title } = Typography;

interface WordflowStreamComponentsProps {
    roomId: string;
    hostId: string;
    isHost: boolean;
}

const WordflowStreamComponents: React.FC<WordflowStreamComponentsProps> = ({
    roomId,
    hostId,
    isHost
}) => {
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();

    // Reading Overlay State
    const [overlayText, setOverlayText] = useState('');
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [overlayModalVisible, setOverlayModalVisible] = useState(false);

    // Performance Text State
    const [performanceText, setPerformanceText] = useState('');
    const [savedTexts, setSavedTexts] = useState<any[]>([]);

    // Donation & Tip State
    const [donationModalVisible, setDonationModalVisible] = useState(false);
    const [donationAmount, setDonationAmount] = useState<number>(5);
    const [donations, setDonations] = useState<any[]>([]);
    const [donationStats, setDonationStats] = useState({ total: 0, count: 0 });
    const [tipModalVisible, setTipModalVisible] = useState(false);
    const [tipAmount, setTipAmount] = useState<number>(5);

    // Saved Text Modal State
    const [selectedText, setSelectedText] = useState<any>(null);
    const [textModalVisible, setTextModalVisible] = useState(false);

    // K.A.I Writing Ideas State
    const [kaiInput, setKaiInput] = useState('');
    const [kaiResponse, setKaiResponse] = useState('');
    const [kaiLoading, setKaiLoading] = useState(false);
    const [kaiError, setKaiError] = useState('');
    const [writingPrompts] = useState([
        'Help me write a motivational piece about turning failures into stepping stones',
        'Create a poetry concept about finding strength in vulnerability',
        'Suggest ideas for a spoken word piece about chasing dreams despite fear',
        'Give me a storytelling framework about unexpected friendships that change lives',
        'Help me craft a performance about self-love and acceptance',
        'Suggest themes for a piece about finding your authentic voice'
    ]);

    useEffect(() => {
        // Load room-specific data
        loadRoomData();

        // Load donations if host ID is available
        if (hostId) {
            fetchDonations();
        }

        // Set up real-time subscriptions
        const subscription = supabase
            .channel(`wordflow-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'wordflow_activities'
                },
                (payload) => {
                    handleRealTimeUpdate(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [roomId, hostId]);

    // Donation subscription
    useEffect(() => {
        if (!hostId) {
            return;
        }

        const channel = supabase
            .channel(`donations-${roomId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `type=eq.Stream Donation AND user_id=eq.${hostId}` },
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
    }, [roomId, hostId]);

    const loadRoomData = async () => {
        try {
            // Load saved performance texts
            const { data: texts } = await supabase
                .from('wordflow_texts')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false });

            if (texts) setSavedTexts(texts);

            // Load the latest overlay state
            const { data: overlayData } = await supabase
                .from('wordflow_activities')
                .select('*')
                .eq('room_id', roomId)
                .eq('type', 'overlay_update')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (overlayData) {
                setOverlayText(overlayData.content || '');
                setOverlayVisible(overlayData.visible || false);
            }

        } catch (error) {
            console.error('Error loading room data:', error);
        }
    };

    const fetchDonations = async () => {
        try {
            if (!hostId) {
                console.log('Host ID not available, skipping donation fetch');
                return;
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'Stream Donation')
                .eq('room_id', roomId)
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

    const handleRealTimeUpdate = (payload: any) => {
        if (payload.new?.type === 'overlay_update') {
            setOverlayText(payload.new.content);
            setOverlayVisible(payload.new.visible);
        }
    };

    const updateReadingOverlay = async () => {
        try {
            await supabase
                .from('wordflow_activities')
                .insert({
                    room_id: roomId,
                    user_id: profile.profileId,
                    type: 'overlay_update',
                    content: overlayText,
                    visible: overlayVisible
                });

            setOverlayModalVisible(false);
            notify({ type: 'success', message: 'Reading overlay updated!' });
        } catch (error) {
            console.error('Error updating overlay:', error);
            notify({ type: 'error', message: 'Failed to update overlay' });
        }
    };

    const savePerformanceText = async () => {
        if (!performanceText.trim()) return;

        try {
            const { data } = await supabase
                .from('wordflow_texts')
                .insert({
                    room_id: roomId,
                    user_id: profile.profileId,
                    title: `Performance ${new Date().toLocaleString()}`,
                    content: performanceText,
                    type: 'performance'
                })
                .select()
                .single();

            if (data) {
                setSavedTexts(prev => [data, ...prev]);
                setPerformanceText('');
                notify({ type: 'success', message: 'Performance text saved!' });
            }
        } catch (error) {
            console.error('Error saving text:', error);
            notify({ type: 'error', message: 'Failed to save text' });
        }
    };

    const handleDonationSuccess = async (paymentIntentId: string, amount: number, paymentIntentStatus: any) => {
        try {
            const { error } = await supabase.from('transactions').insert({
                stripe_transaction_id: paymentIntentId,
                amount: amount,
                user_id: hostId,
                room_id: roomId,
                client_id: profile.profileId,
                type: "Stream Donation",
                status: paymentIntentStatus,
                purchase_name: `Donation to WORDFLOW Stream`
            });

            if (error) {
                console.error('Error recording donation:', error);
                return;
            }

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
                user_id: hostId,
                room_id: roomId,
                client_id: profile.profileId,
                type: "Stream Tip",
                status: paymentIntentStatus,
                purchase_name: `Tip for WORDFLOW Performance`
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

    // K.A.I Writing Ideas Functions
    const handleKaiAsk = async (question?: string) => {
        const queryText = question || kaiInput;
        if (!queryText.trim()) return;

        setKaiLoading(true);
        setKaiResponse('');
        setKaiError('');

        try {
            const res = await fetch('/api/kai-writing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: queryText
                }),
            });

            const data = await res.json();

            if (data.success) {
                setKaiResponse(data.answer);
                notify({ type: 'success', message: 'K.A.I has provided writing ideas!' });
            } else {
                setKaiError(data.error || 'Sorry, K.A.I encountered an issue. Please try again.');
            }
        } catch (err) {
            setKaiError('Failed to connect to K.A.I. Please check your connection and try again.');
            console.error('KAI fetch error:', err);
        } finally {
            setKaiLoading(false);
        }
    };

    const insertKaiResponseToPerformance = () => {
        if (kaiResponse) {
            setPerformanceText(prev => prev + '\n\n' + kaiResponse.replace(/[*#]/g, ''));
            notify({ type: 'success', message: 'K.A.I ideas added to performance text!' });
        }
    };

    const handleKaiKeyPress = (
        e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (e.key === 'Enter' && !kaiLoading) {
            handleKaiAsk();
        }
    };

    const renderReadingOverlay = () => {
        return (
            <div className={styles.readingOverlay}>
                <span className={styles.readingOverlayTitle}>📖 Reading Overlay</span>
                {isHost && (<Button
                    icon={<MdTextFields />}
                    onClick={() => setOverlayModalVisible(true)}
                    disabled={!isHost}
                >
                    Manage Overlay
                </Button>)}
                {overlayVisible && overlayText && (
                    <div className={styles.overlayPreview}>
                        <span>"{overlayText}"</span>
                    </div>
                )}
            </div>
        );
    };

    const renderDonations = () => {
        return (
            <div className={styles.donationsContainer}>
                <div className={styles.donationsHeader}>
                    <span className={styles.donationsHeaderTitle}>Support the Stream</span>
                    <div className={styles.donationStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Total Raised</span>
                            <span className={styles.statValue}>${(donationStats.total / 100).toFixed(2)}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Donations</span>
                            <span className={styles.statValue}>{donationStats.count}</span>
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
                        <span className={styles.recentDonationsTitle}>Recent Donations</span>
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
            </div>
        );
    };

    const renderTipTab = () => {
        return (
            <div className={styles.donationsContainer}>
                <div className={styles.donationsHeader}>
                    <span className={styles.donationsHeaderTitle}>Send a Tip</span>
                    <div className={styles.donationActions}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<IoMdHeart />}
                            onClick={() => setTipModalVisible(true)}
                            className={styles.donateButton}
                        >
                            Tip the Performer
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPerformanceTools = () => {
        return (
            <div className={styles.performanceTools}>
                <span className={styles.performanceToolsTitle}>✍️ Performance Tools</span>
                <TextArea
                    placeholder="Write your poetry, story, or motivational content here..."
                    value={performanceText}
                    onChange={(e) => setPerformanceText(e.target.value)}
                    rows={4}
                    className={styles.performanceTextArea}
                />
                <div className={styles.toolButtons}>
                    <Button
                        icon={<IoMdAdd />}
                        type='primary'
                        onClick={savePerformanceText}
                        disabled={!performanceText.trim()}
                    >
                        Save Text
                    </Button>
                    {isHost && (
                        <Button
                            icon={<MdTextFields />}
                            type='primary'
                            onClick={() => {
                                setOverlayText(performanceText);
                                setOverlayVisible(true);
                                updateReadingOverlay();
                            }}
                            disabled={!performanceText.trim()}
                        >
                            Display as Overlay
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const renderKaiWritingIdeas = () => {
        return (
            <div className={styles.kaiContainer}>
                <div className={styles.kaiHeader}>
                    <Image src={kaiLogo} width={30} height={30} alt="K.A.I" className={styles.kaiIcon} />
                    <span className={styles.kaiTitle}>K.A.I Writing Ideas</span>
                    <Text className={styles.kaiSubtitle}>Get K.A.I inspiration for your WORDFLOW performance</Text>
                </div>

                <div className={styles.kaiInputSection}>
                    <TextArea
                        placeholder="Ask K.A.I for writing ideas, themes, or inspiration..."
                        rows={2}
                        value={kaiInput}
                        onChange={(e) => setKaiInput(e.target.value)}
                        onKeyDown={handleKaiKeyPress}
                        disabled={kaiLoading}
                        className={styles.kaiInput}
                    />
                    <Button
                        icon={kaiLoading ? <Spin size="small" /> : <IoMdBulb />}
                        onClick={() => handleKaiAsk()}
                        disabled={kaiLoading || !kaiInput.trim()}
                        className={styles.kaiAskButton}
                    >
                        {kaiLoading ? 'Thinking...' : 'Ask K.A.I'}
                    </Button>
                </div>

                <div className={styles.kaiPrompts}>
                    <Text className={styles.promptsTitle}>Quick Writing Prompts:</Text>
                    <div className={styles.promptButtons}>
                        {writingPrompts.map((prompt, index) => (
                            <Button
                                key={index}
                                size="small"
                                onClick={() => handleKaiAsk(prompt)}
                                disabled={kaiLoading}
                                className={styles.promptButton}
                            >
                                {prompt}
                            </Button>
                        ))}
                    </div>
                </div>

                {kaiError && (
                    <div className={styles.kaiError}>
                        <Text type="danger">{kaiError}</Text>
                    </div>
                )}

                {kaiResponse && (
                    <div className={styles.kaiResponse}>
                        <div className={styles.kaiResponseHeader}>
                            <Text strong>K.A.I's Writing Ideas:</Text>
                            <div className={styles.kaiResponseActions}>
                                <Button
                                    size="small"
                                    icon={<IoMdAdd />}
                                    onClick={insertKaiResponseToPerformance}
                                    type="primary"
                                >
                                    Add to Performance
                                </Button>
                                <Button
                                    size="small"
                                    icon={<IoMdRefresh />}
                                    onClick={() => {
                                        setKaiResponse('');
                                        setKaiError('');
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                        <div className={styles.kaiMarkdown}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeSanitize]}
                            >
                                {kaiResponse}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.wordflowContainer}>
            <span className={styles.header}>🎤 WORDFLOW - Spoken Word Studio</span>

            <Tabs
                defaultActiveKey="1"
                className={styles.wordflowTabs}
                items={[
                    {
                        key: "1",
                        label: "🎭 Performance",
                        children: renderPerformanceTools()
                    },
                    {
                        key: "2",
                        label: (
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Image src={kaiLogo} alt="K.A.I" width={20} height={20} />
                                <span>K.A.I Ideas</span>
                            </div>
                        ),
                        children: renderKaiWritingIdeas()
                    },
                    {
                        key: "3",
                        label: "📖 Reading Mode",
                        children: (
                            <>
                                {renderReadingOverlay()}
                                <div className={styles.savedTexts}>
                                    <span className={styles.savedTextsTitle}>Saved Texts</span>
                                    {savedTexts.length === 0 ? (
                                        <Text style={{ color: "rgba(255,255,255,0.6)" }}>No saved texts yet. Write and save your performance texts!</Text>
                                    ) : (
                                        savedTexts.map((text, index) => (
                                            <div
                                                key={text.id || index}
                                                className={styles.textItem}
                                                onClick={() => {
                                                    setSelectedText(text);
                                                    setTextModalVisible(true);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <span style={{ color: "white", fontWeight: 500 }}>{text.title}</span>
                                                <span style={{ color: "rgba(255,255,255,0.7)" }}>
                                                    {text.content.length > 100 ? `${text.content.substring(0, 100)}...` : text.content}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )
                    },
                    {
                        key: "4",
                        label: "💰 Donations",
                        children: renderDonations()
                    },
                    {
                        key: "5",
                        label: "💝 Tip",
                        children: renderTipTab()
                    }
                ]}
            />

            {/* Reading Overlay Modal */}
            <Modal
                title="📖 Reading Overlay Control"
                open={overlayModalVisible}
                onCancel={() => setOverlayModalVisible(false)}
                onOk={updateReadingOverlay}
                okText="Update Overlay"
            >
                <div style={{ marginBottom: 16 }}>
                    <Switch
                        checked={overlayVisible}
                        onChange={setOverlayVisible}
                        checkedChildren="Visible"
                        unCheckedChildren="Hidden"
                    />
                    <Text style={{ marginLeft: 8 }}>Show overlay to audience</Text>
                </div>
                <TextArea
                    placeholder="Enter text to display as overlay during performance..."
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    rows={4}
                />
            </Modal>

            {/* Donation Modal */}
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
                        userId={profile.profileId || ''}
                        onSuccess={handleDonationSuccess}
                        onCancel={() => setDonationModalVisible(false)}
                        title="Support the WORDFLOW Stream"
                    />
                </Elements>
            </Modal>

            {/* Tip Modal */}
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
                        userId={profile.profileId || ''}
                        onSuccess={handleTipSuccess}
                        onCancel={() => setTipModalVisible(false)}
                        title="Send a Tip to the Performer"
                    />
                </Elements>
            </Modal>

            {/* Saved Text View Modal */}
            <Modal
                title={selectedText?.title || 'Saved Text'}
                open={textModalVisible}
                onCancel={() => {
                    setTextModalVisible(false);
                    setSelectedText(null);
                }}
                footer={[
                    <Button
                        key="use"
                        type="primary"
                        onClick={() => {
                            if (selectedText) {
                                setPerformanceText(selectedText.content);
                                setTextModalVisible(false);
                                setSelectedText(null);
                                notify({ type: 'success', message: 'Text loaded to performance area!' });
                            }
                        }}
                    >
                        Use This Text
                    </Button>,
                    isHost && (
                        <Button
                            key="overlay"
                            onClick={() => {
                                if (selectedText) {
                                    setOverlayText(selectedText.content);
                                    setOverlayVisible(true);
                                    updateReadingOverlay();
                                    setTextModalVisible(false);
                                    setSelectedText(null);
                                }
                            }}
                        >
                            Display as Overlay
                        </Button>
                    ),
                    <Button
                        key="close"
                        onClick={() => {
                            setTextModalVisible(false);
                            setSelectedText(null);
                        }}
                    >
                        Close
                    </Button>
                ].filter(Boolean)}
                centered
                width={600}
            >
                {selectedText && (
                    <div style={{
                        maxHeight: '60vh',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.8,
                        padding: '16px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px'
                    }}>
                        <Text>{selectedText.content}</Text>
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e0e0e0' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Created: {new Date(selectedText.created_at).toLocaleString()}
                            </Text>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default WordflowStreamComponents;