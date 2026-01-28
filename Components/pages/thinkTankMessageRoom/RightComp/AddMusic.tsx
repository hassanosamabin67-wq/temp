'use client'
import React, { useEffect, useState } from 'react'
import { Button, Modal, Typography, Select } from 'antd';
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import musicGif from '@/public/assets/ghipy/music_gif.gif'
import Image from 'next/image';

const { Title } = Typography;

const AddMusic = ({ showModal, setShowModal, roomId, bgMusic, setIsMusicPlaying, isMusicPlaying }: any) => {
    const [loading, setLoading] = useState(false)
    const { notify } = useNotification();
    const [selectedMusic, setSelectedMusic] = useState<{ label: string; value: string } | null>(null);
    const [musicLibrary, setMusicLibrary] = useState<any>([]);

    const handleAddMusic = async (roomId: string) => {
        try {
            if (!selectedMusic) {
                notify({ type: "error", message: "Please select a music track." });
                return;
            }

            setLoading(true);

            const { data: ExistingMusic, error: fetchError } = await supabase
                .from('background_music')
                .select('*')
                .eq('think_tank_id', roomId);

            if (ExistingMusic && !fetchError) {
                const { error: deleteError } = await supabase
                    .from('background_music')
                    .delete()
                    .eq('think_tank_id', roomId);

                if (deleteError) {
                    notify({ type: "error", message: "Failed to remove existing music." });
                    console.error("Music delete failed: ", deleteError);
                    return;
                }
            }

            const { error } = await supabase
                .from('background_music')
                .insert([{
                    music_url: selectedMusic.value,
                    music_name: selectedMusic.label,
                    think_tank_id: roomId,
                    is_playing: true
                }]);

            if (error) {
                notify({ type: "error", message: "Failed to set music" });
                console.error("Music insert failed: ", error);
                return;
            }

            notify({ type: "success", message: "Background Music Set" });
            setShowModal(false);
            setIsMusicPlaying(true)

        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMusicLibrary = async () => {
            const { data, error } = await supabase.from('music_library').select('*');
            if (error) {
                console.error("Error fetching music:", error);
                return
            } else {
                setMusicLibrary(data);
            }
        };

        fetchMusicLibrary();
    }, []);

    const handleToggleMusic = async (id: string) => {
        try {
            const { error } = await supabase
                .from("background_music")
                .update({ is_playing: !isMusicPlaying })
                .eq("id", id);

            if (error) {
                console.error("Error toggling music: ", error);
                return;
            }

            setIsMusicPlaying(!isMusicPlaying);
            notify({ type: "success", message: `Music ${!isMusicPlaying ? "Resumed" : "Paused"}` });

        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    return (
        <Modal
            title={
                <Title level={2} style={{ marginBottom: 10 }}>
                    Add Background Music
                </Title>
            }
            open={showModal}
            onCancel={() => setShowModal(false)}
            footer={null}
            width={600}
            centered
        >
            <div className='upload-mc-container'>
                {bgMusic && (
                    <div className='music-playing-container'>
                        <div className='music-playing-div'>
                            <Image className='music-playing-img' src={musicGif} alt="music_gif" width={200} height={200} />
                            <span className='music-playing-name'>{bgMusic.music_name}</span>
                        </div>
                        <Button onClick={() => handleToggleMusic(bgMusic.id)}>
                            {isMusicPlaying ? "Pause" : "Resume"}
                        </Button>
                    </div>
                )}
                <div style={{ marginBottom: 8 }}>
                    <Typography.Text strong>Select Music</Typography.Text>
                </div>
                <Select
                    showSearch
                    allowClear
                    placeholder="Select background music"
                    style={{ width: "100%" }}
                    labelInValue
                    onChange={(option) => setSelectedMusic(option)}
                    filterOption={(input, option) =>
                        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={musicLibrary.map((track: any) => ({
                        label: track.title,
                        value: track.url,
                    }))}
                />
            </div>
            <div style={{ display: "flex", justifyContent: "end", gap: 15, margin: "10px 0" }}>
                <Button style={{ padding: "17px 30px", fontSize: 15 }} onClick={() => setShowModal(false)}>Cancel</Button>
                <Button style={{ padding: "17px 35px", fontSize: 15 }} type="primary" onClick={() => handleAddMusic(roomId)} loading={loading}>Set Music</Button>
            </div>
        </Modal>
    )
}

export default AddMusic