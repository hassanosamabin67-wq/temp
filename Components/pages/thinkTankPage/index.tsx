"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { Button, Modal, Typography } from 'antd'
import { collabRoomCategories } from '@/utils/constants/collabRoomCategories';
import "./style.css"
import "./collabrooms.css"
import { useAppSelector } from '@/store';
import Link from 'next/link';
import { RiErrorWarningFill } from "react-icons/ri";
import NdaModal from '@/Components/NdaModal';
import CollabRoomModal from './CollabRoomModal';
import SubscriptionModal from '@/Components/SubscriptionModal';
import useAllRoom from '@/hooks/collabRoom/useAllRoom';
import CollabRooms from './CollabRooms';
import useCollabRoomManager from '@/hooks/collabRoom/useCollabRoomManager';
import { IoMdAdd } from "react-icons/io";
import { useEventCollabStatus } from '@/hooks/collabRoom/useEventCollabStatus';
import { Search, Plus, Radio, Clock } from 'lucide-react';

const { Title } = Typography;

const ThinkTankPage = () => {
    const [visible, setVisible] = useState(false);
    const profile = useAppSelector((state) => state.auth);
    const [searchText, setSearchText] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);
    const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
    const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');

    const { confirmLoading, collabRooms, setCollabRooms, refreshRooms, totalParticipants, roomParticipants, isUserParticipant, isUserHost, isRoomFull } = useAllRoom({ profile });

    const [selectedAccessType, setSelectedAccessType] = useState<string | undefined>(undefined);

    const filteredRoom = collabRooms.filter((room: any) => {
        const matchesSearch = room.title?.toLowerCase().includes(searchText.toLowerCase().trim());
        const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory;
        const matchesSubcategory = !selectedSubcategory || room.subcategory === selectedSubcategory;
        const matchAccessType = !selectedAccessType ||
            room.accesstype?.toLowerCase() === selectedAccessType.toLowerCase();

        return matchesSearch && matchesCategory && matchesSubcategory && matchAccessType;
    });

    const { liveRooms, upcomingRooms } = useMemo(() => {
        const now = new Date();

        const getStart = (t: any) =>
            t?.recurring === 'One-Time Think Tank'
                ? (t.one_time_date ? new Date(t.one_time_date) : null)
                : (t.start_datetime ? new Date(t.start_datetime) : null);

        const getEnd = (t: any) => t?.end_datetime ? new Date(t.end_datetime) : null;

        const isLive = (t: any) => {
            const start = getStart(t);
            const end = getEnd(t);

            if (!start) return false;
            if (end && end < now) return false;

            return start <= now && (!end || now <= end);
        };

        const isUpcoming = (t: any) => {
            const start = getStart(t);
            if (!start) return false;
            return start > now;
        };

        const live: any[] = [];
        const upcoming: any[] = [];

        (filteredRoom || []).forEach((t: any) => {
            if (isLive(t)) live.push(t);
            else if (isUpcoming(t)) upcoming.push(t);
        });

        return { liveRooms: live, upcomingRooms: upcoming };
    }, [filteredRoom]);

    const {
        thinkTankHost,
        joiningTankId,
        selectedTankId,
        paymentAmount,
        showAgreementModal,
        setShowAgreementModal,
        joinFreeModal,
        setJoinFreeModal,
        showFreeModal,
        checked,
        setChecked,
        next,
        prev,
        currentStep,
        authModalVisible,
        setAuthModalVisible,
        authModal,
        handleJoin,
        isDonationBased,
        donationAmount,
        setDonationAmount,
        showSubscriptionModal,
        setShowSubscriptionModal,
        subscriptionRoomData,
        handleSubscriptionSuccess
    } = useCollabRoomManager({ filteredThinkTanks: filteredRoom })

    useEventCollabStatus({
        profileId: profile.profileId!,
    });

    const showModal = () => setVisible(true);
    const handleCancel = () => setVisible(false);

    const handleRoomCreated = (newThinkTank: any) => {
        if (setCollabRooms) {
            setCollabRooms((prevRooms: any) => {
                const currentRooms = Array.isArray(prevRooms) ? prevRooms : [prevRooms];
                return [newThinkTank, ...currentRooms];
            });
        } else if (refreshRooms) {
            refreshRooms();
        }
    };

    const displayRooms = activeTab === 'live' ? liveRooms : upcomingRooms;

    useEffect(() => {
        if (showAgreementModal || joinFreeModal) {
            setChecked(false);
        }
    }, [showAgreementModal, joinFreeModal]);

    return (
        <div className="collab-rooms-page">
            <CollabRoomModal
                visible={visible}
                onCancel={handleCancel}
                onSuccess={handleRoomCreated}
            />

            <Modal
                title={
                    <Title level={3}>
                        <div className='warning-icon-div'><RiErrorWarningFill className='warning-icon' /> <span>Please Login or Signup to join the Think tank</span></div>
                    </Title>
                }
                open={authModalVisible}
                onCancel={() => setAuthModalVisible(false)}
                footer={null}
                centered
                width={600}
            >
                <div className='warning-div'>
                    <Button type="primary" className='warning-btn'>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button className='warning-btn'>
                        <Link href="/signup">Signup</Link>
                    </Button>
                </div>
            </Modal>

            <NdaModal
                open={showAgreementModal}
                onClose={() => setShowAgreementModal(false)}
                profile={profile}
                thinkTankHost={thinkTankHost}
                checked={checked}
                setChecked={setChecked}
                showStepper={true}
                step={currentStep}
                onNextStep={next}
                onPrevStep={prev}
                paymentAmount={paymentAmount}
                selectedTankId={selectedTankId}
                isDonationBased={isDonationBased}
                donationAmount={donationAmount}
                setDonationAmount={setDonationAmount}
            />

            <NdaModal
                open={joinFreeModal}
                onClose={() => setJoinFreeModal(false)}
                profile={profile}
                thinkTankHost={thinkTankHost}
                checked={checked}
                setChecked={setChecked}
                showJoinButton={true}
                loading={joiningTankId === selectedTankId}
                onConfirm={() => showFreeModal(selectedTankId, profile.profileId)}
            />

            {subscriptionRoomData && (
                <SubscriptionModal
                    visible={showSubscriptionModal}
                    onCancel={() => setShowSubscriptionModal(false)}
                    roomId={subscriptionRoomData.roomId}
                    roomTitle={subscriptionRoomData.roomTitle}
                    subscriptionPrice={subscriptionRoomData.subscriptionPrice}
                    hostName={subscriptionRoomData.hostName}
                    hostId={subscriptionRoomData.hostId}
                    onSubscriptionSuccess={handleSubscriptionSuccess}
                />
            )}

            {/* Hero Section */}
            <div className="collab-hero">
                <div className="collab-hero-background" />
                <div className="collab-hero-blobs">
                    <div className="collab-hero-blob-1" />
                    <div className="collab-hero-blob-2" />
                    <div className="collab-hero-blob-3" />
                </div>
                <div className="collab-hero-content">
                    <h1 className="collab-hero-title">Explore Collab Rooms</h1>
                    <p className="collab-hero-subtitle">
                        Discover live and upcoming sessions hosted by visionaries across music, art, gaming, and more.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="collab-main">
                <div className="collab-container">
                    {/* Search and Filters */}
                    <div className="collab-search-section">
                        <div className="collab-search-bar">
                            <Search className="collab-search-icon" />
                            <input
                                type="text"
                                placeholder="Search collab rooms..."
                                className="collab-search-input"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        {profile?.profileId && (
                            <button className="collab-create-btn" onClick={showModal}>
                                <Plus className="collab-btn-icon" />
                                Create Room
                            </button>
                        )}
                    </div>

                    <div className="collab-filters">
                        <select
                            className="collab-filter-select"
                            value={selectedCategory === 'all' ? '' : selectedCategory || ''}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value || 'all');
                                setSelectedSubcategory(undefined);
                            }}
                        >
                            <option value="">All Categories</option>
                            {collabRoomCategories.categories.map((category) => (
                                <option key={category.name} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="collab-filter-select"
                            disabled={!selectedCategory || selectedCategory === 'all'}
                            value={selectedSubcategory || ''}
                            onChange={(e) => setSelectedSubcategory(e.target.value || undefined)}
                        >
                            <option value="">All Subcategories</option>
                            {collabRoomCategories.categories
                                .find(cat => cat.name === selectedCategory)
                                ?.subcategories.map((subcategory, index) => (
                                    <option key={`${selectedCategory}-${index}`} value={subcategory}>
                                        {subcategory}
                                    </option>
                                ))}
                        </select>

                        <select
                            className="collab-filter-select"
                            value={selectedAccessType || ''}
                            onChange={(e) => setSelectedAccessType(e.target.value || undefined)}
                        >
                            <option value="">All Access Types</option>
                            <option value="Open">Open</option>
                            <option value="Private">Private</option>
                            <option value="Limited">Limited</option>
                        </select>
                    </div>

                    {/* Tabs */}
                    <div className="collab-tabs">
                        <button
                            className={`collab-tab ${activeTab === 'live' ? 'active' : ''}`}
                            onClick={() => setActiveTab('live')}
                        >
                            <Radio className="collab-tab-icon" />
                            Live Now
                        </button>
                        <button
                            className={`collab-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            <Clock className="collab-tab-icon" />
                            Upcoming
                        </button>
                    </div>

                    {/* Rooms Grid */}
                    <CollabRooms
                        confirmLoading={confirmLoading}
                        filteredThinkTanks={displayRooms}
                        handleJoin={handleJoin}
                        joiningTankId={joiningTankId}
                        addRoom={showModal}
                        notFromInbox={true}
                        totalParticipants={totalParticipants}
                        roomParticipants={roomParticipants}
                        isUserParticipant={isUserParticipant}
                        isUserHost={isUserHost}
                        isRoomFull={isRoomFull}
                    />
                </div>
            </div>
        </div>
    )
}

export default ThinkTankPage;