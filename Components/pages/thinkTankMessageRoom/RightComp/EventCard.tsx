import { Button } from 'antd';
import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useState } from 'react';
import { LuUsers, LuClock } from "react-icons/lu";
import { MdOutlineCalendarToday } from "react-icons/md";

interface eventCardProps {
    title: string;
    description: string;
    date: string;
    timeRange: string;
    priceType: string;
    price: number | null | undefined;
    mediaUrl: string;
    isVideo: boolean;
    isTimeReached: boolean;
    buttonText: string;
    buttonLoading: boolean;
    onPress: () => void;
    participants: number;
    eventId: string;
    country: string;
}

const EventCard: FC<eventCardProps> = ({ title, description, date, timeRange, priceType, price, mediaUrl, isVideo, isTimeReached, buttonText, buttonLoading, onPress, participants, eventId, country }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const truncateTitle = (title: string, maxLength = 80) => {
        return title.length > maxLength ? title.slice(0, maxLength) + '...' : title;
    };

    const truncateDescription = (description: string, maxLines = 3) => {
        const words = description.split(' ');
        const maxWords = maxLines * 12;
        if (words.length > maxWords) {
            return words.slice(0, maxWords).join(' ') + '...';
        }
        return description;
    };

    const renderPricingBadge = (pricing: { type: string; amount: null; } | { type: string; amount: number; } | { type: string; amount?: undefined; }) => {
        const baseStyle: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid',
        };

        switch (pricing.type) {
            case 'free':
                return (
                    <span style={{
                        ...baseStyle,
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        borderColor: '#a7f3d0',
                    }}>
                        Free Entry
                    </span>
                );
            case 'paid':
                return (
                    <span style={{
                        ...baseStyle,
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderColor: '#bfdbfe',
                    }}>
                        Entry: ${pricing.amount} USD
                    </span>
                );
            case 'donation':
                return (
                    <span style={{
                        ...baseStyle,
                        backgroundColor: '#ffedd5',
                        color: '#9a3412',
                        borderColor: '#fdba74',
                    }}>
                        Pay What You Want
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        // <div style={{
        //     maxWidth: '64rem',
        //     margin: '0 auto',
        //     padding: '1.5rem',
        //     backgroundColor: '#f9fafb',
        //     minHeight: '100vh'
        // }}>
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: 8 }}>
            <div
                style={{
                    backgroundColor: '#7b869117',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    border: '1px solid #94b8ff',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    opacity: isTimeReached ? 0.6 : 1
                }}
            >
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {/* Media Thumbnail */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '16 / 9',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.5rem',
                                overflow: 'hidden'
                            }}>
                                {isVideo ? (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)'
                                    }}>
                                        <div style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '9999px',
                                            padding: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <video controls width={250} style={{ marginTop: 10 }}>
                                                <source src={mediaUrl} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    </div>
                                ) : (
                                    <Image
                                        width={400}
                                        height={400}
                                        src={mediaUrl}
                                        alt={title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }} />

                                )}
                            </div>
                        </div>

                        {/* Event Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Title */}
                            <Link href={`/event-detail/${eventId}`}>
                                <span className='title'>
                                    {truncateTitle(title)}
                                </span>
                            </Link>

                            {/* Date & Time */}
                            <div style={{
                                display: 'flex',
                                flexDirection: "column",
                                gap: '4px',
                                marginBottom: '0.75rem',
                                fontSize: '12px',
                                color: '#ffffffff'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: 11 }}>
                                    <MdOutlineCalendarToday style={{ width: '1rem', height: '1rem' }} />
                                    <span>{dayjs(date).format('MMMM D YYYY')}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: 11 }}>
                                    <LuClock style={{ width: '1rem', height: '1rem' }} />
                                    <span>{timeRange} ({country})</span>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div style={{ marginBottom: '1rem' }}>
                                {renderPricingBadge({ type: priceType, amount: price })}
                            </div>

                            {/* Description Preview */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{
                                    color: '#ffffffff',
                                    marginBottom: '0.5rem',
                                    fontSize: 12
                                }}>
                                    {isExpanded ? description : truncateDescription(description)}
                                </p>
                                {description.length > 180 && (
                                    <Button
                                        onClick={() => setIsExpanded(prev => !prev)}
                                        aria-expanded={isExpanded}
                                        style={{
                                        color: '#2563eb',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}>
                                        {isExpanded ? 'Read less' : 'Read more'}
                                    </Button>
                                )}
                            </div>

                            {/* Join Button */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <Button
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: 500,
                                        transition: 'all 0.3s ease',
                                        backgroundColor: isTimeReached ? '#f3f4f6' : '#2563eb',
                                        color: isTimeReached ? '#6b7280' : '#ffffffff',
                                        cursor: isTimeReached ? 'not-allowed' : 'pointer',
                                        border: 'none'
                                    }}
                                    disabled={isTimeReached}
                                    loading={buttonLoading}
                                    onClick={onPress}
                                >
                                    {buttonText}
                                </Button>
                                {participants > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '12px',
                                        color: '#ffffffff'
                                    }}>
                                        <LuUsers style={{ width: '1rem', height: '1rem' }} />
                                        <span>{participants} attending</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        // </div>
    );
};

export default EventCard;