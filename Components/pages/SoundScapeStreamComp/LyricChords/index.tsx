'use client'
import { Button, Input, Modal, Typography } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { MdLyrics } from "react-icons/md";
import { BiSolidNotepad } from "react-icons/bi";
import { supabase } from '@/config/supabase';
import debounce from 'lodash.debounce';
import Image from 'next/image';
import userImg from '@/public/assets/img/userImg.webp'
import './style.css'

const { Title } = Typography;

const LyricChords = ({ roomId, participants: initialParticipants, profile, host, liveStreamId }: any) => {
    const [visible, setVisible] = useState(false)
    const [content, setContent] = useState("");
    const [editors, setEditors] = useState<string[]>([]);
    const isTypingRef = useRef(false);
    const [participants, setParticipants] = useState<any[]>(initialParticipants || []);

    const debouncedUpdateLyrics = useRef(
        debounce(async (roomId: string, newContent: string) => {
            await supabase
                .from('soundscape_lyrics')
                .update({ content: newContent })
                .eq('room_id', roomId)
        }, 300)
    ).current

    // Sync participants from props
    useEffect(() => {
        if (initialParticipants) {
            setParticipants(initialParticipants);
        }
    }, [initialParticipants]);

    // Real-time subscription for participants updates
    useEffect(() => {
        if (!liveStreamId) return;

        const channel = supabase
            .channel(`lyric-participants-${liveStreamId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'live_stream',
                    filter: `id=eq.${liveStreamId}`,
                },
                (payload: any) => {
                    const next = payload.new;
                    if (next?.participants) {
                        console.log('LyricChords: Participants updated', next.participants);
                        setParticipants(next.participants);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [liveStreamId]);

    const addLyrics = async (roomId: string) => {
        try {
            const { data: existingLyrics, error: fetchError } = await supabase
                .from('soundscape_lyrics')
                .select('*')
                .eq('room_id', roomId)
                .maybeSingle()

            if (existingLyrics && !fetchError) {
                setVisible(true);
                return;
            }

            const { error: insertError } = await supabase
                .from('soundscape_lyrics')
                .insert([{ room_id: roomId, content: '' }])

            if (insertError) {
                console.error('Failed to insert initial lyric row:', insertError)
                return
            }

            setVisible(true);

        } catch (err) {
            console.error("Unexpected error while adding lyrics: ", err);
        }
    }

    useEffect(() => {
        const fetchLyrics = async () => {
            const { data } = await supabase
                .from('soundscape_lyrics')
                .select('content, editors')
                .eq('room_id', roomId)
                .maybeSingle()

            if (data?.content) {
                setContent(data.content)
            }
            if (data?.editors) {
                setEditors(data.editors)
            }
        }

        fetchLyrics()
    }, [roomId])

    useEffect(() => {
        const channel = supabase
            .channel(`realtime-lyrics-${roomId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'soundscape_lyrics', filter: `room_id=eq.${roomId}` },
                (payload) => {
                    const newContent = payload.new.content;
                    if (!isTypingRef.current && newContent !== content) {
                        setContent(newContent);
                    }
                    if (payload.new.editors) {
                        setEditors(payload.new.editors);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, content]);

    const handleChange = (e: any) => {
        const newContent = e.target.value
        setContent(newContent)
        isTypingRef.current = true
        debouncedUpdateLyrics(roomId, newContent)

        setTimeout(() => {
            isTypingRef.current = false
        }, 1000)
    }

    useEffect(() => {
        return () => {
            debouncedUpdateLyrics.cancel()
        }
    }, [])

    const handleToggleAccess = async (participantId: string, participant: any) => {
        const isCurrentlyEditor = editors.includes(participantId);
        let newEditors;

        if (isCurrentlyEditor) {
            // Remove access
            newEditors = editors.filter((id: string) => id !== participantId);
        } else {
            // Add access
            newEditors = [...editors, participantId];
        }

        const { error } = await supabase
            .from('soundscape_lyrics')
            .update({ editors: newEditors })
            .eq('room_id', roomId);

        if (!error) {
            setEditors(newEditors);
        } else {
            console.error("Failed to update editors:", error);
        }
    }

    const canEdit = profile.profileId === host.id || editors.includes(profile.profileId);

    return (
        <div className='lyric-chord-container'>
            <Button icon={<MdLyrics />} onClick={() => addLyrics(roomId)} >Lyrics/Chords</Button>

            <Modal
                title={
                    <Title level={2} style={{ marginBottom: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><BiSolidNotepad /></span><span>Lyrics/Chord Pad</span></div>
                    </Title>
                }
                open={visible}
                onCancel={() => {
                    debouncedUpdateLyrics.flush();
                    setVisible(false)
                }}
                footer={null}
                className="fullscreen-modal"
            >
                <div className='chord-container'>
                    <div className='chord-pad-div'>
                        <Input.TextArea className='chord-pad' placeholder="Start writing your lyrics or chords here..." value={content} onChange={canEdit ? handleChange : undefined} disabled={!canEdit} />
                    </div>
                    {profile.profileId === host.id && (
                        <div className='editors-div'>
                            <span className='editor-div-heading'>Editors</span>
                            <div className='editors-list'>
                                {participants && participants.filter((data: any) => data.id !== host.id).map((participant: any) => (
                                    <div key={participant.id} className="editors">
                                        <div className='editor-info'>
                                            <Image className='editor-image' src={participant.profileImg || userImg} alt='userImg' width={100} height={100} />
                                            <span className='editor-name'>{participant.name}</span>
                                        </div>
                                        <Button
                                            onClick={() => handleToggleAccess(participant.id, { id: participant.id, name: participant.name })}
                                            type={editors.includes(participant.id) ? "primary" : "default"}
                                        >
                                            {editors.includes(participant.id) ? "Remove Access" : "Allow Access"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default LyricChords