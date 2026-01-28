import React, { FC, useEffect, useState, useMemo } from 'react';
import { Button, Modal, Typography, Spin, TabsProps, Tabs, Empty, Badge, Tooltip, Space, Collapse } from 'antd';
import './style.css'
import SidebarRight from './SidebarRight';
import ArtworkGrid from './ArtWorkGrid';
import { PlusOutlined, ReloadOutlined, FilterOutlined, SortAscendingOutlined, BarChartOutlined } from '@ant-design/icons';
import AddArtWorkModal from './AddArtWorkModal';
import { useArtwork } from '@/hooks/useArtwork';
import { useParams } from 'next/navigation';
import { supabase } from '@/config/supabase';
import { GrGallery } from "react-icons/gr";
import { Artwork } from './types';
import { useAppSelector } from '@/store';

const { Title, Text } = Typography;

interface ArtExhibitRoomProps {
  open: boolean;
  onCancel: () => void;
  hostId: string;
}

const ArtExhibitRoom: FC<ArtExhibitRoomProps> = ({ open, onCancel, hostId }) => {
  const [addArtWorkModalOpen, setAddArtWorkModalOpen] = useState(false);
  const [addHostArtWorkModalOpen, setHostAddArtWorkModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const params = useParams();
  const roomId = Array.isArray(params?.room) ? params.room[1] : undefined;
  const [artistInfo, setArtistInfo] = useState<any>(null);
  const profile = useAppSelector((state) => state.auth);
  const isHost = profile.profileId === hostId;

  const {
    hostArtWork,
    artwork,
    loading,
    error,
    addHostArtWork,
    addArtwork,
    refetchHostArtwork,
    refetchParticipantArtwork
  } = useArtwork({
    roomId,
    hostId,
    enabled: open && !!roomId
  });

  const handleAddHostArtwork = (newArtwork: Artwork) => {
    addHostArtWork(newArtwork);
    setActiveTab('1');
  };

  const handleAddArtwork = (newArtwork: Artwork) => {
    if (newArtwork.host === newArtwork.createdBy) {
      addHostArtWork(newArtwork);
      setActiveTab('1');
    } else {
      addArtwork(newArtwork);
      setActiveTab('2');
    }
  };

  const fetchArtistInfo = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('userId', hostId).maybeSingle();
      if (error) {
        console.error('Error fetching artist info:', error);
        return;
      }
      setArtistInfo(data);
    } catch (err) {
      console.error('Error fetching artist info:', err);
    }
  }

  useEffect(() => {
    fetchArtistInfo();
  }, [hostId]);

  const handleRefreshHostArtwork = async () => {
    await refetchHostArtwork();
  };

  const handleRefreshParticipantArtwork = async () => {
    await refetchParticipantArtwork();
  };

  const handleAddArtworkClick = () => {
    const currentUserId = profile.profileId;

    if (currentUserId === hostId) {
      setHostAddArtWorkModalOpen(true);
    } else {
      setAddArtWorkModalOpen(true);
    }
  };

  const hostArtworkTab = (
    <>
      <AddArtWorkModal
        open={addHostArtWorkModalOpen}
        onCancel={() => setHostAddArtWorkModalOpen(false)}
        setArtWork={handleAddHostArtwork}
        hostId={hostId}
      />
      <div className='art-exhibit-container'>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '70%' }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'red', padding: '20px' }}>
            {error}
            <Button onClick={handleRefreshHostArtwork} style={{ marginLeft: '10px' }}>
              Retry
            </Button>
          </div>
        ) : (
          <ArtworkGrid artWork={hostArtWork} roomId={roomId} hostId={hostId} forHost={true} />
        )}
        <SidebarRight roomId={roomId} hostId={hostId} artwork={hostArtWork} artistInfo={artistInfo} isHost={isHost} />
      </div>
    </>
  );

  const participantArtworkTab = (
    <>
      <AddArtWorkModal
        open={addArtWorkModalOpen}
        onCancel={() => setAddArtWorkModalOpen(false)}
        setArtWork={handleAddArtwork}
        hostId={hostId}
      />
      <div className='more-artworks'>
        <div className='more-artwork-div'>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0 }}>
              <Badge>
                <span>Participant Artwork</span>
              </Badge>
            </Title>
            <Button
              type="primary"
              icon={<GrGallery />}
              onClick={() => setAddArtWorkModalOpen(true)}
            >
              Upload Your Artwork
            </Button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: 'red', padding: '20px' }}>
              {error}
              <Button onClick={handleRefreshParticipantArtwork} style={{ marginLeft: '10px' }}>
                Retry
              </Button>
            </div>
          ) : (
            <ArtworkGrid artWork={artwork} roomId={roomId} hostId={hostId} forHost={false} />
          )}
        </div>
      </div>
    </>
  );

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <Badge>
          <span>Host Artwork</span>
        </Badge>
      ),
      children: hostArtworkTab
    },
    {
      key: '2',
      label: (
        <Badge>
          <span>Participant Artwork</span>
        </Badge>
      ),
      children: participantArtworkTab
    }
  ];

  return (
    <Modal
      title={
        <Title level={2} style={{ marginBottom: 0 }}>
          <div className='modal-header'>
            <div className='host-content'>
              <span className='gallery-title'>Art Work Gallery</span>
              <span className='host-name'>{artistInfo?.firstName} {artistInfo?.lastName}</span>
            </div>
            <div className='add-artwork-button'>
              {isHost && (<Button
                className='add-artwork-button-btn'
                variant='solid'
                color='red'
                icon={<PlusOutlined />}
                onClick={handleAddArtworkClick}
              >
                Add Artwork
              </Button>)}
            </div>
          </div>
        </Title>
      }
      open={open}
      onCancel={onCancel}
      className='art-exhibit-modal'
      footer={null}
      width="90%"
      style={{ maxWidth: '1200px' }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        indicator={{ size: (origin) => origin - 20, align: "center" }}
        centered
      />
    </Modal>
  );
};

export default ArtExhibitRoom;