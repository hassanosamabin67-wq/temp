import React, { FC, useEffect, useState } from 'react'
import PortfolioCard from '../PortfolioCard'
import cardImg from '@/public/assets/img/gaming-esports-img.webp'
import { Button, Form, Input, Modal, Tag, Typography, Upload } from 'antd'
import { MdEdit } from "react-icons/md";
import { useNotification } from '@/Components/custom/custom-notification';
import { UploadOutlined } from "@ant-design/icons";
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import styles from './style.module.css'
import PortfolioSample from '../PortfolioSample';

const { Title } = Typography;

interface PortfolioData {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    thumbnails: string[];
    video_url?: string;
}

interface porfolioSecionProps {
    visionary: string | any
    userId: string;
}

const PortfolioSection: FC<porfolioSecionProps> = ({ visionary, userId }) => {
    const [showAddModal, setShowAddModal] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [form] = Form.useForm();
    const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [thumbnailFileList, setThumbnailFileList] = useState<any>([]);
    const [videoFileList, setVideoFileList] = useState<any>([]);
    const { notify } = useNotification();
    const profile = useAppSelector((state) => state.auth);

    const addTag = () => {
        if (inputValue.trim() && !tags.includes(inputValue)) {
            setTags([...tags, inputValue.trim()]);
            setInputValue("");
        } else {
            notify({ type: "error", message: "Duplicate Skills should not be added" })
        }
    };

    const removeTag = (removedTag: string) => {
        setTags(tags.filter((tag) => tag !== removedTag));
    };

    const handleThumbnailChange = ({ fileList }: any) => {
        setThumbnailFileList(fileList);
    };

    const handleVideoChange = ({ fileList }: any) => {
        setVideoFileList(fileList);
    };

    const handleUploadPortfolio = async () => {
        try {
            setUploadLoading(true);

            const values = await form.validateFields();
            const { title, description } = values;

            if (!title || !description) {
                notify({ type: "error", message: "Please fill all required fields" });
                return;
            }

            if (tags.length === 0) {
                notify({ type: "error", message: "Please add at least one technology" });
                return;
            }

            let thumbnailUrls = [];
            let videoUrl = null;

            if (thumbnailFileList && thumbnailFileList.length > 0) {
                for (const file of thumbnailFileList) {
                    const fileName = `${Date.now()}-${file.name}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from("profile-portfolio")
                        .upload(`thumbnails/${fileName}`, file.originFileObj);

                    if (uploadError) {
                        console.error("Error uploading thumbnail:", uploadError);
                        notify({ type: "error", message: "Error uploading thumbnail" });
                        return;
                    }

                    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-portfolio/${uploadData.path}`;
                    thumbnailUrls.push(publicUrl);
                }
            }

            if (videoFileList && videoFileList.length > 0) {
                const videoFile = videoFileList[0];
                const fileName = `${Date.now()}-${videoFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("profile-portfolio")
                    .upload(`videos/${fileName}`, videoFile.originFileObj);

                if (uploadError) {
                    console.error("Error uploading video:", uploadError);
                    notify({ type: "error", message: "Error uploading video" });
                    return;
                }

                videoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-portfolio/${uploadData.path}`;
            }

            const { data, error } = await supabase
                .from("profile_portfolio")
                .insert({
                    user_id: profile.profileId,
                    title: title,
                    description: description,
                    technologies: tags,
                    thumbnails: thumbnailUrls,
                    video_url: videoUrl
                }).select();

            if (error) {
                console.error("Error inserting portfolio:", error);
                notify({ type: "error", message: "Error saving portfolio to database" });
                return;
            }

            setPortfolios((prev) => [data[0], ...prev]);
            notify({ type: "success", message: "Portfolio uploaded successfully!" });
            form.resetFields();
            setTags([]);
            setInputValue("");
            setThumbnailFileList([]);
            setVideoFileList([]);
            setShowAddModal(false);

        } catch (error) {
            console.error("Unexpected error while uploading portfolio:", error);
            notify({ type: "error", message: "An unexpected error occurred" });
        } finally {
            setUploadLoading(false);
        }
    };

    return (
        <div className={styles.portfolioContainer}>
            {/* {!visionary && (visionary !== profile.profileId) && (<Button icon={<MdEdit />} onClick={() => setShowAddModal(true)}>Add Portfolio</Button>)} */}
            <PortfolioSample userId={userId} />
            <Modal
                title={
                    <Title level={2}>Add Portfolio</Title>
                }
                open={showAddModal}
                onCancel={() => setShowAddModal(false)}
                centered
                width={900}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="add_portfolio_form"
                    className={styles.addForm}
                >
                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder='Enter Title' />
                    </Form.Item>
                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[{ required: true, message: 'Please enter a description' }]}
                    >
                        <Input.TextArea rows={5} placeholder='Write Description' />
                    </Form.Item>
                    <Form.Item label="Technologies used">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onPressEnter={addTag}
                            placeholder="Enter a Skill used in this portfolio and press Enter"
                        />
                        <div className={styles.tagDiv}>
                            {tags.map((tag) => (
                                <Tag
                                    key={tag}
                                    closable
                                    onClose={() => removeTag(tag)}
                                    style={{ fontSize: "14px", padding: "4px 8px" }}
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </div>
                    </Form.Item>
                    <Form.Item label="Thumbnails">
                        <Upload
                            multiple
                            maxCount={3}
                            accept="image/jpeg,image/png"
                            beforeUpload={() => false}
                            fileList={thumbnailFileList}
                            onChange={handleThumbnailChange}
                        >
                            <Button icon={<UploadOutlined />}>Select Thumbnails</Button>
                        </Upload>
                        <div className={styles.guidText}>
                            Upload <b>png, jpg</b> only. You can upload up to <b>3 thumbnails</b>.
                        </div>
                    </Form.Item>

                    <Form.Item label="Video">
                        <Upload
                            maxCount={1}
                            accept="video/*"
                            beforeUpload={() => false}
                            fileList={videoFileList}
                            onChange={handleVideoChange}
                        >
                            <Button icon={<UploadOutlined />}>Select Video</Button>
                        </Upload>
                        <div className={styles.guidText}>
                            Upload <b>only one video</b> (mp4, webm, etc.).
                        </div>
                    </Form.Item>
                    <div className={styles.formFooter}>
                        <Button type="primary" block loading={uploadLoading} onClick={handleUploadPortfolio}>
                            Save Portfolio
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default PortfolioSection