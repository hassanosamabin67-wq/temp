'use client'
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Button, Input, Select, Spin, Empty, Typography, Badge, Tooltip } from 'antd';
import { SearchOutlined, TrophyOutlined, CalendarOutlined, UserOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { CommunityChallenge, ChallengeStatus } from '@/types/challengeTypes';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import styles from './style.module.css';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

const CommunityChallenges: React.FC = () => {
    const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        fetchChallenges();
    }, [statusFilter]);

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/challenges?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setChallenges(data.challenges);
            }
        } catch (error) {
            console.error('Error fetching challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChallenges = challenges.filter(challenge => {
        const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            challenge.brief.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || challenge.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Helper to check if a challenge is in voting phase based on dates
    const isInVotingPhase = (challenge: CommunityChallenge) => {
        if (challenge.status === 'voting') return true;

        if (challenge.status === 'active' && challenge.voting_start_date) {
            const now = dayjs();
            const votingStart = dayjs(challenge.voting_start_date);
            const votingEnd = challenge.voting_end_date ? dayjs(challenge.voting_end_date) : null;

            if ((now.isAfter(votingStart) || now.isSame(votingStart)) &&
                (!votingEnd || now.isBefore(votingEnd) || now.isSame(votingEnd))) {
                return true;
            }
        }
        return false;
    };

    const featuredChallenges = filteredChallenges.filter(c => c.featured_on_homepage && c.status === 'active' && !isInVotingPhase(c));
    const activeChallenges = filteredChallenges.filter(c => c.status === 'active' && !c.featured_on_homepage && !isInVotingPhase(c));
    const votingChallenges = filteredChallenges.filter(c => isInVotingPhase(c));
    const completedChallenges = filteredChallenges.filter(c => c.status === 'completed');

    const getStatusConfig = (status: ChallengeStatus, isVoting: boolean = false) => {
        if (isVoting) {
            return { color: 'blue', icon: <TrophyOutlined />, label: 'Voting Open' };
        }

        switch (status) {
            case 'active':
                return { color: 'green', icon: <FireOutlined />, label: 'Open for Submissions' };
            case 'voting':
                return { color: 'blue', icon: <TrophyOutlined />, label: 'Voting Open' };
            case 'completed':
                return { color: 'gold', icon: <TrophyOutlined />, label: 'Completed' };
            default:
                return { color: 'default', icon: null, label: status };
        }
    };

    const getDeadlineText = (deadline: string, status: ChallengeStatus, isVoting: boolean = false) => {
        const deadlineDate = dayjs(deadline);
        const now = dayjs();

        if (status === 'completed') return 'Challenge ended';
        if (status === 'voting' || isVoting) return 'Voting in progress';

        if (deadlineDate.isBefore(now)) return 'Deadline passed';

        const daysLeft = deadlineDate.diff(now, 'day');
        if (daysLeft === 0) return 'Ends today!';
        if (daysLeft === 1) return '1 day left';
        if (daysLeft < 7) return `${daysLeft} days left`;
        return `Ends ${deadlineDate.format('MMM DD, YYYY')}`;
    };

    const ChallengeCard: React.FC<{ challenge: CommunityChallenge; featured?: boolean }> = ({ challenge, featured }) => {
        const isVoting = isInVotingPhase(challenge);
        const statusConfig = getStatusConfig(challenge.status, isVoting);
        const deadlineText = getDeadlineText(challenge.deadline, challenge.status, isVoting);
        const isUrgent = dayjs(challenge.deadline).diff(dayjs(), 'day') <= 3 && challenge.status === 'active' && !isVoting;

        return (
            <Card
                className={`${styles.challengeCard} ${featured ? styles.featuredCard : ''}`}
                hoverable
                onClick={() => router.push(`/community-challenges/${challenge.id}`)}
                cover={
                    challenge.cover_image ? (
                        <div className={styles.coverImageWrapper}>
                            <img
                                alt={challenge.title}
                                src={challenge.cover_image}
                                className={styles.coverImage}
                            />
                            {featured && (
                                <div className={styles.featuredBadge}>
                                    <FireOutlined /> Featured
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.coverImageWrapper}>
                            <div className={styles.coverBg} />
                            {featured && (
                                <div className={styles.featuredBadge}>
                                    <FireOutlined /> Featured
                                </div>
                            )}
                        </div>
                    )
                }
            >
                <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                        <Tag color={statusConfig.color} icon={statusConfig.icon}>
                            {statusConfig.label}
                        </Tag>
                        <Tag>{challenge.category}</Tag>
                    </div>

                    <Title level={4} className={styles.cardTitle}>
                        {challenge.title}
                    </Title>

                    <Paragraph className={styles.cardBrief} ellipsis={{ rows: 2 }}>
                        {challenge.brief}
                    </Paragraph>

                    <div className={styles.cardMeta}>
                        <div className={styles.metaItem}>
                            <CalendarOutlined />
                            <Text type={isUrgent ? 'danger' : 'secondary'}>
                                {deadlineText}
                            </Text>
                        </div>
                    </div>

                    {challenge.prizes && challenge.prizes.length > 0 && (
                        <div className={styles.prizesPreview}>
                            <TrophyOutlined className={styles.prizeIcon} />
                            <Text type="secondary">
                                {challenge.prizes[0].description || 'Recognition & Badge'}
                            </Text>
                        </div>
                    )}

                    <Button
                        type={(challenge.status === 'active' && !isVoting) ? 'primary' : 'default'}
                        block
                        className={styles.viewButton}
                    >
                        {isVoting ? 'Vote Now' :
                            challenge.status === 'active' ? 'Enter Challenge' :
                                challenge.status === 'completed' ? 'View Results' : 'View Challenge'}
                    </Button>
                </div>
            </Card>
        );
    };

    const ChallengeSection: React.FC<{ title: string; challenges: CommunityChallenge[]; icon?: React.ReactNode }> = ({ title, challenges, icon }) => {
        if (challenges.length === 0) return null;

        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    {icon}
                    <Title level={3} className={styles.sectionTitle}>{title}</Title>
                    <Badge count={challenges.length} style={{ backgroundColor: '#1890ff' }} />
                </div>
                <Row gutter={[24, 24]}>
                    {challenges.map(challenge => (
                        <Col key={challenge.id} xs={24} sm={12} lg={8} xl={6}>
                            <ChallengeCard challenge={challenge} />
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <MaxWidthWrapper>
                    <div className={styles.heroContent}>
                        <Title className={styles.heroTitle}>
                            <TrophyOutlined /> Community Challenges
                        </Title>
                        <Paragraph className={styles.heroSubtitle}>
                            Spotlight your creativity, gain recognition, and connect with the Kaboom Collab community.
                            Challenges are recognition-first initiatives designed to celebrate Visionaries.
                        </Paragraph>
                    </div>
                </MaxWidthWrapper>
            </div>

            <MaxWidthWrapper>
                {/* Filters */}
                <Card className={styles.filterCard}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={10}>
                            <Input
                                placeholder="Search challenges..."
                                prefix={<SearchOutlined />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="large"
                                className={styles.searchInput}
                            />
                        </Col>
                        <Col xs={12} md={7}>
                            <Select
                                placeholder="Category"
                                value={categoryFilter || undefined}
                                onChange={setCategoryFilter}
                                allowClear
                                style={{ width: '100%' }}
                                size="large"
                            >
                                <Select.Option value="Visual Arts">Visual Arts</Select.Option>
                                <Select.Option value="Music">Music</Select.Option>
                                <Select.Option value="Writing">Writing</Select.Option>
                                <Select.Option value="Video">Video</Select.Option>
                                <Select.Option value="Design">Design</Select.Option>
                                <Select.Option value="Other">Other</Select.Option>
                            </Select>
                        </Col>
                        <Col xs={12} md={7}>
                            <Select
                                placeholder="Status"
                                value={statusFilter || undefined}
                                onChange={setStatusFilter}
                                allowClear
                                style={{ width: '100%' }}
                                size="large"
                            >
                                <Select.Option value="active">Open for Submissions</Select.Option>
                                <Select.Option value="voting">Voting Open</Select.Option>
                                <Select.Option value="completed">Completed</Select.Option>
                            </Select>
                        </Col>
                    </Row>
                </Card>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                    </div>
                ) : filteredChallenges.length === 0 ? (
                    <div className={styles.emptyContainer}>
                        <Empty
                            description="No challenges found"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </div>
                ) : (
                    <>
                        {/* Featured Challenges */}
                        {featuredChallenges.length > 0 && (
                            <div className={styles.featuredSection}>
                                <Row gutter={[24, 24]}>
                                    {featuredChallenges.map(challenge => (
                                        <Col key={challenge.id} xs={24} lg={12}>
                                            <ChallengeCard challenge={challenge} featured />
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}

                        {/* Active Challenges */}
                        <ChallengeSection
                            title="Open Challenges"
                            challenges={activeChallenges}
                            icon={<FireOutlined className={styles.sectionIcon} />}
                        />

                        {/* Voting Challenges */}
                        <ChallengeSection
                            title="Vote for Your Favorites"
                            challenges={votingChallenges}
                            icon={<TrophyOutlined className={styles.sectionIcon} />}
                        />

                        {/* Completed Challenges */}
                        <ChallengeSection
                            title="Past Challenges"
                            challenges={completedChallenges}
                            icon={<ClockCircleOutlined className={styles.sectionIcon} />}
                        />
                    </>
                )}

                {/* Info Section */}
                <Card className={styles.infoCard}>
                    <Row gutter={[32, 32]}>
                        <Col xs={24} md={8}>
                            <div className={styles.infoItem}>
                                <UserOutlined className={styles.infoIcon} />
                                <Title level={5}>Who Can Enter?</Title>
                                <Text type="secondary">
                                    Verified Visionaries only. Participation is optional with no guarantee of winning.
                                </Text>
                            </div>
                        </Col>
                        <Col xs={24} md={8}>
                            <div className={styles.infoItem}>
                                <TrophyOutlined className={styles.infoIcon} />
                                <Title level={5}>Recognition First</Title>
                                <Text type="secondary">
                                    Winners get featured placement in Hall of Creatives and challenge badges on their profiles.
                                </Text>
                            </div>
                        </Col>
                        <Col xs={24} md={8}>
                            <div className={styles.infoItem}>
                                <FireOutlined className={styles.infoIcon} />
                                <Title level={5}>How It Works</Title>
                                <Text type="secondary">
                                    Submit your entry, get curated to finalists, community votes, and Kaboom selects the winner.
                                </Text>
                            </div>
                        </Col>
                    </Row>
                </Card>
            </MaxWidthWrapper>
        </div>
    );
};

export default CommunityChallenges;