import React, { FC, useEffect, useState } from 'react';
import CollabRoomCard from '@/Components/custom/collab-room-card';
import { useAppSelector } from '@/store';
import { Spin, Pagination } from 'antd';
import style from './style.module.css';
import { Plus } from 'lucide-react';
import '../collabrooms.css';

interface CollabRoomProps {
    confirmLoading?: boolean;
    filteredThinkTanks: any;
    handleJoin: (id: string, profileId: string) => void;
    joiningTankId: string | null;
    addRoom?: () => void;
    notFromInbox?: boolean;
    totalParticipants?: any;
    roomParticipants?: any;
    isUserParticipant?: any,
    isUserHost?: any,
    isRoomFull?: any,
}

const CollabRooms: FC<CollabRoomProps> = ({
    confirmLoading,
    filteredThinkTanks,
    handleJoin,
    joiningTankId,
    addRoom,
    notFromInbox,
    totalParticipants,
    roomParticipants,
    isUserParticipant,
    isUserHost,
    isRoomFull,
}) => {
    const profile = useAppSelector((state) => state.auth);

    // pagination
    const pageSize = 6;
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        // reset to first page only when the length of the array changes (new rooms added/removed)
        // not when individual room data is updated (like participant counts)
        setCurrentPage(1);
    }, [filteredThinkTanks?.length]);

    const emptyContent = () => (
        <div className="collab-empty-state">
            <div className="collab-empty-icon">🎨</div>
            <h3 className="collab-empty-title">No Collab Rooms here yet</h3>
            {notFromInbox && (
                <>
                    <p className="collab-empty-text">Check back soon or explore another category!</p>
                    <button className="collab-empty-btn" onClick={addRoom}>
                        <Plus size={20} />
                        Create a Collab Room
                    </button>
                </>
            )}
        </div>
    )

    if (confirmLoading) {
        return (
            <div>
                <Spin size="large" />
            </div>
        );
    }

    if (!filteredThinkTanks) {
        return (
            emptyContent()
        );
    }

    const isArray = Array.isArray(filteredThinkTanks);

    // For arrays, compute items to display on current page
    const paginatedItems = isArray
        ? filteredThinkTanks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : null;

    return (
        <>
            {isArray ? (
                filteredThinkTanks.length > 0 ? (
                    <>
                        <div className="collab-rooms-grid">
                            {paginatedItems?.map((tank: any) => {
                                const truncatedDescription =
                                    tank?.description?.length > 100
                                        ? tank.description.slice(0, 100) + '......'
                                        : tank?.description;

                                const currentUserId = profile.profileId;

                                const hostId = tank.host;
                                const userIsParticipant = isUserParticipant ? isUserParticipant(tank.id, currentUserId) : false;
                                const userIsHost = isUserHost ? isUserHost(currentUserId, hostId) : false;
                                const roomFull = isRoomFull ? isRoomFull(tank.id, tank.available_spots, hostId) : false;

                                const disableJoinBtn = roomFull && !userIsParticipant && !userIsHost;

                                const participantCount = roomParticipants && typeof roomParticipants === 'function' 
                                    ? roomParticipants(tank.id) 
                                    : (totalParticipants && typeof totalParticipants === 'function' 
                                        ? totalParticipants(tank.id) 
                                        : 0);

                                return (
                                    <CollabRoomCard
                                        key={tank.id}
                                        title={tank.title}
                                        startDate={tank.start_datetime}
                                        endDate={tank.end_datetime}
                                        truncatedDescription={truncatedDescription}
                                        joinRoom={() => handleJoin(tank.id, profile.profileId!)}
                                        loading={joiningTankId === tank.id}
                                        host={tank.host}
                                        requestedBoost={tank.requested_boosting}
                                        profileId={profile.profileId!}
                                        collabRoomType={tank.room_type}
                                        file_url={tank.file_url}
                                        recurringType={tank.recurring}
                                        oneTimeDate={tank.one_time_date}
                                        priceType={tank.pricingtype}
                                        price={tank.price}
                                        hostData={tank.host_data}
                                        startTime={tank.start_time}
                                        nextSessionDate={tank.next_session_date}
                                        nextSessionTime={tank.next_session_time}
                                        totalRooms={filteredThinkTanks.length}
                                        existingRoomData={tank}
                                        disableJoinBtn={disableJoinBtn}
                                        userIsParticipant={userIsParticipant}
                                        userIsHost={userIsHost}
                                        currentParticipants={participantCount}
                                        availableSpots={tank.available_spots}
                                    />
                                );
                            })}
                        </div>

                        {/* Pagination control */}
                        {filteredThinkTanks.length > pageSize && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={filteredThinkTanks.length}
                                    onChange={(page) => setCurrentPage(page)}
                                    showSizeChanger={false}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    emptyContent()
                )
            ) : (
                (() => {
                    const truncatedDescription =
                        filteredThinkTanks?.description?.length > 100
                            ? filteredThinkTanks.description.slice(0, 100) + '......'
                            : filteredThinkTanks?.description;
                    
                    const participantCount = roomParticipants && typeof roomParticipants === 'function' 
                        ? roomParticipants(filteredThinkTanks.id) 
                        : (totalParticipants && typeof totalParticipants === 'function' 
                            ? totalParticipants(filteredThinkTanks.id) 
                            : 0);

                    return (
                        <div className="collab-rooms-grid">
                            <CollabRoomCard
                                key={filteredThinkTanks.id}
                                title={filteredThinkTanks.title}
                                startDate={filteredThinkTanks.start_datetime}
                                endDate={filteredThinkTanks.end_datetime}
                                truncatedDescription={truncatedDescription}
                                joinRoom={() => handleJoin(filteredThinkTanks.id, profile.profileId!)}
                                loading={joiningTankId === filteredThinkTanks.id}
                                host={filteredThinkTanks.host}
                                requestedBoost={filteredThinkTanks.requested_boosting}
                                profileId={profile.profileId!}
                                collabRoomType={filteredThinkTanks.room_type}
                                file_url={filteredThinkTanks.file_url}
                                recurringType={filteredThinkTanks.recurring}
                                oneTimeDate={filteredThinkTanks.one_time_date}
                                priceType={filteredThinkTanks.pricingtype}
                                price={filteredThinkTanks.price}
                                hostData={filteredThinkTanks.host_data}
                                startTime={filteredThinkTanks.start_time}
                                nextSessionDate={filteredThinkTanks.next_session_date}
                                nextSessionTime={filteredThinkTanks.next_session_time}
                                totalRooms={filteredThinkTanks.length}
                                existingRoomData={filteredThinkTanks}
                                disableJoinBtn={filteredThinkTanks.available_spots === totalParticipants}
                                currentParticipants={participantCount}
                                availableSpots={filteredThinkTanks.available_spots}
                            />
                        </div>
                    );
                })()
            )}
        </>
    );
};

export default CollabRooms;