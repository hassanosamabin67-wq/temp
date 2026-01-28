'use client'
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Button, Typography, Spin, Empty, Modal, Form, Input, Upload, Avatar, Badge, Image, List, Divider, Alert } from 'antd';
import { TrophyOutlined, CalendarOutlined, UserOutlined, UploadOutlined, HeartOutlined, HeartFilled, CheckCircleOutlined, StarOutlined, CrownOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { ChallengeSubmission, ChallengeWithSubmissions } from '@/types/challengeTypes';
import { useAppSelector } from '@/store';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import styles from './style.module.css';
import { useNotification } from '@/Components/custom/custom-notification';
import { FaXTwitter, FaSquareThreads } from "react-icons/fa6";
import { IoMail } from "react-icons/io5";
import { FaFacebook } from "react-icons/fa";
import { IoMdShare } from "react-icons/io";

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ChallengeDetailProps {
    challengeId: string;
}

const ChallengeDetail: React.FC<ChallengeDetailProps> = ({ challengeId }) => {
    const [challenge, setChallenge] = useState<ChallengeWithSubmissions | null>(null);
    const [loading, setLoading] = useState(true);
    const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userVote, setUserVote] = useState<string | null>(null);
    const [userSubmission, setUserSubmission] = useState<ChallengeSubmission | null>(null);
    const { notify } = useNotification();
    const [votingSubmissionId, setVotingSubmissionId] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const profile = useAppSelector((state) => state.auth);
    const router = useRouter();
    const [form] = Form.useForm();
    const [uploadedFile, setUploadedFile] = useState<any>(null);

    const isVerifiedVisionary = profile.profileType === 'Visionary' && profile.isVerified;
    const isApprovedVisionary = profile.profileType === 'Visionary';

    useEffect(() => {
        fetchChallenge();
        if (profile.profileId) {
            checkUserVote();
            checkUserSubmission();
        }
    }, [challengeId, profile.profileId]);

    const fetchChallenge = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/challenges/${challengeId}`);
            const data = await response.json();

            if (data.success) {
                setChallenge(data.challenge);
            } else {
                notify({ type: 'error', message: "Challenge not found" });
                router.push('/community-challenges');
            }
        } catch (error) {
            console.error('Error fetching challenge:', error);
            notify({ type: 'error', message: "Failed to load challenge" });
        } finally {
            setLoading(false);
        }
    };

    const checkUserVote = async () => {
        try {
            const response = await fetch(
                `/api/challenges/vote?challenge_id=${challengeId}&voter_id=${profile.profileId}`
            );
            const data = await response.json();
            if (data.success && data.has_voted) {
                setUserVote(data.vote.submission_id);
            }
        } catch (error) {
            console.error('Error checking vote:', error);
        }
    };

    const checkUserSubmission = async () => {
        try {
            const response = await fetch(
                `/api/challenges/submissions?challenge_id=${challengeId}&visionary_id=${profile.profileId}`
            );
            const data = await response.json();
            if (data.success && data.submissions.length > 0) {
                setUserSubmission(data.submissions[0]);
            }
        } catch (error) {
            console.error('Error checking submission:', error);
        }
    };

    const handleSubmit = async (values: any) => {
        if (!profile.profileId) {
            notify({ type: 'error', message: "Please log in to submit" });
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append('challenge_id', challengeId);
            formData.append('visionary_id', profile.profileId);
            formData.append('title', values.title);
            formData.append('description', values.description || '');

            if (uploadedFile) {
                formData.append('file', uploadedFile);
            }

            const response = await fetch('/api/challenges/submissions', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                notify({ type: 'success', message: 'Submission successful! Your entry is pending review.' });
                setSubmissionModalVisible(false);
                form.resetFields();
                setUploadedFile(null);
                setUserSubmission(data.submission);
                fetchChallenge();
            } else {
                notify({ type: 'error', message: data.error || 'Failed to submit' });
            }
        } catch (error) {
            console.error('Submission error:', error);
            notify({ type: 'error', message: "Failed to submit" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (submissionId: string) => {
        if (!profile.profileId) {
            notify({ type: 'error', message: "Please log in to vote" });
            return;
        }

        if (userVote) {
            notify({ type: 'info', message: "You have already voted in this challenge" });
            return;
        }

        try {
            setVotingSubmissionId(submissionId);

            const response = await fetch('/api/challenges/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challenge_id: challengeId,
                    submission_id: submissionId,
                    voter_id: profile.profileId
                })
            });

            const data = await response.json();

            if (data.success) {
                notify({ type: 'success', message: "Vote cast successfully!" });
                setUserVote(submissionId);
                fetchChallenge();
            } else {
                notify({ type: 'error', message: "Failed to vote" });
            }
        } catch (error) {
            notify({ type: 'error', message: "Failed to vote" });
            console.error('Vote error:', error);
        } finally {
            setVotingSubmissionId(null);
        }
    };

    const getStatusConfig = (status: string, isVotingPhase: boolean = false) => {
        // If voting is active (based on dates or status), show voting phase
        if (isVotingPhase) {
            return { color: 'blue', label: 'Voting Phase', icon: <HeartOutlined /> };
        }

        switch (status) {
            case 'active':
                return { color: 'green', label: 'Open for Submissions', icon: <CheckCircleOutlined /> };
            case 'voting':
                return { color: 'blue', label: 'Voting Phase', icon: <HeartOutlined /> };
            case 'completed':
                return { color: 'gold', label: 'Completed', icon: <TrophyOutlined /> };
            default:
                return { color: 'default', label: status, icon: null };
        }
    };

    const getTimeRemaining = () => {
        if (!challenge) return null;

        const now = dayjs();
        const deadline = dayjs(challenge.deadline);

        if (challenge.status === 'completed') return 'Challenge ended';
        if (challenge.status === 'voting') {
            if (challenge.voting_end_date) {
                const votingEnd = dayjs(challenge.voting_end_date);
                if (votingEnd.isAfter(now)) {
                    return `Voting ends ${votingEnd.fromNow()}`;
                }
            }
            return 'Voting in progress';
        }

        if (deadline.isBefore(now)) return 'Deadline passed';
        return `Ends ${deadline.fromNow()}`;
    };

    const handleInvite = (id: any) => {
        const inviteUrl = `${window.location.origin}/community-challenges/${id}`;
        navigator.clipboard.writeText(inviteUrl)
            .then(() => {
                notify({
                    type: "success",
                    message: "Link copied to clipboard!",
                });
            })
            .catch((err) => {
                console.error("Failed to copy link:", err);
                notify({
                    type: "error",
                    message: "Failed to copy link.",
                });
            });
    };

    const eventInvite = (url: string) => {
        window.open(url, "_blank");
        return;
    }

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spin size="large" />
            </div>
        );
    }

    if (!challenge) {
        return (
            <MaxWidthWrapper>
                <Empty description="Challenge not found" />
            </MaxWidthWrapper>
        );
    }

    const finalists = challenge.submissions?.filter(s => s.status === 'finalist' || s.status === 'winner') || [];
    const winner = challenge.submissions?.find(s => s.status === 'winner');
    const allSubmissions = challenge.submissions || [];

    // Check if voting is currently active based on dates or status
    const isVotingActive = () => {
        // If status is explicitly 'voting', voting is active
        if (challenge.status === 'voting') return true;

        // If status is 'active' and we have finalists, check voting dates
        if (challenge.status === 'active' && finalists.length > 0) {
            const now = dayjs();

            // If voting_start_date is set and we're past it
            if (challenge.voting_start_date) {
                const votingStart = dayjs(challenge.voting_start_date);
                const votingEnd = challenge.voting_end_date ? dayjs(challenge.voting_end_date) : null;

                if (now.isAfter(votingStart) || now.isSame(votingStart)) {
                    // If no end date or we're before end date
                    if (!votingEnd || now.isBefore(votingEnd) || now.isSame(votingEnd)) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    const votingActive = isVotingActive();
    const statusConfig = getStatusConfig(challenge.status, votingActive);


    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header} style={challenge.cover_image ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(${challenge.cover_image})` } : undefined}>
                <MaxWidthWrapper>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.push('/community-challenges')}
                        className={styles.backButton}
                    >
                        Back to Challenges
                    </Button>

                    <div className={styles.headerContent}>
                        <div className={styles.headerTags}>
                            <Tag color={statusConfig.color} icon={statusConfig.icon} className={styles.statusTag}>
                                {statusConfig.label}
                            </Tag>
                            <Tag className={styles.categoryTag}>{challenge.category}</Tag>
                        </div>

                        <Title className={styles.headerTitle}>{challenge.title}</Title>
                        <Paragraph className={styles.headerBrief}>{challenge.brief}</Paragraph>

                        <div className={styles.headerMeta}>
                            <div className={styles.metaItem}>
                                <CalendarOutlined />
                                <Text>{getTimeRemaining()}</Text>
                            </div>
                            <div className={styles.metaItem}>
                                <UserOutlined />
                                <Text>{challenge.submission_count || 0} submissions</Text>
                            </div>
                        </div>

                        {challenge.status === 'active' && (
                            <div className={styles.headerActions}>
                                {userSubmission ? (
                                    <Alert
                                        message="You've already submitted to this challenge"
                                        type="success"
                                        showIcon
                                        className={styles.submittedAlert}
                                    />
                                ) : isApprovedVisionary ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<UploadOutlined />}
                                        onClick={() => setSubmissionModalVisible(true)}
                                        className={styles.submitButton}
                                    >
                                        Submit Your Entry
                                    </Button>
                                ) : (
                                    <Alert
                                        message="Only verified Visionaries can submit to challenges"
                                        type="info"
                                        showIcon
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </MaxWidthWrapper>
            </div>

            <MaxWidthWrapper>
                <Row gutter={[32, 32]}>
                    {/* Main Content */}
                    <Col xs={24} lg={16}>
                        {/* Winner Announcement */}
                        {winner && (
                            <Card className={styles.winnerCard}>
                                <div className={styles.winnerHeader}>
                                    <CrownOutlined className={styles.winnerIcon} />
                                    <Title level={3} className={styles.winnerTitle}>Challenge Winner</Title>
                                </div>
                                <div className={styles.winnerContent}>
                                    <div className={styles.winnerSubmission}>
                                        {winner.file_url && (
                                            <Image
                                                src={winner.file_url}
                                                alt={winner.title}
                                                className={styles.winnerImage}
                                            />
                                        )}
                                    </div>
                                    <div className={styles.winnerInfo}>
                                        <Title level={4}>{winner.title}</Title>
                                        <div className={styles.winnerAuthor}>
                                            <Avatar src={winner.visionary?.profileImage} icon={<UserOutlined />} />
                                            <Text>{winner.visionary?.userName || `${winner.visionary?.firstName} ${winner.visionary?.lastName}`}</Text>
                                        </div>
                                        <Paragraph>{winner.description}</Paragraph>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Voting Section */}
                        {votingActive && finalists.length > 0 && (
                            <Card title={<><TrophyOutlined /> Vote for Finalists</>} className={styles.votingCard}>
                                {!isApprovedVisionary && (
                                    <Alert
                                        message="Only verified Visionaries can vote"
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                    />
                                )}
                                {challenge.voting_end_date && (
                                    <Alert
                                        message={`Voting ends ${dayjs(challenge.voting_end_date).format('MMMM D, YYYY [at] h:mm A')}`}
                                        type="warning"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                    />
                                )}
                                <Row gutter={[16, 16]}>
                                    {finalists.map(submission => (
                                        <Col key={submission.id} xs={24} sm={12}>
                                            <Card
                                                className={`${styles.finalistCard} ${userVote === submission.id ? styles.votedCard : ''}`}
                                                cover={
                                                    submission.file_url && (
                                                        <div className={styles.finalistImageWrapper}>
                                                            <Image
                                                                src={submission.file_url}
                                                                alt={submission.title}
                                                                className={styles.finalistImage}
                                                            />
                                                        </div>
                                                    )
                                                }
                                            >
                                                <div className={styles.finalistInfo}>
                                                    <Text strong>{submission.title}</Text>
                                                    <div className={styles.finalistAuthor}>
                                                        <Avatar size="small" src={submission.visionary?.profileImage} />
                                                        <Text type="secondary">
                                                            {submission.visionary?.userName || submission.visionary?.firstName}
                                                        </Text>
                                                    </div>
                                                    <div className={styles.voteSection}>
                                                        <Badge count={submission.vote_count} showZero style={{ backgroundColor: '#1890ff' }}>
                                                            <HeartFilled style={{ fontSize: 20, color: '#ff4d4f' }} />
                                                        </Badge>
                                                        {isApprovedVisionary && !userVote && (
                                                            <Button
                                                                type="primary"
                                                                icon={<HeartOutlined />}
                                                                onClick={() => handleVote(submission.id)}
                                                                loading={votingSubmissionId === submission.id}
                                                            >
                                                                Vote
                                                            </Button>
                                                        )}
                                                        {userVote === submission.id && (
                                                            <Tag color="green" icon={<CheckCircleOutlined />}>
                                                                Your Vote
                                                            </Tag>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Card>
                        )}

                        {/* Submission Gallery */}
                        <Card title={<><UserOutlined /> Submissions Gallery</>} className={styles.galleryCard}>
                            {allSubmissions.length === 0 ? (
                                <Empty description="No submissions yet. Be the first to enter!" />
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {allSubmissions.map(submission => (
                                        <Col key={submission.id} xs={24} sm={12} md={8}>
                                            <Card
                                                className={styles.submissionCard}
                                                cover={
                                                    submission.file_url && (
                                                        <div className={styles.submissionImageWrapper}>
                                                            <Image
                                                                src={submission.file_url}
                                                                alt={submission.title}
                                                                className={styles.submissionImage}
                                                            />
                                                            {submission.status === 'winner' && (
                                                                <div className={styles.winnerBadge}>
                                                                    <CrownOutlined /> Winner
                                                                </div>
                                                            )}
                                                            {submission.status === 'finalist' && (
                                                                <div className={styles.finalistBadge}>
                                                                    <StarOutlined /> Finalist
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                }
                                            >
                                                <Card.Meta
                                                    avatar={<Avatar src={submission.visionary?.profileImage} />}
                                                    title={submission.title}
                                                    description={submission.visionary?.userName || submission.visionary?.firstName}
                                                />
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Card>
                    </Col>

                    {/* Sidebar */}
                    <Col xs={24} lg={8}>
                        {/* Challenge Info */}
                        <Card title="Challenge Details" className={styles.detailsCard}>
                            <div className={styles.detailItem}>
                                <div className={styles.shareDiv}>
                                    <Text type="secondary">Description</Text>
                                    <span className={styles.shareBtn} onClick={() => setShowInviteModal(true)}><IoMdShare /></span>
                                </div>
                                <Paragraph>{challenge.description}</Paragraph>
                            </div>

                            <Divider />

                            <div className={styles.detailItem}>
                                <Text type="secondary">Submission Format</Text>
                                <Text strong>{challenge.submission_format}</Text>
                            </div>

                            <Divider />

                            <div className={styles.detailItem}>
                                <Text type="secondary">Deadline</Text>
                                <Text strong>{dayjs(challenge.deadline).format('MMMM D, YYYY [at] h:mm A')}</Text>
                            </div>

                            {challenge.voting_start_date && (
                                <>
                                    <Divider />
                                    <div className={styles.detailItem}>
                                        <Text type="secondary">Voting Period</Text>
                                        <Text strong>
                                            {dayjs(challenge.voting_start_date).format('MMM D')} - {challenge.voting_end_date ? dayjs(challenge.voting_end_date).format('MMM D, YYYY') : 'TBD'}
                                        </Text>
                                    </div>
                                </>
                            )}
                        </Card>

                        {/* Prizes */}
                        {challenge.prizes && challenge.prizes.length > 0 && (
                            <Card title={<><TrophyOutlined /> Prizes & Recognition</>} className={styles.prizesCard}>
                                {challenge.prizes.map((prize, index) => (
                                    <div key={index} className={styles.prizeItem}>
                                        <div className={styles.prizePlace}>
                                            {prize.place === 1 && <CrownOutlined className={styles.goldIcon} />}
                                            {prize.place === 2 && <TrophyOutlined className={styles.silverIcon} />}
                                            {prize.place === 3 && <TrophyOutlined className={styles.bronzeIcon} />}
                                            <Text strong>{prize.title}</Text>
                                        </div>
                                        <Text type="secondary">{prize.description || 'Recognition & Featured Placement'}</Text>
                                        {prize.badge_name && (
                                            <Tag color="purple" style={{ marginTop: 4, marginLeft: 8 }}>
                                                <StarOutlined /> {prize.badge_name}
                                            </Tag>
                                        )}
                                    </div>
                                ))}
                            </Card>
                        )}

                        {/* Rules */}
                        {challenge.rules && challenge.rules.length > 0 && (
                            <Card title="Important Rules" className={styles.rulesCard}>
                                <List
                                    dataSource={challenge.rules}
                                    renderItem={(rule, index) => (
                                        <List.Item className={styles.ruleItem}>
                                            <Text>{rule}</Text>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}
                    </Col>
                </Row>
            </MaxWidthWrapper>

            {/* Submission Modal */}
            <Modal
                title="Submit Your Entry"
                open={submissionModalVisible}
                onCancel={() => setSubmissionModalVisible(false)}
                footer={null}
                width={600}
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Alert
                        message="Submission Guidelines"
                        description={`Format: ${challenge.submission_format}`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Form.Item
                        name="title"
                        label="Submission Title"
                        rules={[{ required: true, message: 'Please enter a title for your submission' }]}
                    >
                        <Input placeholder="Give your submission a creative title" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please describe your submission' }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Tell us about your creative process and inspiration..."
                        />
                    </Form.Item>

                    <Form.Item
                        name="file"
                        label="Upload Your Work"
                        rules={[{ required: true, message: 'Please upload your submission file' }]}
                    >
                        <Upload
                            beforeUpload={(file) => {
                                setUploadedFile(file);
                                return false;
                            }}
                            maxCount={1}
                            listType="picture-card"
                            onRemove={() => setUploadedFile(null)}
                        >
                            {!uploadedFile && (
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            block
                            size="large"
                        >
                            Submit Entry
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={
                    <Title level={2} style={{ marginBottom: 10 }}>
                        Share challenge
                    </Title>
                }
                open={showInviteModal}
                onCancel={() => setShowInviteModal(false)}
                footer={null}
                width={600}
                centered
            >
                <div>
                    <Button onClick={() => handleInvite(challengeId)}>Copy Link</Button>
                    <div style={{ margin: "20px 0" }}>
                        <span className={styles.shareHeading}>Share</span>
                        <div className={styles.scDiv}>
                            <span className={`${styles.scIcon} ${styles.fbIcon}`} onClick={() => eventInvite('https://www.facebook.com')}><FaFacebook /></span>
                            <span className={styles.scIcon} onClick={() => eventInvite('https://x.com')}><FaXTwitter /></span>
                            <span className={styles.scIcon} onClick={() => eventInvite('https://www.threads.com')}><FaSquareThreads /></span>
                            <span className={`${styles.scIcon} ${styles.mailIcon}`} onClick={() => eventInvite('https://mail.google.com')}><IoMail /></span>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ChallengeDetail;