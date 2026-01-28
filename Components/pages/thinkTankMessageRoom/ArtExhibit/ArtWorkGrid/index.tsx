import React, { useState } from 'react';
import styles from './style.module.css';
import ArtWorkCard from '../ArtWorkCard';
import { Artwork } from '../types';
import { Empty } from 'antd';
import ArtWorkDetailModal from '../ArtWorkDetailModal/index';
import { useNotification } from '@/Components/custom/custom-notification';

const ArtworkGrid = ({ artWork, roomId, hostId, forHost }: {
  artWork: Artwork[];
  roomId?: string;
  hostId: string;
  forHost: boolean;
}) => {
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { notify } = useNotification();

  const handleArtworkClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedArtwork(null);
  };

  const handleBuyNow = (artwork: Artwork) => {
    notify({ type: 'success', message: `Successfully purchased "${artwork.title}"!` });
    console.log('Purchase completed for artwork:', artwork);
  };

  // Filter artwork based on the tab type
  const filteredArtwork = forHost
    ? artWork.filter((artwork: Artwork) => artwork.host === artwork.createdBy)
    : artWork.filter((artwork: Artwork) => artwork.host !== artwork.createdBy);

  return (
    <div className={styles.artworkGridContainer}>
      <span className={styles.artworkGridTitle}>Artwork Collection</span>
      {filteredArtwork && filteredArtwork.length > 0 ? (
        <div className={styles.artworkGrid}>
          {filteredArtwork.map((artwork: Artwork, idx) => (
            <ArtWorkCard
              key={artwork.id ?? idx}
              img={artwork.imageUrl as any}
              title={artwork.title ?? ''}
              description={artwork.description ?? ''}
              price={artwork.price ?? 0}
              onClick={() => handleArtworkClick(artwork)}
              isSold={artwork.is_sold}
            />
          ))}
        </div>
      ) : (
        <div className={styles.artworkGridEmpty}>
          <Empty description={forHost ? "No Host Artwork Found" : "No Participant Artwork Found"} />
        </div>
      )}

      <ArtWorkDetailModal
        artwork={selectedArtwork}
        visible={modalVisible}
        onClose={handleModalClose}
        onBuyNow={handleBuyNow}
        roomId={roomId}
        hostId={hostId}
      />
    </div>
  );
};

export default ArtworkGrid;