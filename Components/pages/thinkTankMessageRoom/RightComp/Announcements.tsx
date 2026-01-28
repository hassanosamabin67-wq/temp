'use client'
import React, { useEffect, useState } from 'react'
import { TfiAnnouncement } from "react-icons/tfi";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { Button, Dropdown, Form, Input, Modal, Typography } from 'antd';
import { useNotification } from '@/Components/custom/custom-notification';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'
import { SlOptionsVertical } from "react-icons/sl";
import { TbPinnedFilled } from "react-icons/tb";
import { TiPin } from "react-icons/ti";

dayjs.extend(relativeTime)
dayjs.extend(calendar)
const { Title } = Typography;

const Announcements = ({ roomId, isHost }: any) => {
    const [showAnnouncement, setShowAnnouncement] = useState(false);
    const [form] = Form.useForm();
    const { notify } = useNotification();
    const [visible, setVisible] = useState(false);
    const [announcement, setAnnouncement] = useState<any>([]);
    const profile = useAppSelector((state) => state.auth);
    const [pinnedMessage, setPinnedMessage] = useState<any>({});

    const showModal = () => setVisible(true);

    const handleCancel = () => {
        form.resetFields();
        setVisible(false);
    }

    const handleAddAnnouncement = async (thinkTankId: string, hostName: string | any) => {
        try {
            await form.validateFields();
            const values = await form.getFieldsValue();

            const payload = {
                think_tank_id: thinkTankId,
                host_name: hostName,
                announcement_message: values.announcement_message
            }

            const { data, error } = await supabase
                .from("lobby_announcements")
                .insert([payload])
                .select("*")

            if (error) {
                console.error("Error Adding Announcement: ", error);
                notify({ type: "error", message: "Error Adding Announcement" })
                return;
            }

            form.resetFields();
            setVisible(false)
            notify({ type: "success", message: "Announcement Posted" })

        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    }

    const handleDeleteAnnouncement = async (announcementId: string) => {
        try {
            const { error } = await supabase
                .from('lobby_announcements')
                .delete()
                .eq('id', announcementId);

            if (error) {
                console.error("Error deleting announcement: ", error);
                notify({ type: "error", message: "Error deleting announcement" });
                return;
            }

            setAnnouncement((prev: any[]) => prev.filter(item => item.id !== announcementId));
            notify({ type: "success", message: "Announcement deleted" });

        } catch (err) {
            console.error("Unexpected error deleting announcement: ", err);
        }
    };

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const { data, error } = await supabase
                .from("lobby_announcements")
                .select("*")
                .eq("think_tank_id", roomId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error Fetching Announcements: ", error);
                return;
            }

            setAnnouncement(data);
            const pinned = data.find(item => item.is_pinned);
            setPinnedMessage(pinned || null);
        };

        fetchAnnouncements();

        const announcementChannel = supabase
            .channel('room_announcement_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lobby_announcements',
                    filter: `think_tank_id=eq.${roomId}`
                },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    if (eventType === 'INSERT') {
                        setAnnouncement((prev: any[]) => [newRecord, ...prev]);
                    } else if (eventType === 'DELETE') {
                        setAnnouncement((prev: any[]) => prev.filter(item => item.id !== oldRecord.id));
                    }
                }
            )
            .subscribe();

        return () => {
            if (announcementChannel) {
                supabase.removeChannel(announcementChannel);
            }
        };
    }, [roomId]);

    const scrollToMessage = (index: number) => {
        const element = document.getElementById(`announcement_${index}`);
        const container = document.getElementById("announcement-div");
        if (element && container) {
            const elementOffsetTop = element.offsetTop;
            const containerOffsetTop = container.offsetTop;

            const scrollPosition = elementOffsetTop - containerOffsetTop;

            container.scrollTo({
                top: scrollPosition,
                behavior: "smooth",
            });
        }
    };

    const handlePinMessage = async (announcement: any) => {
        const isCurrentlyPinned = announcement.is_pinned;

        if (!isCurrentlyPinned) {
            const { error: unpinError } = await supabase
                .from("lobby_announcements")
                .update({ is_pinned: null })
                .eq("think_tank_id", roomId);

            if (unpinError) {
                console.error('Failed to unpin other messages:', unpinError);
                notify({ type: "error", message: "Failed to unpin other announcements" });
                return;
            }
        }

        const { data, error } = await supabase
            .from("lobby_announcements")
            .update({ is_pinned: !isCurrentlyPinned })
            .eq("id", announcement.id)
            .select("*")
            .single();

        if (error) {
            console.error('Failed to update pinned status:', error);
            notify({ type: "error", message: "Failed to update pinned status" });
            return;
        }

        setAnnouncement((prev: any[]) => prev.map(item => item.id === data.id ? data : { ...item, is_pinned: null }));

        if (!isCurrentlyPinned) {
            setPinnedMessage(data);
        } else {
            setPinnedMessage(null);
        }
    };

    return (
        <>
            <div className="anc-main">
                <div className="anc-collapse" onClick={() => setShowAnnouncement(!showAnnouncement)}>
                    <div className='anc-collapse-ch'>
                        <span className="anc-collapse-heading">Announcements</span>
                        <span className='anc-icon'><TfiAnnouncement /></span>
                    </div>
                    <span>
                        {showAnnouncement ? (
                            <FaAngleUp className='collapse-icon' />
                        ) : (
                            <FaAngleDown className='collapse-icon' />
                        )}
                    </span>
                </div>
                {showAnnouncement && (
                    <div className='show-anc-div'>
                        {pinnedMessage && (
                            <div onClick={() => scrollToMessage(pinnedMessage.id)} className='pinned-box'>
                                <span className='pin-icon'><TbPinnedFilled /></span>
                                <p className='pinned-text'>{pinnedMessage.announcement_message}</p>
                            </div>
                        )}
                        <div className='announcement-div' id='announcement-div'>
                            {announcement && announcement.length > 0 ? (announcement.map((announcement: any) => (
                                <div key={announcement.id} id={`announcement_${announcement.id}`} className='announcement'>
                                    <div className='anc-cred'>
                                        <div>
                                            <span className='anc-host-name'>K.{announcement.host_name}</span>
                                            <span className='anc-posted-date'>{dayjs(announcement.created_at).calendar(null, {
                                                sameDay: '[Today] h:mm A',
                                                lastDay: '[Yesterday] h:mm A',
                                                lastWeek: 'dddd h:mm A',
                                                sameElse: 'DD/MM/YYYY h:mm A'
                                            })}</span>
                                        </div>
                                        {isHost && (
                                            <Dropdown menu={{
                                                items: [
                                                    {
                                                        key: '1',
                                                        label: (
                                                            <span style={{ display: "block", width: 80, textAlign: "center" }} onClick={() => handleDeleteAnnouncement(announcement.id)}>Delete</span>
                                                        ),
                                                    },
                                                    {
                                                        key: '2',
                                                        label: (
                                                            <span style={{ display: "block", width: 80, textAlign: "center" }} onClick={() => handlePinMessage(announcement)}>{announcement.is_pinned ? 'Unpin 📍' : 'Pin 📌'}</span>
                                                        ),
                                                    }
                                                ]
                                            }} trigger={['click']} placement="bottomLeft">
                                                <span style={{ height: "fit-content", cursor: "pointer" }}><SlOptionsVertical /></span>
                                            </Dropdown>
                                        )}
                                    </div>
                                    <div>
                                        <p className='anc-message'>{announcement.announcement_message}</p>
                                        {announcement.is_pinned && <div className="anc-pin"><span className='anc-pin-icon'><TiPin /></span></div>}
                                    </div>
                                </div>
                            ))) : (
                                <span className="no-announcement">No Announcement</span>
                            )}
                        </div>
                        {isHost && <Button className='post-btn' onClick={showModal}>Post</Button>}
                    </div>
                )}
            </div>
            <Modal
                title={
                    <Title level={2} style={{ marginBottom: 0 }}>
                        Post Announcement
                    </Title>
                }
                open={visible}
                onCancel={handleCancel}
                footer={null}
                width={600}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="add_announcement_form"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        name="announcement_message"
                        label="Announcement"
                        rules={[{ required: true, message: "Please enter the message!" }]}
                    >
                        <Input.TextArea rows={4} placeholder="Write announcement message" />
                    </Form.Item>
                    <div className='modal-footer'>
                        <Button className='modal-footer-btn' onClick={handleCancel}>Cancel</Button>
                        <Button className='modal-footer-btn' type="primary" onClick={() => handleAddAnnouncement(roomId, `${profile.firstName} ${profile.lastName}`)}>Post</Button>
                    </div>
                </Form>
            </Modal>
        </>
    )
}

export default Announcements