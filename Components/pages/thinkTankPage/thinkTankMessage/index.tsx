"use client"
import { supabase } from '@/config/supabase';
import { Spin } from 'antd';
import React, { useEffect, useState } from 'react'
import '../style.css'
import LeftComponent from '../../thinkTankMessageRoom/LeftComp'
import CenterComponent from '../../thinkTankMessageRoom/CenterComp'
import RightComponent from '../../thinkTankMessageRoom/RightComp'
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import soundScapeBg from '@/public/assets/img/soundscape_background.svg';
import artExhibitBg from '@/public/assets/img/art_exhibit_dark_background.svg'
import thinkTankBg from '@/public/assets/img/think_tank_background.png'
import collabFitnessBg from '@/public/assets/img/collab_fitness_background.svg'
import Image from 'next/image';
import StreamComponents from '../../thinkTankMessageRoom/StreamComponents';
import { HiOutlineUserGroup, HiOutlineChatBubbleLeftRight, HiOutlineInformationCircle, HiOutlineXMark } from 'react-icons/hi2';

type MobilePanel = 'left' | 'center' | 'right';

const ThinkTankMessageRoom = ({ roomId }: any) => {
    const [thinkTank, setThinkTank] = useState<any>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const Id = roomId[1]
    const conversationId = roomId[2]
    const [channels, setChannels] = useState<any>([])
    const [participants, setParticipants] = useState<any>([])
    const profile = useAppSelector((state) => state.auth);
    const router = useRouter();
    const isStreamLive = useAppSelector((state) => state.liveStream.isLive);
    const [checkUser, setCheckUser] = useState<boolean | null>(null);
    const { notify } = useNotification();
    const [validUser, setValidUser] = useState<boolean>(false);
    const [centerView, setCenterView] = useState<'lobby' | 'live' | 'chat'>('lobby');
    const [activePanel, setActivePanel] = useState<MobilePanel>('center');
    const [isTabletDrawerOpen, setIsTabletDrawerOpen] = useState(false);

    const getTankById = async (id: string) => {
        try {
            setConfirmLoading(true);
            const { data, error } = await supabase
                .from('thinktank')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching think tank:', error);
                return null;
            }

            setThinkTank(data)
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setConfirmLoading(false);
        }
    }

    const getParticipants = async (id: string) => {
        try {
            setCheckUser(true)
            const { data, error } = await supabase
                .from('think_tank_participants')
                .select('*, users(userId, profileImage, firstName, lastName)')
                .eq('think_tank_id', id)

            if (error) {
                console.error('Error fetching think tank:', error);
                return null;
            }

            const filtered = data?.filter(Boolean) || [];
            const participant = filtered.find(p => p.participant_id === profile.profileId);

            if (!participant || !profile) {
                router.push('/login');
                return;
            }

            if (participant.status === 'Pending') {
                notify({ type: "warning", message: `Your request is under review. Please wait for approval by the host.` });
                router.push('/think-tank');
                return;
            }

            setParticipants(filtered);
            setValidUser(true);

        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setCheckUser(false)
        }
    }

    const handleOpenConversation = async (participantId: string, think_tank_id: string) => {
        try {
            const profileId = profile.profileId;

            const { data: existingConversation, error: fetchError } = await supabase
                .from('conversations')
                .select('*')
                .eq('think_tank_id', think_tank_id)
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${profileId})`)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError);
                return;
            }

            let conversationId;

            if (existingConversation) {
                conversationId = existingConversation.id
            }

            if (!existingConversation) {
                const { data: newConversation, error: insertError } = await supabase
                    .from('conversations')
                    .insert({
                        think_tank_id: think_tank_id,
                        user1_id: profileId,
                        user2_id: participantId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating conversation:', insertError);
                    return;
                }

                conversationId = newConversation.id;
            }

            router.push(`/think-tank/room/${think_tank_id}/${conversationId}?ch=${participantId}`)

        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    useEffect(() => {
        getTankById(Id)
        getParticipants(Id)
    }, []);

    // Hide page scrollbar on this page only
    useEffect(() => {
        document.body.classList.add('hide-scrollbar');
        return () => {
            document.body.classList.remove('hide-scrollbar');
        };
    }, [])

    useEffect(() => {
        const channel = supabase.channel(`participants-${Id}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'think_tank_participants',
                    filter: `think_tank_id=eq.${Id}`
                },
                async (payload) => {
                    console.log("Realtime payload:", payload);
                    await getParticipants(Id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [Id]);

    if (confirmLoading || checkUser || !validUser) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin />
            </div>
        )
    }

    const getPanelClassName = (panel: MobilePanel) => {
        return `panel-${panel} ${activePanel !== panel ? 'panel-hidden' : ''}`;
    };

    const handleMobileNavClick = (panel: MobilePanel) => {
        setActivePanel(panel);
    };

    return (
        <div className='collab-room-parent-container'>
            <div className='room-container'>
                {
                    (thinkTank && thinkTank?.room_type === 'soundscape') ? (
                        <Image src={soundScapeBg} alt='bg' layout="fill" objectFit="cover" objectPosition="center" className='soundscape-room-bg' />
                    ) : (thinkTank?.room_type === 'art_exhibit') ? (
                        <Image src={artExhibitBg} alt='bg' layout="fill" objectFit="cover" objectPosition="center" className='room-bg' />
                    ) : (thinkTank?.room_type === 'collab_fitness') ? (
                        <Image src={collabFitnessBg} alt='bg' layout="fill" objectFit="cover" objectPosition="center" className='fitness-room-bg' />
                    ) :
                        (
                            <Image src={thinkTankBg} alt='bg' layout="fill" objectFit="cover" objectPosition="center" className='soundscape-room-bg' />
                        )
                }

                {/* Tablet Drawer Toggle Button */}
                <button
                    className='tablet-drawer-toggle'
                    onClick={() => setIsTabletDrawerOpen(true)}
                >
                    <HiOutlineUserGroup />
                    <span>Members</span>
                </button>

                {/* Tablet Drawer Overlay */}
                <div
                    className={`tablet-drawer-overlay ${isTabletDrawerOpen ? 'open' : ''}`}
                    onClick={() => setIsTabletDrawerOpen(false)}
                />

                {/* Left Panel - Desktop visible, Tablet drawer, Mobile tab */}
                <div className={`${getPanelClassName('left')} tablet-drawer ${isTabletDrawerOpen ? 'drawer-open' : ''}`}>
                    <button
                        className='tablet-drawer-close'
                        onClick={() => setIsTabletDrawerOpen(false)}
                    >
                        <HiOutlineXMark />
                    </button>
                    <LeftComponent thinkTank={thinkTank} channels={channels} setChannels={setChannels} participant={participants} roomId={Id} onOpenConversation={handleOpenConversation} getParticipants={getParticipants} setCenterView={setCenterView} setParticipants={setParticipants} />
                </div>
                <div className={getPanelClassName('center')}>
                    <CenterComponent conversationId={conversationId} thinkTank={thinkTank} thinkTankId={Id} centerView={centerView} setCenterView={setCenterView} />
                </div>
                <div className={getPanelClassName('right')}>
                    {isStreamLive ? (
                        <StreamComponents roomId={Id} roomType={thinkTank.room_type} />
                    ) : (
                        <RightComponent data={thinkTank} roomId={Id} participant={participants} />
                    )}
                </div>
            </div>

            {/* Mobile Navigation Bar */}
            <nav className='mobile-nav-bar'>
                <div className='mobile-nav-content'>
                    <button
                        className={`mobile-nav-item ${activePanel === 'left' ? 'active' : ''}`}
                        onClick={() => handleMobileNavClick('left')}
                    >
                        <span className='mobile-nav-icon'><HiOutlineUserGroup /></span>
                        <span className='mobile-nav-label'>Members</span>
                    </button>
                    <button
                        className={`mobile-nav-item ${activePanel === 'center' ? 'active' : ''}`}
                        onClick={() => handleMobileNavClick('center')}
                    >
                        <span className='mobile-nav-icon'><HiOutlineChatBubbleLeftRight /></span>
                        <span className='mobile-nav-label'>Lobby</span>
                    </button>
                    <button
                        className={`mobile-nav-item ${activePanel === 'right' ? 'active' : ''}`}
                        onClick={() => handleMobileNavClick('right')}
                    >
                        <span className='mobile-nav-icon'><HiOutlineInformationCircle /></span>
                        <span className='mobile-nav-label'>Info</span>
                    </button>
                </div>
            </nav>
        </div>
    )
}

export default ThinkTankMessageRoom