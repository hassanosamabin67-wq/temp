import React, { useState, useRef } from 'react';
import { Card, Button, Typography, Space, Divider } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, AudioOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Artwork } from '../types';
import styles from './style.module.css';

const { Title, Text } = Typography;

interface CommentaryPlayerProps {
  artwork: Artwork[];
}

const CommentaryPlayer: React.FC<CommentaryPlayerProps> = ({ artwork }) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const handleAudioPlayPause = (artworkId: string, commentaryUrl: string) => {
    const audioRef = audioRefs.current[artworkId];
    if (!audioRef) return;

    if (playingAudio === artworkId) {
      audioRef.pause();
      setPlayingAudio(null);
    } else {
      // Stop any other playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio]?.pause();
      }
      audioRef.play();
      setPlayingAudio(artworkId);
    }
  };

  const handleVideoPlayPause = (artworkId: string, commentaryUrl: string) => {
    const videoRef = videoRefs.current[artworkId];
    if (!videoRef) return;

    if (playingVideo === artworkId) {
      videoRef.pause();
      setPlayingVideo(null);
    } else {
      // Stop any other playing video
      if (playingVideo && videoRefs.current[playingVideo]) {
        videoRefs.current[playingVideo]?.pause();
      }
      videoRef.play();
      setPlayingVideo(artworkId);
    }
  };

  const handleAudioEnded = (artworkId: string) => {
    setPlayingAudio(null);
  };

  const handleVideoEnded = (artworkId: string) => {
    setPlayingVideo(null);
  };

  const artworksWithCommentary = artwork.filter(art => art.commentaryUrl);

  if (artworksWithCommentary.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <AudioOutlined />
          <Title level={5} style={{ margin: 0 }}>Artist Commentary</Title>
        </Space>
      }
      className={styles.commentaryCard}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {artworksWithCommentary.map((art) => {
          const isAudio = art.commentaryUrl?.includes('audio') || art.commentaryUrl?.includes('soundscape-audio');
          const isPlaying = isAudio ? playingAudio === art.id : playingVideo === art.id;

          return (
            <div key={art.id} className={`${styles.commentaryItem} ${isPlaying ? styles.commentaryItemPlaying : ''}`}>
              <div className={styles.artworkTitle}>
                <Text strong>{art.title}</Text>
              </div>

              <div className={styles.commentaryControls}>
                <Button
                  type="primary"
                  size="small"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={() => isAudio
                    ? handleAudioPlayPause(art.id, art.commentaryUrl!)
                    : handleVideoPlayPause(art.id, art.commentaryUrl!)
                  }
                >
                  {isPlaying ? 'Pause' : 'Play'} {isAudio ? 'Audio' : 'Video'}
                </Button>

                {isAudio ? (
                  <audio
                    ref={(el) => { audioRefs.current[art.id] = el; }}
                    src={art.commentaryUrl}
                    onEnded={() => handleAudioEnded(art.id)}
                    style={{ display: 'none' }}
                  />
                ) : (
                  <video
                    ref={(el) => { videoRefs.current[art.id] = el; }}
                    src={art.commentaryUrl}
                    onEnded={() => handleVideoEnded(art.id)}
                    style={{ display: 'none' }}
                  />
                )}

                <Text type="secondary" className={styles.commentaryType}>
                  {isAudio ? <AudioOutlined /> : <VideoCameraOutlined />}
                  {' '}{isAudio ? 'Audio' : 'Video'} Commentary
                </Text>
              </div>
            </div>
          );
        })}
      </Space>
    </Card>
  );
};

export default CommentaryPlayer; 