'use client'
import React, { FC, useState } from 'react';
import { Rate, Spin } from 'antd';
import { MapPin, Heart, Star, Eye } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { recordProfileStat } from '@/utils/profileStats';
import { useAppSelector } from '@/store';
import { BASE_URL } from '@/utils/constants/navigations';
import { getBrandedNameParts } from '@/lib/brandName';
import '../style.css';

interface Visionary {
    visionary: any;
    isFavorite: boolean;
    addFavorite: (visionary: any) => void;
    addLoading: string | null;
    viewMode?: 'grid' | 'list';
}

const VisionaryCard: FC<Visionary> = ({ visionary, isFavorite, addFavorite, addLoading, viewMode = 'grid' }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const profile = useAppSelector((state) => state.auth);
    const { prefix, name } = getBrandedNameParts(visionary.firstName, visionary.lastName);

    const handleViewProfile = () => {
        try {
            setLoading(true);
            recordProfileStat({
                profileId: profile.profileId!,
                userId: visionary.userId,
                type: "click"
            });
            router.push(`/${BASE_URL}?visionary=${visionary.userId}`);
        } catch (error) {
            console.error("Unexpected Error: ", error)
        }
    };

    const fullName = `${prefix}${name}`;
    const displayName = fullName.length > 25 ? fullName.slice(0, 25) + '...' : fullName;
    const displayTitle = visionary?.title && visionary.title.length > 35 ? visionary.title.slice(0, 35) + "..." : (visionary?.title || 'Visionary');
    const description = visionary?.overview || 'No description available';
    // Truncate description based on view mode
    const truncatedDescription = viewMode === 'list' 
        ? (description.length > 150 ? description.slice(0, 150) + '...' : description)
        : (description.length > 120 ? description.slice(0, 120) + '...' : description);

    return (
        <div className="visionary-card">
            <button
                onClick={() => addFavorite(visionary)}
                className="visionary-favorite-btn"
                disabled={addLoading === visionary.userId}
                title={isFavorite ? "In My Network" : "Add to My Network"}
            >
                {addLoading === visionary.userId ? (
                    <Spin size="small" />
                ) : (
                    <Heart
                        size={20}
                        className={isFavorite ? 'filled' : ''}
                        style={isFavorite ? { fill: '#ef4444', color: '#ef4444' } : {}}
                    />
                )}
            </button>

            <div className="visionary-avatar-wrapper">
                {visionary.profileImage ? (
                    <Image
                        src={visionary.profileImage}
                        alt={fullName}
                        className="visionary-avatar"
                        width={80}
                        height={80}
                    />
                ) : (
                    <div className="visionary-avatar" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                    }}>
                        {visionary.firstName?.[0] || 'V'}
                    </div>
                )}
            </div>

            <div className="visionary-info">
                <h3 className="visionary-name">
                    <span style={{ color: "#F9B100" }}>{prefix}</span>
                    {name?.length > 20 ? name.slice(0, 20) + '...' : name}
                </h3>
                <p className="visionary-title">{displayTitle}</p>
                <div className="visionary-location">
                    <MapPin size={14} />
                    <span>{visionary.country || 'Location not specified'}</span>
                </div>
            </div>

            <p className="visionary-description">{truncatedDescription}</p>

            <div className="visionary-skills">
                <span className="visionary-skill-tag">UI/UX Design</span>
                <span className="visionary-skill-tag">+3 more</span>
            </div>

            {visionary.overall_rating && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                }}>
                    <Star size={16} className="collab-room-star" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                    <span>{visionary.overall_rating}</span>
                </div>
            )}

            <button
                className="visionary-profile-btn"
                onClick={handleViewProfile}
                disabled={loading}
            >
                {loading ? 'Loading...' : 'View Profile'}
            </button>
        </div>
    )
}

export default VisionaryCard