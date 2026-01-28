import React, { FC, useState } from 'react'
import { Button } from 'antd'
import dayjs from 'dayjs';
import Image from 'next/image';
import '../../pages/thinkTankPage/collabrooms.css';
import { LuCalendarDays } from "react-icons/lu";
import { LuClock4 } from "react-icons/lu";
import { Users, Star } from 'lucide-react';
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'
import { EditOutlined } from '@ant-design/icons';
import CollabRoomModal from '@/Components/pages/thinkTankPage/CollabRoomModal';

dayjs.extend(relativeTime)
dayjs.extend(calendar)

interface CollabRoomData {
    id?: string;
    title: string;
    description: string;
    start_datetime?: string;
    end_datetime?: string;
    accesstype: string;
    category: string;
    subcategory: string;
    recurring: string;
    pricingtype?: string;
    participant_limit?: number;
    price?: number;
    room_type: string;
    file_url?: string;
    one_time_date?: string;
    start_time?: string;
    media_type?: string;
    host?: string;
    host_data?: any;
    available_spots: number;
}

interface cardProps {
    title: string;
    startDate: any;
    endDate: any;
    truncatedDescription: string;
    joinRoom: () => void;
    loading: any;
    host: any;
    requestedBoost: number;
    profileId: string;
    collabRoomType: string;
    file_url: string;
    recurringType: string;
    oneTimeDate: any;
    priceType: string;
    price?: number;
    hostData: { userId: string; profileImage: string; name: string; }
    startTime?: string;
    nextSessionDate?: string;
    nextSessionTime?: string;
    totalRooms: number;
    existingRoomData: CollabRoomData;
    disableJoinBtn: boolean;
    userIsParticipant?: any
    userIsHost?: any
    currentParticipants?: number
    availableSpots?: number
}

const CollabRoomCard: FC<cardProps> = ({
    title,
    startDate,
    endDate,
    truncatedDescription,
    joinRoom,
    loading,
    host,
    requestedBoost,
    profileId,
    collabRoomType,
    file_url,
    recurringType,
    oneTimeDate,
    priceType,
    price,
    hostData,
    startTime,
    nextSessionDate,
    nextSessionTime,
    totalRooms,
    existingRoomData,
    disableJoinBtn,
    userIsParticipant,
    userIsHost,
    currentParticipants,
    availableSpots
}) => {
    const [visible, setVisible] = useState(false)
    const [localRoomData, setLocalRoomData] = useState<CollabRoomData>(existingRoomData);

    const now = new Date();

    // Use local state data instead of props directly
    const currentTitle = localRoomData.title || title;
    const currentDescription = localRoomData.description || truncatedDescription;
    const currentFileUrl = localRoomData.file_url || file_url;
    const currentPriceType = localRoomData.pricingtype || priceType;
    const currentPrice = localRoomData.price || price;
    const currentRecurringType = localRoomData.recurring || recurringType;
    const currentOneTimeDate = localRoomData.one_time_date || oneTimeDate;
    const currentStartDate = localRoomData.start_datetime || startDate;
    const currentEndDate = localRoomData.end_datetime || endDate;
    const currentStartTime = localRoomData.start_time || startTime;

    const handleRoomUpdate = (updatedRoom: CollabRoomData) => {
        setLocalRoomData(updatedRoom);
    };

    const getStart = () => {
        if (currentRecurringType === 'One-Time Think Tank') {
            return currentOneTimeDate ? new Date(currentOneTimeDate) : null;
        }
        return currentStartDate ? new Date(currentStartDate) : null;
    };

    const getEnd = () => (currentEndDate ? new Date(currentEndDate) : null);

    const start = getStart();
    const end = getEnd();

    let status: 'live' | 'upcoming' | 'ended' = 'ended';
    if (start) {
        if (start > now) status = 'upcoming';
        else if (!end || now <= end) status = 'live';
    }

    const statusText = status === 'live' ? 'Live Now' : status === 'upcoming' ? 'Upcoming' : 'Ended';

    const getPriceType = (type: string) => {
        switch (type) {
            case 'Free': return 'Free';
            case 'One-Time Fee': return currentPrice ? `$${currentPrice}` : 'Premium';
            case 'Recurring Fee': return currentPrice ? `$${currentPrice}` : 'Premium';
            case 'Donation-Based': return currentPrice ? `$${currentPrice}` : 'Donation Based';
            case 'Subscription': return currentPrice ? `$${currentPrice}/month` : 'Subscription';
            default: return 'Free';
        }
    };

    const getParticipantsCount = () => {
        return currentParticipants || 0;
    };

    const getMaxParticipants = () => {
        const max = availableSpots || localRoomData.available_spots || 0;
        return max > 0 ? max : 30; // Default to 30 if not specified
    };

    const getRating = () => {
        // You can add rating logic here if available in the data
        return 4.8; // Placeholder
    };

    const renderThumbnail = () => {
        if (!currentFileUrl) {
            return <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />;
        }
        const isVideo = currentFileUrl.match(/\.(mp4|webm|ogg)$/i);
        const isImage = currentFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        if (isVideo) {
            return (
                <video style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted playsInline>
                    <source src={currentFileUrl} type="video/mp4" />
                </video>
            );
        } else if (isImage) {
            return (
                <Image 
                    src={currentFileUrl} 
                    alt={currentTitle} 
                    width={400} 
                    height={192}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            );
        }
        return null;
    };

    return (
        <>
            <CollabRoomModal
                visible={visible}
                onCancel={() => setVisible(false)}
                mode="edit"
                editData={localRoomData}
                onSuccess={handleRoomUpdate}
            />
            <div className="collab-room-card">
                <div className="collab-room-thumbnail">
                    {renderThumbnail()}
                    {status === 'live' && (
                        <div className="collab-room-live-badge">
                            <div className="collab-room-live-pulse" />
                            LIVE
                        </div>
                    )}
                    <div className="collab-room-category">{existingRoomData.category || 'General'}</div>
                </div>
                <div className="collab-room-content">
                    <h3 className="collab-room-title">{currentTitle}</h3>
                    <div className="collab-room-host">
                        {hostData?.profileImage ? (
                            <Image 
                                src={hostData.profileImage} 
                                alt={hostData.name || 'Host'} 
                                className="collab-room-host-avatar"
                                width={32}
                                height={32}
                            />
                        ) : (
                            <div className="collab-room-host-avatar" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                        )}
                        <span className="collab-room-host-name">{hostData?.name || 'Unknown'}</span>
                    </div>
                    <div className="collab-room-meta">
                        <div className="collab-room-participants">
                            <Users size={16} />
                            <span>{getParticipantsCount()}/{getMaxParticipants()}</span>
                        </div>
                        <div className="collab-room-rating">
                            <Star size={16} className="collab-room-star" />
                            <span>{getRating()}</span>
                        </div>
                    </div>
                    <button 
                        className="collab-room-join-btn"
                        onClick={joinRoom}
                        disabled={disableJoinBtn || loading}
                    >
                        {loading ? 'Joining...' :
                            userIsParticipant ? 'Enter' :
                                userIsHost ? 'Enter' :
                                    disableJoinBtn ? 'Full' :
                                        status === 'live' ? 'Join Now' :
                                            status === 'upcoming' ? 'Set Reminder' :
                                                currentPriceType === 'Subscription' ? 'Subscribe Now' : 'Join'}
                    </button>
                    {host === profileId && (
                        <Button 
                            style={{ marginTop: '0.5rem', width: '100%' }}
                            icon={<EditOutlined />} 
                            onClick={() => setVisible(true)}
                        >
                            Edit Room
                        </Button>
                    )}
                </div>
            </div>
            {/* <div className={`${styles.collabCard} ${totalRooms > 3 ? "" : styles.collabCardLess}`}>
                <div className={styles.cardThumbnail}>
                    {roomThumbnail()}
                    <div className={`${styles.statusBadge} ${status === 'live' ? styles.live : status === 'upcoming' ? styles.upcoming : styles.ended}`}>
                        {statusText}
                    </div>
                </div>
                <div className={styles.cardContent}>
                    <div>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>{currentTitle}</span>
                            {currentPriceType === 'Subscription' && (
                                <Tag color="purple" className={styles.subscriptionTag}>
                                    ■ Subscription Room – ${currentPrice}/month
                                </Tag>
                            )}
                            {host === profileId && requestedBoost && (
                                <Tag color="gold" className={styles.boostTag}>
                                    🚀 {typeof requestedBoost === "number" && `${requestedBoost}x`}
                                </Tag>
                            )}
                        </div>
                        <div className={styles.hostInfo}>
                            {hostData?.profileImage ? (
                                <Image className={styles.hostAvatar} src={hostData?.profileImage} alt='collab-host-img' width={400} height={400} />
                            ) : (
                                <div className={styles.hostAvatar} />
                            )}
                            <span className={styles.hostName}>Hosted by K.{hostData?.name || "Unknown"}</span>
                        </div>
                    </div>

                    <div className={styles.cardMeta}>
                        {currentOneTimeDate && (
                            <div className={styles.oneTimeDate}>
                                <div className={styles.oneTimeDate}>
                                    <span className={styles.calendarIcon}><LuCalendarDays /></span>
                                    <span>
                                        {dayjs(currentOneTimeDate).calendar(null, {
                                            sameDay: '[Today]',
                                            nextDay: '[Tomorrow]',
                                            nextWeek: 'dddd',
                                            lastDay: '[Yesterday]',
                                            lastWeek: '[Last] dddd',
                                            sameElse: 'MMM D, YYYY'
                                        })}
                                    </span>
                                </div>
                                <div className={styles.oneTimeDate}>
                                    <span className={styles.calendarIcon}><LuClock4 /></span>
                                    {nextSessionDate ? (
                                        <span>{dayjs(nextSessionTime).format('h:mm A')}</span>
                                    ) : (
                                        <span>{dayjs(currentStartTime).format('h:mm A')}</span>
                                    )}
                                </div>
                            </div>
                        )}
                        {currentStartDate && (
                            <div>
                                <div className={styles.cardDate}>
                                    <span className={styles.calendarIcon}><LuCalendarDays /></span>
                                    <span>{dayjs(currentStartDate).format("MMM D, YYYY")}</span>
                                    <span>{dayjs(currentEndDate).format("MMM D, YYYY")}</span>
                                </div>
                                <div className={styles.oneTimeDate}>
                                    <span className={styles.calendarIcon}><LuClock4 /></span>
                                    {nextSessionDate ? (
                                        <div className={styles.nextDateContainer}>
                                            <span>
                                                <strong>Next Session: </strong>
                                                {dayjs(nextSessionDate).calendar(null, {
                                                    sameDay: '[Today]',
                                                    nextDay: '[Tomorrow]',
                                                    nextWeek: 'dddd',
                                                    lastDay: '[Yesterday]',
                                                    lastWeek: '[Last] dddd',
                                                    sameElse: 'MMM D, YYYY'
                                                })}
                                            </span>
                                            <span> {dayjs(nextSessionTime).format('h:mm A')}</span>
                                        </div>
                                    ) : (
                                        <span>{dayjs(currentStartTime).format('h:mm A')}</span>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className={`${styles.priceBadge} ${getPriceType(currentPriceType) === 'Free' ? styles.priceFree : currentPriceType === 'Donation-Based' ? styles.priceDonation : styles.pricePremium}`}>
                            {getPriceType(currentPriceType)}
                        </div>
                    </div >

            {(host === profileId) && (availableSpots || localRoomData.available_spots) && (
                <div className={styles.capacityIndicator}>
                    <div className={styles.capacityInfo}>
                        <span className={styles.capacityText}>
                            👥 {currentParticipants || 0}/{availableSpots || localRoomData.available_spots} participants
                        </span>
                        {(currentParticipants || 0) >= (availableSpots || localRoomData.available_spots) && (
                            <span className={styles.fullBadge}>FULL</span>
                        )}
                        {(availableSpots || localRoomData.available_spots) === 300 && (
                            <span className={styles.maxCapacityBadge}>MAX CAPACITY</span>
                        )}
                    </div>
                </div>
            )}

            <p className={styles.cardDescription}>{truncatedDescription}</p>
            <div className={styles.cardFooter}>
                <ActionButton
                    disabled={disableJoinBtn}
                    className={styles.joinBtn}
                    loading={loading}
                    onClick={joinRoom}
                >
                    {loading ? 'Joining...' :
                        userIsParticipant ? 'Enter' :
                            userIsHost ? 'Enter' :
                                disableJoinBtn ? 'Full' :
                                    currentPriceType === 'Subscription' ? 'Subscribe Now' : 'Join'}
                </ActionButton>
                {host === profileId && (<Button className={styles.editRoomBtn} icon={<EditOutlined />} title='Edit Room' onClick={() => setVisible(true)} />)}
            </div>
        </div >
            </div > */}
        </>
    )
}

export default CollabRoomCard