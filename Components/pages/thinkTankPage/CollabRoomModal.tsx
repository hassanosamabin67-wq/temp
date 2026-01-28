"use client"
import React, { useRef, useState, useEffect } from 'react'
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, TimePicker, Typography } from 'antd'
import { supabase } from '@/config/supabase';
import { menuData } from '@/utils/services';
import { collabRoomCategories } from '@/utils/constants/collabRoomCategories';
import { useAppSelector } from '@/store';
import dayjs from 'dayjs';
import { useNotification } from '@/Components/custom/custom-notification';
import useAllRoom from '@/hooks/collabRoom/useAllRoom';
import CollabRooms from './CollabRooms';
import { logRoomAction } from '@/utils/PlatformLogging';
import useCollabRoomManager from '@/hooks/collabRoom/useCollabRoomManager';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const { Title } = Typography;

interface CollabRoomData {
    id?: string;
    title: string;
    description: string;
    start_datetime?: string;
    end_datetime?: string;
    accesstype: string;
    category: string;
    subcategory: string;
    recurring: string;
    pricingtype?: string;
    participant_limit?: number;
    price?: number;
    room_type: string;
    file_url?: string;
    one_time_date?: string;
    start_time?: string;
    media_type?: string;
    host?: string;
    host_data?: any;
    available_spots: number;
}

interface CollabRoomModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess?: (roomData: any) => void;
    mode?: 'create' | 'edit';
    editData?: CollabRoomData | null;
    is_requested_room?: boolean;
    step?: number;
    nextStep?: () => void;
    receiverId?: string | null;
}

const CollabRoomModal: React.FC<CollabRoomModalProps> = ({
    visible,
    onCancel,
    onSuccess,
    mode = 'create',
    editData = null,
    is_requested_room,
    step = 0,
    receiverId,
    nextStep
}) => {
    const [form] = Form.useForm();
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const mediaType = Form.useWatch('media_type', form);
    const recurringType = Form.useWatch('recurring', form);
    const selectedCategory = Form.useWatch('category', form);
    const roomType = Form.useWatch('room_type', form);
    const accessType = Form.useWatch('accesstype', form);
    const pricingType = Form.useWatch('pricingType', form);

    const isEditMode = mode === 'edit';

    // Mapping function between room types and categories
    const getRoomTypeCategory = (roomType: string): string | null => {
        const mapping: { [key: string]: string } = {
            'soundscape': 'Soundscape',
            'think_tank': 'Think Tank',
            'art_exhibit': 'Art Exhibit',
            'collab_fitness': 'Collab Fitness',
            'wordflow': 'WordFlow Room (Poetry & Spoken Word)',
            'open_collab': 'Open Collab'
        };
        return mapping[roomType] || null;
    };

    const disablePastDates = (current: any) => {
        return current && current <= dayjs().startOf('day');
    };

    const { confirmLoading, collabRooms, setCollabRooms, refreshRooms } = useAllRoom({
        profile,
        getUserRoom: true,
        receiverId
    });
    const { handleJoin } = useCollabRoomManager({ filteredThinkTanks: collabRooms });

    useEffect(() => {
        if (isEditMode && editData && visible) {
            const formValues: any = {
                title: editData.title,
                description: editData.description,
                recurring: editData.recurring,
                accesstype: editData.accesstype,
                category: editData.category,
                subcategory: editData.subcategory,
                room_type: editData.room_type,
                pricingType: editData.pricingtype,
                participant_limit: editData.participant_limit,
                price: editData.price,
                media_type: editData.media_type,
                available_spots: editData.available_spots
            };

            if (editData.one_time_date) {
                formValues.one_time_date = dayjs(editData.one_time_date);
            }

            if (editData.start_time) {
                formValues.start_time = dayjs(editData.start_time);
            }

            if (editData.start_datetime) {
                formValues.startDateTime = dayjs(editData.start_datetime);
            }

            if (editData.end_datetime) {
                formValues.endDateTime = dayjs(editData.end_datetime);
            }

            form.setFieldsValue(formValues);
            setExistingFileUrl(editData.file_url || null);
        }
    }, [isEditMode, editData, visible, form]);

    // Auto-select category based on room type
    useEffect(() => {
        if (roomType && !isEditMode) {
            const category = getRoomTypeCategory(roomType);
            if (category) {
                form.setFieldValue('category', category);
                // Clear subcategory when room type changes
                form.setFieldValue('subcategory', undefined);
            }
        }
    }, [roomType, form, isEditMode]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (mediaType === "image") {
            const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
            if (!isJpgOrPng) {
                notify({ type: "error", message: "Only JPG/PNG files are allowed!" });
                e.target.value = "";
                return;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                notify({ type: "error", message: "Image must be smaller than 5MB!" });
                e.target.value = "";
                return;
            }
        }

        if (mediaType === "video") {
            const isMp4 = file.type === "video/mp4";
            if (!isMp4) {
                notify({ type: "error", message: "Only MP4 videos are allowed!" });
                e.target.value = "";
                return;
            }
            const isLt200M = file.size / 1024 / 1024 < 200;
            if (!isLt200M) {
                notify({ type: "error", message: "Video must be smaller than 200MB!" });
                e.target.value = "";
                return;
            }
        }

        setAttachedFile(file);
    };

    const resetForm = () => {
        form.resetFields();
        setAttachedFile(null);
        setExistingFileUrl(null);
    };

    const uploadFile = async (file: File): Promise<string | null> => {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `room-thumbnail/${fileName}`;
        const { error: uploadError } = await supabase.storage
            .from("collab-room")
            .upload(filePath, file);

        if (uploadError) {
            console.error("File upload failed", uploadError);
            notify({ type: 'error', message: 'Failed to upload file. Please try again.' });
            return null;
        }

        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collab-room/${filePath}`;
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await form.validateFields();
            const values = await form.getFieldsValue();


            let fileUrl = existingFileUrl;

            if (attachedFile) {
                fileUrl = await uploadFile(attachedFile);
                if (!fileUrl) return;
            }

            const oneTimeDate = values.one_time_date;
            const startTime = values.start_time;

            let combinedOneTimeDatetime = null;
            if (oneTimeDate && startTime) {
                combinedOneTimeDatetime = oneTimeDate
                    .hour(startTime.hour())
                    .minute(startTime.minute())
                    .second(startTime.second ? startTime.second() : 0)
                    .millisecond(0);
            }

            const roomData = {
                title: values.title,
                description: values.description,
                start_datetime: values.startDateTime?.toISOString(),
                end_datetime: values.endDateTime?.toISOString(),
                accesstype: values.accesstype,
                category: values.category,
                subcategory: values.subcategory,
                recurring: values.recurring,
                pricingtype: values.pricingType,
                participant_limit: values.participant_limit || null,
                price: values.price || null,
                room_type: values.room_type,
                file_url: fileUrl,
                one_time_date: combinedOneTimeDatetime ? combinedOneTimeDatetime.toISOString() : null,
                start_time: combinedOneTimeDatetime ? combinedOneTimeDatetime.toISOString() : (startTime || null),
                media_type: values.media_type,
                available_spots: values.available_spots
            };

            if (isEditMode && editData?.id) {
                await handleEdit(roomData);
            } else {
                await handleCreate(roomData);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} collab room:`, error);
            notify({ type: 'error', message: `Failed to ${isEditMode ? 'update' : 'create'} collab room. Please try again.` });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (roomData: any) => {
        const newThinkTank = {
            ...roomData,
            host: profile.profileId!,
            host_data: {
                userId: profile.profileId,
                profileImage: profile.profileImage,
                name: `${profile.firstName} ${profile.lastName}`
            },
        };

        const { data, error } = await supabase
            .from('thinktank')
            .insert([newThinkTank])
            .select('*');

        if (error) {
            console.error('Insert failed:', error);
            notify({ type: 'error', message: 'Failed to create collab room. Please try again.' });
            return;
        }

        if (data && data.length > 0) {
            const insertedThinkTank = data[0];

            // Create subscription product if this is a subscription room
            if (roomData.pricingtype === 'Subscription') {
                try {
                    const subscriptionResponse = await fetch('/api/subscriptions/create-subscription-product', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            roomId: insertedThinkTank.id,
                            roomTitle: roomData.title,
                            subscriptionPrice: roomData.price,
                            hostId: profile.profileId
                        })
                    });

                    if (!subscriptionResponse.ok) {
                        const errorData = await subscriptionResponse.json();
                        console.error('Subscription setup failed:', errorData);
                        notify({ type: 'error', message: 'Failed to setup subscription. Please try again.' });
                        
                        // Clean up the created room
                        await supabase.from('thinktank').delete().eq('id', insertedThinkTank.id);
                        return;
                    }

                    notify({ type: 'success', message: 'Subscription room created successfully!' });
                } catch (error) {
                    console.error('Subscription setup error:', error);
                    notify({ type: 'error', message: 'Failed to setup subscription. Please try again.' });
                    
                    // Clean up the created room
                    await supabase.from('thinktank').delete().eq('id', insertedThinkTank.id);
                    return;
                }
            }

            await supabase.from('think_tank_participants').insert({
                status: "Accepted",
                think_tank_id: insertedThinkTank.id,
                participant_id: profile.profileId,
                is_agreement_accepted: true
            });

            if (receiverId) {
                await supabase.from('think_tank_participants').insert({
                    status: "Accepted",
                    think_tank_id: insertedThinkTank.id,
                    participant_id: receiverId,
                    is_agreement_accepted: true
                });
            }

            if (setCollabRooms) {
                setCollabRooms((prevRooms: any) => {
                    const currentRooms = Array.isArray(prevRooms) ? prevRooms : [prevRooms];
                    return [insertedThinkTank, ...currentRooms];
                });
            } else if (refreshRooms) {
                refreshRooms();
            }

            await supabase.from("contract_tool_usage").insert({
                user: profile.profileId,
                for: insertedThinkTank.id,
                contract_type: "NDA",
                project: roomData.title,
                payment: roomData.price || null,
                status: "Active"
            });

            logRoomAction.onCreate(
                insertedThinkTank.id,
                profile.userName || `${profile.firstName} ${profile.lastName}`,
                profile.profileId!,
                roomData.title
            );

            notify({ type: 'success', message: 'Collab room created successfully!' });
            resetForm();
            onCancel();

            if (onSuccess) {
                onSuccess(insertedThinkTank);
            }
        }
    };

    const handleEdit = async (roomData: any) => {
        const { data, error } = await supabase
            .from('thinktank')
            .update(roomData)
            .eq('id', editData!.id)
            .select('*');

        if (error) {
            console.error('Update failed:', error);
            notify({ type: 'error', message: 'Failed to update collab room. Please try again.' });
            return;
        }

        if (data && data.length > 0) {
            const updatedThinkTank = data[0];

            if (setCollabRooms) {
                setCollabRooms((prevRooms: any) => {
                    const currentRooms = Array.isArray(prevRooms) ? prevRooms : [prevRooms];
                    return currentRooms.map((room: any) =>
                        room.id === editData!.id ? updatedThinkTank : room
                    );
                });
            } else if (refreshRooms) {
                refreshRooms();
            }

            notify({ type: 'success', message: 'Collab room updated successfully!' });
            resetForm();
            onCancel();

            if (onSuccess) {
                onSuccess(updatedThinkTank);
            }
        }
    };

    const handleCancel = () => {
        resetForm();
        onCancel();
    };

    const renderFormContent = () => (
        <Form
            form={form}
            layout="vertical"
            name="collab_room_form"
            style={{ marginTop: 20 }}
        >
            <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter the title!" }]}
            >
                <Input placeholder="Enter Collab Room Title" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true, message: "Please enter the description!" }]}>
                <Input.TextArea placeholder="Enter Collab Room Description" rows={3} />
            </Form.Item>
            <div style={{ display: "grid", gridTemplateColumns: "49% 49%", alignItems: "center", gap: 10 }}>
                <Form.Item style={{ width: '100%' }} name="recurring" rules={[{ required: true, message: "Please Select the Type!" }]} label="Type">
                    <Select allowClear placeholder="Recurring vs. One-Time">
                        <Select.Option value="One-Time Think Tank">One-Time Collab Room – A single session on a specific date.</Select.Option>
                        <Select.Option value="Recurring Think Tank">Recurring Collab Room – Hosted regularly (weekly, biweekly, monthly).</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Available Spots"
                    name="available_spots"
                    style={{ width: '100%' }}
                    rules={[
                        { required: true, message: 'Please enter the available spots for the room' },
                        {
                            validator(_, value) {
                                if (value > 0 && value <= 300) {
                                    return Promise.resolve();
                                }
                                if (value > 300) {
                                    return Promise.reject(new Error('Maximum capacity is 300 participants'));
                                }
                                return Promise.reject(new Error('Must be greater than 0'));
                            },
                        },
                    ]}
                >
                    <InputNumber
                        min={1}
                        max={300}
                        style={{ width: '100%' }}
                        placeholder="Enter the available spots (max 300)"
                    />
                </Form.Item>
            </div>
            {recurringType === "One-Time Think Tank" && (
                <div style={{ display: "grid", gridTemplateColumns: "49% 49%", alignItems: "center", gap: 10 }}>
                    <Form.Item style={{ width: "100%" }} name="one_time_date" label="Select Date">
                        <DatePicker style={{ width: "100%" }} placeholder='Select a Date' disabledDate={disablePastDates} showNow={false} />
                    </Form.Item>
                    <Form.Item name="start_time" style={{ width: "100%" }} label="Room Time" rules={[{ required: true, message: "Please select the time!" }]}>
                        <TimePicker placeholder="Select Room Start Time" style={{ width: "100%" }} format="h:mm:ss A" use12Hours />
                    </Form.Item>
                </div>
            )}
            {recurringType === 'Recurring Think Tank' && (
                <div>
                    <span style={{ paddingBottom: 8, display: "block" }}>Date</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Form.Item style={{ width: "100%" }} name="startDateTime">
                            <DatePicker style={{ width: "100%" }} placeholder='Select Start Date' disabledDate={disablePastDates} showNow={false} />
                        </Form.Item>
                        <Form.Item style={{ width: "100%" }} name="endDateTime">
                            <DatePicker style={{ width: "100%" }} placeholder='Select End Date' disabledDate={disablePastDates} showNow={false} />
                        </Form.Item>
                    </div>
                    <Form.Item name="start_time" style={{ width: "100%" }} label="Room Time" rules={[{ required: true, message: "Please select the time!" }]}>
                        <TimePicker placeholder="Select Room Start Time" style={{ width: "100%" }} format="h:mm:ss A" use12Hours />
                    </Form.Item>
                </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "49% 49%", alignItems: "center", gap: 10 }}>
                <Form.Item name="room_type" style={{ width: "100%" }} rules={[{ required: true, message: "Please Select the Access Type!" }]} label="Room Type">
                    <Select allowClear placeholder="Select Room Type">
                        <Select.Option value="soundscape">SOUNDSCAPE</Select.Option>
                        <Select.Option value="think_tank">THINK TANK</Select.Option>
                        <Select.Option value="art_exhibit">ART EXHIBIT</Select.Option>
                        <Select.Option value="collab_fitness">COLLAB FITNESS</Select.Option>
                        <Select.Option value="wordflow">WORDFLOW</Select.Option>
                        <Select.Option value="open_collab">OPEN COLLAB</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="accesstype" style={{ width: "100%" }} rules={[{ required: true, message: "Please Select the Access Type!" }]} label="Access">
                    <Select allowClear placeholder="Access Type">
                        <Select.Option value="Open">Open – Anyone can join.</Select.Option>
                        <Select.Option value="Private">Private – Invite-only (host manually approves participants).</Select.Option>
                        <Select.Option value="Limited">Limited – A set number of spots available (first come, first serve).</Select.Option>
                    </Select>
                </Form.Item>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "49% 49%", alignItems: "center", gap: 10 }}>
                <Form.Item style={{ width: "100%" }} name="category" rules={[{ required: true, message: "Please Select the Category!" }]} label="Category">
                    <Select allowClear placeholder="Select Category">
                        {collabRoomCategories.categories.map((category, index) => (
                            <Select.Option key={index} value={category.name}>
                                {category.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    style={{ width: "100%" }}
                    name="subcategory"
                    label="Subcategory"
                    rules={[{ required: true, message: "Please select the Subcategory!" }]}
                >
                    <Select
                        allowClear
                        placeholder="Select Subcategory"
                        disabled={!selectedCategory}
                    >
                        {
                            collabRoomCategories.categories
                                .find((cat) => cat.name === selectedCategory)
                                ?.subcategories.map((subcategory, index) => (
                                    <Select.Option key={index} value={subcategory}>
                                        {subcategory}
                                    </Select.Option>
                                ))
                        }
                    </Select>
                </Form.Item>
            </div>
            {accessType === 'Limited' && (
                <Form.Item
                    label="Participant Limit"
                    name="participant_limit"
                    rules={[
                        { required: true, message: 'Please enter a valid participant limit' },
                        {
                            validator(_, value) {
                                if (value > 0 && value <= 300) {
                                    return Promise.resolve();
                                }
                                if (value > 300) {
                                    return Promise.reject(new Error('Maximum capacity is 300 participants'));
                                }
                                return Promise.reject(new Error('Please enter a valid participant limit'));
                            },
                        },
                    ]}
                >
                    <InputNumber min={1} max={300} style={{ width: '100%' }} placeholder="Enter limit (max 300)" />
                </Form.Item>
            )}
            <div style={{ display: 'flex', alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                {accessType !== 'Private' && (
                    <Form.Item name="pricingType" style={{ width: '100%' }} rules={[{ required: true, message: "Please Select the Pricing!" }]} label="Pricing">
                        <Select allowClear placeholder="Pricing & Monetization">
                            <Select.Option value="Free">Free – No cost, open to all.</Select.Option>
                            <Select.Option value="One-Time Fee">One-Time Fee – Set price per participant per session.</Select.Option>
                            <Select.Option value="Recurring Fee">Recurring Fee – Charge for ongoing access (weekly, biweekly, monthly).</Select.Option>
                            <Select.Option value="Donation-Based">Donation-Based – Users contribute an amount of their choice.</Select.Option>
                            <Select.Option value="Subscription">Subscription – Monthly recurring subscription access (20% platform fee).</Select.Option>
                        </Select>
                    </Form.Item>
                )}
                {pricingType && (pricingType !== 'Free' && pricingType !== 'Donation-Based') && (
                    <Form.Item
                        label={pricingType === 'Subscription' ? 'Monthly Price' : 'Amount'}
                        name="price"
                        style={{ width: '100%' }}
                        rules={[
                            { required: true, message: 'Please enter the amount' },
                            {
                                validator(_, value) {
                                    if (pricingType === 'Subscription' && value < 5) {
                                        return Promise.reject(new Error('Minimum subscription price is $5/month'));
                                    }
                                    if (value > 0) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Amount must be greater than 0'));
                                },
                            },
                        ]}
                    >
                        <InputNumber
                            min={pricingType === 'Subscription' ? 5 : 1}
                            prefix="$"
                            style={{ width: '100%' }}
                            placeholder={pricingType === 'Subscription' ? 'Enter monthly subscription price (min $5)' : 'Enter price per participant'}
                        />
                    </Form.Item>
                )}
            </div>
            {pricingType === 'Subscription' && (
                <div style={{ 
                    background: '#f0f9ff', 
                    border: '1px solid #bae6fd', 
                    borderRadius: 6, 
                    padding: 12, 
                    marginBottom: 16,
                    fontSize: 13,
                    color: '#0369a1'
                }}>
                    <strong>💡 Subscription Room Benefits:</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                        <li>Monthly recurring revenue from subscribers</li>
                        <li>Automatic access management</li>
                        <li>Kaboom handles billing and payments</li>
                        <li>20% platform fee, 80% goes to you</li>
                        <li>Subscribers get unlimited access to your room</li>
                    </ul>
                </div>
            )}
            <Form.Item
                name="media_type"
                label="Room Thumbnail"
                rules={[{ required: true, message: "Please select Room Thumbnail!" }]}
            >
                <Select placeholder="Select thumbnail type" allowClear>
                    <Select.Option value="image">Image (JPG/PNG, max 5MB)</Select.Option>
                    <Select.Option value="video">Video (MP4, max 200MB)</Select.Option>
                </Select>
            </Form.Item>
            {(mediaType === "image" || mediaType === 'video') && (
                <div style={{ display: 'flex', alignItems: "center", gap: 8 }}>
                    <Button onClick={() => fileInputRef.current?.click()}>
                        {isEditMode ? `Change ${mediaType === "image" ? "Image" : "Video"}` : `Upload ${mediaType === "image" ? "Image" : "Video"}`}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    {attachedFile && <span>Selected: {attachedFile.name}</span>}
                    {/* {!attachedFile && existingFileUrl && <span>Current file uploaded</span>} */}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "end", gap: 15, margin: "10px 0" }}>
                <Button style={{ padding: "17px 30px", fontSize: 15 }} onClick={handleCancel}>Cancel</Button>
                <ActionButton loading={loading} onClick={handleSubmit}>
                    {isEditMode ? 'Update' : 'Add'}
                </ActionButton>
            </div>
        </Form>
    );

    const renderExistingRoomContent = () => (
        <div>
            <span>Existing Rooms</span>
            <CollabRooms confirmLoading={confirmLoading} filteredThinkTanks={collabRooms} handleJoin={handleJoin} joiningTankId={""} />
            <Button type="primary" onClick={nextStep}>Create New Room</Button>
        </div>
    );

    const renderModalContent = () => {
        if (!is_requested_room) return renderFormContent();
        switch (step) {
            case 0:
                return renderExistingRoomContent();
            case 1:
                return renderFormContent();
            default:
                return null;
        }
    };

    return (
        <Modal
            title={
                <Title level={2} style={{ marginBottom: 0 }}>
                    {isEditMode ? 'Edit Collab Room' : 'Create Collab Room'}
                </Title>
            }
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={900}
            centered
        >
            <div style={{ maxHeight: 500, overflow: "auto" }}>
                {renderModalContent()}
            </div>
        </Modal>
    );
};

export default CollabRoomModal;