import React, { FC, useState, useRef } from 'react'
import { AddArtWorkModalProps, Artwork } from './types'
import { Button, Form, Input, InputNumber, Modal, Typography, Space, Divider } from 'antd'
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import { useParams } from 'next/navigation';
import CommentaryUpload from './CommentaryUpload';
import { useAppSelector } from '@/store';
import ThemedModal from '@/Components/UIComponents/ThemedModal';
import { HiOutlinePhoto } from 'react-icons/hi2';

const { Title, Text } = Typography;

const AddArtWorkModal: FC<AddArtWorkModalProps> = ({ open, onCancel, setArtWork, hostId }) => {
    const [form] = Form.useForm();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [commentaryUrl, setCommentaryUrl] = useState<string>('');
    const [commentaryType, setCommentaryType] = useState<'audio' | 'video' | null>(null);
    const [showCommentaryUpload, setShowCommentaryUpload] = useState(false);
    const { notify } = useNotification();
    const [addLoading, setAddLoading] = useState(false);
    const params = useParams();
    const roomId = Array.isArray(params?.room) ? params.room[1] : undefined;
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachedFile(file);
        }
    };

    const profile = useAppSelector((state) => state.auth);

    const handleCommentarySuccess = (url: string, type: 'audio' | 'video') => {
        setCommentaryUrl(url);
        setCommentaryType(type);
        setShowCommentaryUpload(false);
    };

    const handleSubmit = async () => {
        try {
            setAddLoading(true);
            const values = await form.validateFields();
            if (!attachedFile) {
                notify({ type: "error", message: "Please select an image file" });
                return;
            }

            let fileUrl = null;

            // Upload file first
            if (attachedFile) {
                const fileName = `${Date.now()}_${attachedFile.name}`;
                const filePath = `art-exhibit/${fileName}`;
                const { error: uploadError } = await supabase.storage
                    .from("art-exhibit")
                    .upload(filePath, attachedFile);

                if (uploadError) {
                    console.error("File upload failed", uploadError);
                    notify({ type: "error", message: "File upload failed. Please try again." });
                    return;
                }

                fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/art-exhibit/${filePath}`;
            }

            const { art_work_title, art_work_description, art_work_price } = values;

            // Insert artwork data and get the inserted record
            const { data, error } = await supabase
                .from("art_exhibit_room")
                .insert({
                    room_id: roomId,
                    art_work_title,
                    art_work_description,
                    art_work_price,
                    art_work_image: fileUrl,
                    art_work_commentary_url: commentaryUrl,
                    art_work_commentary_type: commentaryType,
                    sold_to: null,
                    room_host: hostId,
                    created_by: profile.profileId
                })
                .select() // This is crucial - select the inserted data
                .single();

            if (error) {
                notify({ type: "error", message: `Error Adding Artwork: ${error.message}` });
                return;
            }

            notify({ type: "success", message: "Artwork added successfully" });

            // Transform the returned data to match the Artwork interface
            const transformedArtwork: Artwork = {
                id: data.id,
                title: data.art_work_title || '',
                imageUrl: data.art_work_image || '',
                description: data.art_work_description || '',
                price: data.art_work_price || 0,
                commentaryUrl: data.art_work_commentary_url,
                is_sold: data.is_sold || false,
                host: data.room_host,
                createdBy: data.created_by
            };

            // Add to appropriate state based on who created it
            setArtWork(transformedArtwork);

            // Reset form
            form.resetFields();
            setAttachedFile(null);
            setCommentaryUrl('');
            setCommentaryType(null);
            onCancel();
        } catch (error) {
            console.error(error);
            notify({ type: "error", message: "An unexpected error occurred" });
        } finally {
            setAddLoading(false);
        }
    };

    return (
        <>
            <CommentaryUpload
                open={showCommentaryUpload}
                onCancel={() => setShowCommentaryUpload(false)}
                roomId={roomId || ''}
                artworkId=""
                onSuccess={handleCommentarySuccess}
            />
            <ThemedModal
                roomType="art_exhibit"
                themedTitle={
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: 10 }}>
                            <HiOutlinePhoto size={20} />
                        </span>
                        <span>Add Artwork</span>
                    </div>
                }
                open={open}
                onCancel={onCancel}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="add_artwork"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        name="art_work_title"
                        label="Title"
                        rules={[{ required: true, message: "Please enter the title!" }]}
                    >
                        <Input placeholder="Enter Artwork Title" />
                    </Form.Item>
                    <Form.Item name="art_work_description" label="Description" rules={[{ required: true, message: "Please enter the description!" }]}>
                        <Input.TextArea placeholder="Enter Artwork Description" rows={3} />
                    </Form.Item>
                    <Form.Item name="art_work_price" label="Price" rules={[{ required: true, message: "Please enter the price!" }]}>
                        <InputNumber addonBefore="$" min={0} placeholder="Enter Artwork Price" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item label="Artwork Image">
                        <div style={{ display: 'flex', alignItems: "center", gap: 8 }}>
                            <Button onClick={() => fileInputRef.current?.click()}>Upload Image</Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                            {attachedFile && <span>Selected: {attachedFile.name}</span>}
                        </div>
                    </Form.Item>

                    <Divider />

                    <Form.Item label="Audio/Video Commentary (Optional)">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button
                                type="dashed"
                                onClick={() => setShowCommentaryUpload(true)}
                                style={{ width: '100%' }}
                            >
                                Add Commentary
                            </Button>
                            {commentaryUrl && (
                                <div style={{
                                    padding: 8,
                                    border: '1px solid #d9d9d9',
                                    borderRadius: 4,
                                    backgroundColor: '#fafafa'
                                }}>
                                    <Text type="success">
                                        ✓ {commentaryType === 'audio' ? 'Audio' : 'Video'} commentary added
                                    </Text>
                                </div>
                            )}
                        </Space>
                    </Form.Item>

                    <div style={{ display: "flex", justifyContent: "end", gap: 15, margin: "10px 0" }}>
                        <Button className='cancel-button' onClick={onCancel}>Cancel</Button>
                        <Button className='add-button' type="primary" onClick={handleSubmit} loading={addLoading}>Add</Button>
                    </div>
                </Form>
            </ThemedModal>
        </>
    )
}

export default AddArtWorkModal