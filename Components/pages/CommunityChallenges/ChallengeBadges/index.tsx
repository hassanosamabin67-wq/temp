'use client'
import React, { useEffect, useState } from 'react';
import { Tag, Tooltip, Space, Spin, Typography, Avatar } from 'antd';
import { TrophyOutlined, CrownOutlined, StarOutlined, MailOutlined } from '@ant-design/icons';
import { ChallengeBadge } from '@/types/challengeTypes';
import { supabase } from '@/config/supabase';
import styles from './style.module.css';
import Link from 'next/link';

const { Text } = Typography;

interface ChallengeBadgesProps {
    userId: string;
    showAll?: boolean;
    maxDisplay?: number;
}

const ChallengeBadges: React.FC<ChallengeBadgesProps> = ({
    userId,
    showAll = false,
    maxDisplay = 3
}) => {
    const [badges, setBadges] = useState<ChallengeBadge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBadges();
    }, [userId]);

    const fetchBadges = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('challenge_badges')
                .select(`
                    *,
                    challenge:community_challenges!challenge_badges_challenge_id_fkey(
                        id, title, category
                    )
                `)
                .eq('user_id', userId)
                .order('awarded_at', { ascending: false });

            if (error) {
                console.error('Error fetching badges:', error);
                return;
            }

            setBadges(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeConfig = (badgeType: string) => {
        switch (badgeType) {
            case 'winner':
                return {
                    icon: <CrownOutlined />,
                    color: '#faad14',
                    gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
                    label: 'Winner'
                };
            case 'finalist':
                return {
                    icon: <StarOutlined />,
                    color: '#667eea',
                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    label: 'Finalist'
                };
            case 'participant':
                return {
                    icon: <MailOutlined />,
                    color: '#52c41a',
                    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    label: 'Participant'
                };
            default:
                return {
                    icon: <TrophyOutlined />,
                    color: '#1890ff',
                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    label: badgeType
                };
        }
    };

    if (loading) {
        return <Spin size="small" />;
    }

    if (badges.length === 0) {
        return null;
    }

    const displayBadges = showAll ? badges : badges.slice(0, maxDisplay);
    const remainingCount = badges.length - maxDisplay;
    const winnerBadges = badges.filter(b => b.badge_type === 'winner');

    return (
        <div className={styles.badgesContainer}>
            <Space wrap size={[8, 8]}>
                {displayBadges.map((badge) => {
                    const config = getBadgeConfig(badge.badge_type);
                    return (
                        <Tooltip
                            key={badge.id}
                            title={
                                <div className={styles.tooltipContent}>
                                    <Text strong style={{ color: 'white' }}>{badge.badge_name}</Text>
                                    <br />
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                        {badge.challenge?.title}
                                    </Text>
                                </div>
                            }
                        >
                            <Link href={`/community-challenges/${badge.challenge_id}`}>
                                <Tag
                                    className={styles.badge}
                                    style={{ background: config.gradient }}
                                    icon={config.icon}
                                >
                                    {badge.badge_name}
                                </Tag>
                            </Link>
                        </Tooltip>
                    );
                })}
                {!showAll && remainingCount > 0 && (
                    <Tag className={styles.moreBadge}>
                        +{remainingCount} more
                    </Tag>
                )}
            </Space>
        </div>
    );
};

// Compact version for profile cards
export const ChallengeBadgesCompact: React.FC<{ userId: string }> = ({ userId }) => {
    const [badges, setBadges] = useState<ChallengeBadge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const { data } = await supabase
                    .from('challenge_badges')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('badge_type', 'winner')
                    .limit(3);

                setBadges(data || []);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, [userId]);

    if (loading || badges.length === 0) return null;

    return (
        <Space size={4}>
            {badges.map((badge) => (
                <Tooltip key={badge.id} title={badge.badge_name}>
                    <CrownOutlined style={{ color: '#faad14', fontSize: 16 }} />
                </Tooltip>
            ))}
        </Space>
    );
};

// Winner showcase for Hall of Creatives
export const ChallengeWinnerShowcase: React.FC<{ limit?: number }> = ({ limit = 6 }) => {
    const [winners, setWinners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWinners = async () => {
            try {
                const { data } = await supabase
                    .from('challenge_badges')
                    .select(`
                        *,
                        user:users!challenge_badges_user_id_fkey(
                            userId, firstName, lastName, userName, profileImage
                        ),
                        challenge:community_challenges!challenge_badges_challenge_id_fkey(
                            id, title
                        )
                    `)
                    .eq('badge_type', 'winner')
                    .order('awarded_at', { ascending: false })
                    .limit(limit);

                setWinners(data || []);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWinners();
    }, [limit]);

    if (loading) {
        return <Spin />;
    }

    if (winners.length === 0) {
        return null;
    }

    return (
        <div className={styles.winnerShowcase}>
            <div className={styles.showcaseHeader}>
                <TrophyOutlined className={styles.showcaseIcon} />
                <Text strong>Hall of Challenge Winners</Text>
            </div>
            <div className={styles.winnerGrid}>
                {winners.map((winner) => (
                    <Link
                        key={winner.id}
                        href={`/profile/${winner.user?.userId}`}
                        className={styles.winnerCard}
                    >
                        <Avatar
                            src={winner.user?.profileImage}
                            size={48}
                            className={styles.winnerAvatar}
                        />
                        <div className={styles.winnerInfo}>
                            <Text strong className={styles.winnerName}>
                                {winner.user?.userName || `${winner.user?.firstName} ${winner.user?.lastName}`}
                            </Text>
                            <Text type="secondary" className={styles.winnerChallenge}>
                                {winner.challenge?.title}
                            </Text>
                        </div>
                        <CrownOutlined className={styles.winnerCrown} />
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ChallengeBadges;