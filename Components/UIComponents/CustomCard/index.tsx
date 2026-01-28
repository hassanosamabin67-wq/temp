import { FC, ReactNode } from 'react'
import styles from './style.module.css'
import Image from 'next/image'

interface CustomCardProps {
    thumbnail?: string;
    mediaType?: 'image' | 'video';
    thumbnailBadge?: ReactNode;
    header?: ReactNode;
    headerBackground?: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    disableHover?: boolean;
}

const CustomCard: FC<CustomCardProps> = ({
    thumbnail,
    mediaType,
    thumbnailBadge,
    header,
    headerBackground = 'linear-gradient(135deg, #eff6ff 0%, #f3e8ff 100%)',
    children,
    className = '',
    onClick,
    disableHover = false
}) => {
    const getMediaType = (): 'image' | 'video' | null => {
        if (mediaType) return mediaType;
        if (!thumbnail) return null;

        const isVideo = thumbnail.match(/\.(mp4|webm|ogg)$/i);
        const isImage = thumbnail.match(/\.(jpg|jpeg|png|gif|webp)$/i);

        if (isVideo) return 'video';
        if (isImage) return 'image';
        return 'image';
    };

    const detectedMediaType = getMediaType();

    const renderThumbnail = () => {
        if (!thumbnail) return null;

        if (detectedMediaType === 'video') {
            return (
                <video
                    className={styles.thumbnailMedia}
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src={thumbnail} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        }

        return (
            <Image
                className={styles.thumbnailMedia}
                src={thumbnail}
                alt="card-thumbnail"
                width={400}
                height={400}
            />
        );
    };

    return (
        <div
            className={`${styles.card} ${disableHover ? styles.noHover : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {/* Thumbnail Section - for cards with images/videos */}

            {!header && (
                <div className={styles.cardThumbnail}>
                    {renderThumbnail()}
                    {thumbnailBadge && (thumbnailBadge)}
                </div>
            )}

            {/* Header Section - for cards without thumbnail (e.g., VisionaryCard) */}
            {!thumbnail && header && (
                <div
                    className={styles.cardHeader}
                    style={{ background: headerBackground }}
                >
                    {header}
                </div>
            )}

            {/* Content Section */}
            {children}
        </div>
    );
};

export default CustomCard;