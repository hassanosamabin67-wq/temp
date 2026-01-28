'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Conversations from './Conversations'
import MessageBox from './MessageBox'
import "./style.css"
import { supabase } from '@/config/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppSelector } from '@/store'
import { Spin, Drawer } from 'antd'
import { MenuOutlined } from '@ant-design/icons'

const InboxMessages = ({ roomId, fromDashboard }: any) => {
    const conversationId = roomId[1];
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth);
    const [allConversation, setAllConversation] = useState<any>([]);
    const [userDetail, setUserDetail] = useState<any>(null);
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const conversationIdFromDashboard = searchParams.get("cnv")
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const fetchUnreadCountForConversation = async (convId: string) => {
        if (!profile?.profileId) return 0;
        try {
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('inbox_conversation_id', convId)
                .eq('receiver_id', profile.profileId)
                .eq('is_read', false)

            return count || 0;
        } catch (err) {
            console.error('Error fetching unread count:', err);
            return 0;
        }
    };

    const getAllConversations = useCallback(async (profileId: string) => {
        try {
            setLoading(true);

            const { data: conversations, error } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`);

            if (error) throw error;

            if (!conversations || conversations.length === 0) {
                setAllConversation([]);
                setUserDetail({});
                return;
            }

            const userIds = [...new Set(conversations.flatMap((c: any) => [c.user1_id, c.user2_id]))].filter(Boolean);

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('userId, firstName, lastName, profileImage, last_seen, is_online')
                .in("userId", userIds);

            if (userError) throw userError;

            const userMap = userData.reduce((acc: any, user: any) => {
                acc[user.userId] = user;
                return acc;
            }, {});

            setUserDetail(userMap);

            const enrichedConversations = await Promise.all(
                conversations.map(async (conv: any) => {
                    // last message
                    const { data: lastMsg, error: lastMsgError } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('inbox_conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (lastMsgError) {
                        console.error('Error fetching last msg:', lastMsgError);
                    }

                    const unreadCount = await fetchUnreadCountForConversation(conv.id);

                    return {
                        ...conv,
                        lastMessage: lastMsg || null,
                        unreadCount: unreadCount || 0,
                    };
                })
            );

            enrichedConversations.sort((a: any, b: any) => {
                const aTime = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
                const bTime = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
                return bTime - aTime;
            })

            setAllConversation(enrichedConversations);

        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    }, [profile?.profileId]);

    const markConversationAsRead = async (convId: string, currentProfileId: string) => {
        try {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('inbox_conversation_id', convId)
                .eq('receiver_id', currentProfileId)
                .is('is_read', false);
        } catch (err) {
            console.error('Error marking messages read:', err);
        }
    };

    const handleOpenConversation = async (participantId: string, profileId: string) => {
        try {
            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${profileId})`)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError);
                return;
            }

            let convId;

            if (existingConversation) {
                convId = existingConversation.id;
            } else {
                const { data: newConversation, error: insertError } = await supabase
                    .from('inbox_conversation')
                    .insert({
                        user1_id: profileId,
                        user2_id: participantId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating conversation:', insertError);
                    return;
                }

                convId = newConversation.id;

                setAllConversation((prev: any) => [{ ...newConversation, lastMessage: null, unreadCount: 0 }, ...prev]);
            }

            await markConversationAsRead(convId, profileId);

            router.push(`/messages/room/${convId}?ch=${participantId}`)

            setAllConversation((prev: any) => prev.map((c: any) => c.id === convId ? { ...c, unreadCount: 0 } : c));

            // Close drawer on mobile after selecting conversation
            if (isMobile) {
                setDrawerVisible(false);
            }

        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    const handleOpenConversationFromDashboard = async (participantId: string, profileId: string) => {
        try {
            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${profileId})`)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError);
                return;
            }

            let convId;

            if (existingConversation) {
                convId = existingConversation.id;
            } else {
                const { data: newConversation, error: insertError } = await supabase
                    .from('inbox_conversation')
                    .insert({
                        user1_id: profileId,
                        user2_id: participantId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating conversation:', insertError);
                    return;
                }

                convId = newConversation.id;
                setAllConversation((prev: any) => [{ ...newConversation, lastMessage: null, unreadCount: 0 }, ...prev]);
            }

            await markConversationAsRead(convId, profileId);

            router.push(`/dashboard/client/messages?cnv=${convId}&ch=${participantId}`)

            setAllConversation((prev: any) => prev.map((c: any) => c.id === convId ? { ...c, unreadCount: 0 } : c));

            // Close drawer on mobile after selecting conversation
            if (isMobile) {
                setDrawerVisible(false);
            }

        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!profile?.profileId) return;

        getAllConversations(profile.profileId);

        const convChannel = supabase
            .channel(`realtime:inbox_conversation:${profile.profileId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'inbox_conversation',
                },
                (payload) => {
                    const newConversation = payload.new;
                    if (
                        newConversation.user1_id === profile.profileId ||
                        newConversation.user2_id === profile.profileId
                    ) {
                        setAllConversation((prev: any) => {
                            const exists = prev.find((c: any) => c.id === newConversation.id);
                            return exists ? prev : [{ ...newConversation, lastMessage: null, unreadCount: 0 }, ...prev];
                        });

                        getAllConversations(profile.profileId!);
                    }
                }
            )
            .subscribe();

        const messagesInsertChannel = supabase
            .channel(`realtime:messages-insert:${profile.profileId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${profile.profileId}`
                },
                async (payload) => {
                    const newMsg = payload.new;
                    setAllConversation((prev: any) => {
                        const idx = prev.findIndex((c: any) => c.id === newMsg.inbox_conversation_id);
                        if (idx === -1) {
                            getAllConversations(profile.profileId!);
                            return prev;
                        }
                        const updated = [...prev];
                        const target = { ...updated[idx] };
                        target.lastMessage = newMsg;
                        target.unreadCount = (target.unreadCount || 0) + (newMsg.is_read ? 0 : 1);
                        updated[idx] = target;
                        // move to top (optional)
                        updated.splice(idx, 1);
                        return [target, ...updated];
                    });
                }
            )
            .subscribe();

        const messagesUpdateChannel = supabase
            .channel(`realtime:messages-update:${profile.profileId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload) => {
                    const updatedMsg = payload.new;
                    const convId = updatedMsg.inbox_conversation_id;
                    const unread = await fetchUnreadCountForConversation(convId);
                    setAllConversation((prev: any) => prev.map((c: any) => c.id === convId ? { ...c, unreadCount: unread } : c));
                    setAllConversation((prev: any) => {
                        const idx = prev.findIndex((c: any) => c.id === convId);
                        if (idx === -1) return prev;
                        const updated = [...prev];
                        const currentLast = updated[idx].lastMessage;
                        if (!currentLast || new Date(updatedMsg.created_at).getTime() >= new Date(currentLast.created_at).getTime()) {
                            updated[idx] = { ...updated[idx], lastMessage: updatedMsg };
                        }
                        return updated;
                    })
                }
            )
            .subscribe();

        // cleanup: remove channels on unmount
        return () => {
            supabase.removeChannel(convChannel);
            supabase.removeChannel(messagesInsertChannel);
            supabase.removeChannel(messagesUpdateChannel);
        };
    }, [profile?.profileId, getAllConversations]);

    // Hide page scrollbar on this page only
    useEffect(() => {
        document.body.classList.add('hide-scrollbar');
        return () => {
            document.body.classList.remove('hide-scrollbar');
        };
    }, [])

    if (loading) {
        return (
            <div style={{ height: "88vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin size='large' />
            </div>
        )
    }

    return (
        <div className='inbox-main'>
            <div className='inbox-div'>
                <div className="inbox-container">
                    {!isMobile && (
                        <Conversations
                            openConversation={fromDashboard ? handleOpenConversationFromDashboard : handleOpenConversation}
                            allConversation={allConversation}
                            userDetail={userDetail}
                        />
                    )}
                    <MessageBox
                        conversationId={fromDashboard ? conversationIdFromDashboard : conversationId}
                        userDetail={userDetail}
                        fromDashboard={true}
                        isMobile={isMobile}
                        onOpenDrawer={() => setDrawerVisible(true)}
                    />
                </div>
            </div>

            <Drawer
                title="Conversations"
                placement="left"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={280}
                styles={{ body: { padding: 0 } }}
            >
                <Conversations
                    openConversation={fromDashboard ? handleOpenConversationFromDashboard : handleOpenConversation}
                    allConversation={allConversation}
                    userDetail={userDetail}
                />
            </Drawer>
        </div>
    )
}

export default InboxMessages