import { FC } from 'react'
import Tab from '../../SoundScapeStreamComp/Tab';
import { useAppSelector } from '@/store';
import useLiveStreamData from '@/hooks/liveStream/useLiveStreamData';
import useElapsedTime from '@/hooks/liveStream/useElapsedTime';
import styles from './style.module.css'
import ChatBox from './ChatBox';
import FitnessStreamComponents from '../FitnessStreamComponents';
import WordflowStreamComponents from '../WordflowStreamComponents';
import OpenCollabStreamComponents from '../OpenCollabStreamComponents';

interface Props {
    roomId: string;
    roomType: string;
}

const StreamComponents: FC<Props> = ({ roomId, roomType }) => {
    const profile = useAppSelector((state) => state.auth);
    const { liveStreamId } = useAppSelector((state) => state.liveStream);
    const { participants, host, created_at } = useLiveStreamData(liveStreamId!, profile);
    const elapsedTime = useElapsedTime(created_at);

    if (!liveStreamId || !roomType) return null;

    return (
        <div className={styles.rightComp}>
            {roomType === "soundscape" && (
                <Tab
                    liveStreamId={liveStreamId}
                    participants={participants}
                    host={host}
                    profile={profile}
                    roomId={roomId}
                />
            )}
            {roomType === 'collab_fitness' && (
                <FitnessStreamComponents
                    roomId={roomId}
                    roomType="collab_fitness"
                    hostId={host.id}
                    participants={participants}
                    isHost={host.id === profile.profileId}
                    elapsedTime={elapsedTime}
                />
            )}
            {roomType === 'wordflow' && (
                <WordflowStreamComponents
                    roomId={roomId}
                    hostId={host.id}
                    isHost={host.id === profile.profileId}
                />
            )}
            {roomType === 'open_collab' && (
                <OpenCollabStreamComponents
                    roomId={roomId}
                    hostId={host.id}
                    isHost={host.id === profile.profileId}
                    participants={participants}
                />
            )}
            <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                    <span className={styles.chatTitle}>💬 Live Chat</span>
                </div>
                <div className={styles.chatContainer}>
                    <ChatBox hostId={host.id} roomId={roomId} roomType={roomType} />
                </div>
            </div>
        </div>
    )
}

export default StreamComponents