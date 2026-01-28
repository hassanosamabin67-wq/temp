import React, { FC, useEffect, useState } from 'react'
import { useNotification } from '@/Components/custom/custom-notification';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import PortfolioCard from '../PortfolioCard';
import styles from './style.module.css'
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Button, Empty, Form, Input, Modal, Tag, Typography, Upload, Popconfirm, Image } from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { MdEdit } from 'react-icons/md';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const { Title } = Typography;

interface PortfolioData {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    thumbnails: string[];
    video_url?: string;
}

interface porfolioSampleProps {
    userId?: string;
}

const PortfolioSample: FC<porfolioSampleProps> = ({ userId }) => {
    const [portfoliosLoading, setPortfoliosLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioData | null>(null)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [form] = Form.useForm();
    const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [thumbnailFileList, setThumbnailFileList] = useState<any>([]);
    const [videoFileList, setVideoFileList] = useState<any>([]);
    const { notify } = useNotification();
    const profile = useAppSelector((state) => state.auth);

    useEffect(() => {
        fetchPortfolios();
    }, []);

    const fetchPortfolios = async () => {
        try {
            setPortfoliosLoading(true);
            const { data, error } = await supabase
                .from('profile_portfolio')
                .select('*')
                .eq('user_id', userId || profile.profileId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching portfolios:', error);
                return;
            }
            setPortfolios?.(data || []);
        } catch (error) {
            console.error('Unexpected error fetching portfolios:', error);
        } finally {
            setPortfoliosLoading(false);
        }
    };

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

            let thumbnailUrls = isEditMode && selectedPortfolio ? [...selectedPortfolio.thumbnails] : [];
            let videoUrl = isEditMode && selectedPortfolio ? selectedPortfolio.video_url : null;

            if (thumbnailFileList && thumbnailFileList.length > 0) {
                thumbnailUrls = [];
                for (const file of thumbnailFileList) {
                    if (file.originFileObj) {
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
                    } else if (file.url) {
                        thumbnailUrls.push(file.url);
                    }
                }
            }

            if (videoFileList && videoFileList.length > 0) {
                const videoFile = videoFileList[0];
                if (videoFile.originFileObj) {
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
                } else if (videoFile.url) {
                    videoUrl = videoFile.url;
                }
            }

            if (isEditMode && selectedPortfolio) {
                const { data, error } = await supabase
                    .from("profile_portfolio")
                    .update({
                        title: title,
                        description: description,
                        technologies: tags,
                        thumbnails: thumbnailUrls,
                        video_url: videoUrl
                    })
                    .eq('id', selectedPortfolio.id)
                    .select();

                if (error) {
                    console.error("Error updating portfolio:", error);
                    notify({ type: "error", message: "Error updating portfolio" });
                    return;
                }

                setPortfolios((prev) => prev.map(p => p.id === selectedPortfolio.id ? data[0] : p));
                notify({ type: "success", message: "Portfolio updated successfully!" });
            } else {
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
            }

            form.resetFields();
            setTags([]);
            setInputValue("");
            setThumbnailFileList([]);
            setVideoFileList([]);
            setShowAddModal(false);
            setIsEditMode(false);
            setSelectedPortfolio(null);

        } catch (error) {
            console.error("Unexpected error while uploading portfolio:", error);
            notify({ type: "error", message: "An unexpected error occurred" });
        } finally {
            setUploadLoading(false);
        }
    };

    const handleViewPortfolio = (portfolio: PortfolioData) => {
        setSelectedPortfolio(portfolio);
        setShowDetailModal(true);
    };

    const handleEditPortfolio = () => {
        if (!selectedPortfolio) return;

        setIsEditMode(true);
        form.setFieldsValue({
            title: selectedPortfolio.title,
            description: selectedPortfolio.description,
        });
        setTags(selectedPortfolio.technologies || []);

        const thumbnailFiles = selectedPortfolio.thumbnails?.map((url, index) => ({
            uid: `thumb-${index}`,
            name: `thumbnail-${index}`,
            status: 'done',
            url: url,
        })) || [];
        setThumbnailFileList(thumbnailFiles);

        if (selectedPortfolio.video_url) {
            setVideoFileList([{
                uid: 'video-0',
                name: 'video',
                status: 'done',
                url: selectedPortfolio.video_url,
            }]);
        } else {
            setVideoFileList([]);
        }

        setShowDetailModal(false);
        setShowAddModal(true);
    };

    const handleDeletePortfolio = async () => {
        if (!selectedPortfolio) return;

        try {
            setDeleteLoading(true);

            const { error } = await supabase
                .from("profile_portfolio")
                .delete()
                .eq('id', selectedPortfolio.id);

            if (error) {
                console.error("Error deleting portfolio:", error);
                notify({ type: "error", message: "Error deleting portfolio" });
                return;
            }

            setPortfolios((prev) => prev.filter(p => p.id !== selectedPortfolio.id));
            notify({ type: "success", message: "Portfolio deleted successfully!" });
            setShowDetailModal(false);
            setSelectedPortfolio(null);

        } catch (error) {
            console.error("Unexpected error while deleting portfolio:", error);
            notify({ type: "error", message: "An unexpected error occurred" });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setIsEditMode(false);
        setSelectedPortfolio(null);
        form.resetFields();
        setTags([]);
        setInputValue("");
        setThumbnailFileList([]);
        setVideoFileList([]);
    };

    return (
        <>
            <div className={styles.portfolioGrid}>
                {userId === profile.profileId && (<ActionButton icon={<MdEdit />} onClick={() => setShowAddModal(true)}>Add Portfolio</ActionButton>)}
                {portfolios && portfolios?.length > 0 ? (
                    <Swiper
                        spaceBetween={10}
                        slidesPerView={3}
                        navigation
                        className={styles.portfolioSlider}
                        modules={[Navigation]}
                        breakpoints={{
                            // Mobile (<= 640px)
                            0: {
                                slidesPerView: 1,
                                spaceBetween: 12,
                            },

                            // Tablet (>= 640px)
                            640: {
                                slidesPerView: 2,
                                spaceBetween: 12,
                            },

                            // Desktop (>= 1024px)
                            1024: {
                                slidesPerView: 3,
                                spaceBetween: 10,
                            },
                        }}
                    >
                        {portfolios && portfolios.map((portfolioData) => (
                            <SwiperSlide key={portfolioData.id}>
                                <PortfolioCard
                                    portfolio={portfolioData}
                                    loadingState={portfoliosLoading}
                                    onClick={() => handleViewPortfolio(portfolioData)}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <Empty description="No Portfolio Uploaded" />
                )}
                <Modal
                    title={
                        <Title level={2}>{isEditMode ? 'Edit Portfolio' : 'Add Portfolio'}</Title>
                    }
                    open={showAddModal}
                    onCancel={handleCloseAddModal}
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
                            <ActionButton block loading={uploadLoading} onClick={handleUploadPortfolio}>
                                Save Portfolio
                            </ActionButton>
                        </div>
                    </Form>
                </Modal>

                <Modal
                    title={
                        <Title level={2}>Portfolio Details</Title>
                    }
                    open={showDetailModal}
                    onCancel={() => {
                        setShowDetailModal(false);
                        setSelectedPortfolio(null);
                    }}
                    centered
                    width={900}
                    footer={
                        (userId === profile.profileId || !userId) && selectedPortfolio ? (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <ActionButton
                                    icon={<EditOutlined />}
                                    type="primary"
                                    onClick={handleEditPortfolio}
                                >
                                    Edit
                                </ActionButton>
                                <Popconfirm
                                    title="Delete Portfolio"
                                    description="Are you sure you want to delete this portfolio?"
                                    onConfirm={handleDeletePortfolio}
                                    okText="Yes"
                                    cancelText="No"
                                    okButtonProps={{ danger: true, loading: deleteLoading }}
                                >
                                    <Button
                                        icon={<DeleteOutlined />}
                                        danger
                                        loading={deleteLoading}
                                    >
                                        Delete
                                    </Button>
                                </Popconfirm>
                            </div>
                        ) : null
                    }
                >
                    {selectedPortfolio && (
                        <div className={styles.portfolioDetail}>
                            <div className={styles.detailSection}>
                                <h3>Title</h3>
                                <p>{selectedPortfolio.title}</p>
                            </div>

                            <div className={styles.detailSection}>
                                <h3>Description</h3>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedPortfolio.description}</p>
                            </div>

                            <div className={styles.detailSection}>
                                <h3>Technologies</h3>
                                <div className={styles.tagDiv}>
                                    {selectedPortfolio.technologies?.map((tech) => (
                                        <Tag key={tech} style={{ fontSize: "14px", padding: "4px 8px" }}>
                                            {tech}
                                        </Tag>
                                    ))}
                                </div>
                            </div>

                            {selectedPortfolio.thumbnails && selectedPortfolio.thumbnails.length > 0 && (
                                <div className={styles.detailSection}>
                                    <h3>Thumbnails</h3>
                                    <div className={styles.thumbnailGrid}>
                                        <Image.PreviewGroup>
                                            {selectedPortfolio.thumbnails.map((thumbnail, index) => (
                                                <Image
                                                    key={index}
                                                    src={thumbnail}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    width={200}
                                                    height={150}
                                                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                                                />
                                            ))}
                                        </Image.PreviewGroup>
                                    </div>
                                </div>
                            )}

                            {selectedPortfolio.video_url && (
                                <div className={styles.detailSection}>
                                    <h3>Video</h3>
                                    <video
                                        controls
                                        style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                                    >
                                        <source src={selectedPortfolio.video_url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </>
    )
}

export default PortfolioSample
