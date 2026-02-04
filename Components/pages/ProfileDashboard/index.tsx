'use client'
import React, { useEffect, useRef, useState } from 'react'
import styles from './style.module.css'
import { Button, Rate, Drawer, Skeleton, Tag, Form, CheckboxProps, Radio, Input, InputNumber, DatePicker, Checkbox, Modal, Typography } from 'antd'
import Image from 'next/image'
import coverImg from '@/public/assets/img/profile-cover.webp'
import { IoLocation } from "react-icons/io5";
import { BiSolidCalendar } from "react-icons/bi";
import { FiCamera } from "react-icons/fi";
import userImg from '@/public/assets/img/userImg.webp'
import PortfolioSample from '../dashboard/profile/PortfolioSample'
import ServiceSection from './ServicesSection'
import ReviewSection from './ReviewSection'
import WorkHistory from './WorkHistory'
import Certification from './Certification'
import { PiBagFill } from "react-icons/pi";
import WorkExperience from './WorkExperience/WorkExperience'
import { MdQueryStats } from "react-icons/md";
import { RiCloseLargeFill } from "react-icons/ri";
import ProfileStats from './ProfileStats'
import dayjs from 'dayjs'
import { MapPin, Calendar, Star, MessageCircle, Mail, Phone, Briefcase, Award, BookOpen, Edit2, Camera, ExternalLink } from 'lucide-react';
import './profile.css';
import useFetchProfileData from '@/hooks/profileDashboard/fetchProfileData'
import { setAuthData } from '@/store/slices/auth-slice'
import SupabaseuploadImage from '@/utils/supabase-image-upload'
import { useDispatch } from 'react-redux'
import { AuthState } from '@/types/userInterface'
import { useNotification } from '@/Components/custom/custom-notification'
import { supabase } from '@/config/supabase'
import { recordProfileStat } from '@/utils/profileStats'
import { useSearchParams } from 'next/navigation'
import { GoDotFill } from 'react-icons/go'
import { useAppSelector } from '@/store'
import StripePayment from '@/Components/StripePayment'
import { FaFileSignature } from 'react-icons/fa'
import UserAvatar from '@/Components/UIComponents/UserAvatar'
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper'
import ActionButton from '@/Components/UIComponents/ActionBtn'

const { Title } = Typography;

const ProfileDashboard = () => {
    const [open, setOpen] = useState(false);
    const [profileUploadLoading, setProfileUploadLoading] = useState(false);
    const [profileCoverLoading, setProfileCoverLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('about');

    const dispatch = useDispatch();
    const { profile, stats, testimonials, workHistory, services = { services: [], totalServices: 0 }, collabsCompleted = 0, loading } = useFetchProfileData();
    const profileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const { notify } = useNotification()
    const [responseTime, setResponseTime] = useState('');
    const HOUR_IN_MS = 60 * 60 * 1000;
    const searchParams = useSearchParams();
    const visionary = searchParams.get('visionary');
    const [onlineStatus, setOnlineStatus] = useState<boolean>(false)
    const currentProfile = useAppSelector((state) => state.auth);

    const showOnline = profile?.last_seen
        ? Date.now() - new Date(profile.last_seen).getTime() < 30_000
        : onlineStatus;

    const [showHireModal, setShowHireModal] = useState(false);
    const [visionaryName, setVisionaryName] = useState('');
    const [form] = Form.useForm();
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [price, setPrice] = useState<{ priceType: string; value: number | null }>({ priceType: "", value: null });
    const [hiringDate, setHiringDate] = useState({ start_datetime: "", end_datetime: "" });
    const [hireDescription, setHireDescription] = useState("");
    const [hireTitle, setHireTitle] = useState("");
    const [checked, setChecked] = useState(false);
    const [milestones, setMilestones] = useState<{ title: string; amount: number; due_date: string }[]>([]);

    const generateRandomResponseTime = () => {
        const minTime = 50;
        const maxTime = 120;
        const randomMinutes = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
        const hours = Math.floor(randomMinutes / 60);
        const minutes = randomMinutes % 60;
        let str = '';
        if (hours > 0) str = `${hours} hour${hours !== 1 ? 's' : ''}`;
        if (minutes > 0) str += `${hours > 0 ? ' ' : ''}${minutes} minute${minutes !== 1 ? 's' : ''}`;
        return str || '0 minutes';
    };

    useEffect(() => {
        const viewedId = profile?.profileId;
        if (!viewedId) return;
        const RESPONSE_TIME_KEY = `responseTime_${viewedId}`;
        const TIMESTAMP_KEY = `responseTimeTimestamp_${viewedId}`;
        const update = () => {
            const next = generateRandomResponseTime();
            setResponseTime(next);
            localStorage.setItem(RESPONSE_TIME_KEY, next);
            localStorage.setItem(TIMESTAMP_KEY, String(Date.now()));
        };
        const now = Date.now();
        const saved = localStorage.getItem(RESPONSE_TIME_KEY);
        const savedTs = Number(localStorage.getItem(TIMESTAMP_KEY) || 0);

        let timeoutId: number | undefined;
        let intervalId: number | undefined;

        if (saved && savedTs && now - savedTs < HOUR_IN_MS) {
            setResponseTime(saved);
            const remaining = HOUR_IN_MS - (now - savedTs);
            timeoutId = window.setTimeout(() => {
                update();
                intervalId = window.setInterval(update, HOUR_IN_MS);
            }, remaining);
        } else {
            update();
            intervalId = window.setInterval(update, HOUR_IN_MS);
        }

        return () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [profile?.profileId]);

    useEffect(() => {
        const channel = supabase
            .channel("online-users")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "users",
                },
                (payload: any) => {
                    const onlineStatus = payload.new.is_online;
                    if (onlineStatus) {
                        setOnlineStatus(onlineStatus)
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (!visionary) return
        recordProfileStat({
            profileId: currentProfile?.profileId!,
            userId: visionary!,
            type: "view"
        });
        recordProfileStat({
            profileId: currentProfile?.profileId!,
            userId: visionary!,
            type: "impression"
        });
    }, [currentProfile?.profileId])

    useEffect(() => {
        if (profile?.firstName || profile?.lastName) {
            setVisionaryName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim());
        }
    }, [profile?.firstName, profile?.lastName])

    const showDrawer = () => {
        setOpen(true);
        // document.body.style.overflow = 'hidden'; // Disable scrolling
    };

    const onClose = () => {
        setOpen(false);
        // document.body.style.overflow = 'unset'; // Enable scrolling
    };

    const handleAddProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setProfileUploadLoading(true)
            const file = e.target.files?.[0];
            if (!file) return;

            const data = await SupabaseuploadImage(file as File, profile?.profileId!);
            const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/profile/" + data?.path;

            const { error } = await supabase
                .from('users')
                .update({ profileImage: publicUrl })
                .eq("userId", profile?.profileId)

            if (error) {
                console.error("Error uploading profile image", error)
                return
            }
            dispatch(setAuthData({ ...profile, profileImage: publicUrl } as AuthState));
            notify({ type: "success", message: "Profile image updated successfully!" });
        } catch (err: any) {
            console.error("Unexpected Error while uploading profile image: ", err);
            notify({ type: "error", message: `Error uploading profile image: ${err.message || "Something went wrong"}`, });
        } finally {
            setProfileUploadLoading(false)
        }
    };

    const handleAddCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setProfileCoverLoading(true)
            const file = e.target.files?.[0];
            if (!file) return;

            const data = await SupabaseuploadImage(file as File, profile?.profileId!);
            const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/profile/" + data?.path;

            const { error } = await supabase
                .from('users')
                .update({ profileCoverImage: publicUrl })
                .eq("userId", profile?.profileId)

            if (error) {
                console.error("Error uploading cover image", error)
                return
            }
            dispatch(setAuthData({ ...profile, profileCoverImage: publicUrl } as AuthState));
            notify({ type: "success", message: "Cover image updated successfully!" });
        } catch (err: any) {
            console.error("Unexpected Error while uploading cover image: ", err);
            notify({ type: "error", message: `Error uploading cover image: ${err.message || "Something went wrong"}`, });
        } finally {
            setProfileCoverLoading(false)
        }
    };

    const handleOpenHireModal = () => {
        form.resetFields();
        setShowHireModal(true);
        setCurrentStep(0);
        setPrice({ priceType: "", value: null });
        setHireDescription('');
        setHiringDate({ start_datetime: "", end_datetime: "" });
        setChecked(false);
        setMilestones([])
    };

    const addMilestone = () => {
        setMilestones([...milestones, { title: "", amount: 0, due_date: "" }]);
    };

    const updateMilestone = (index: any, field: any, value: any) => {
        const updated = [...milestones];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };
        setMilestones(updated);
    };

    const removeMilestone = (index: number) => {
        setMilestones((prev) => prev.filter((_, i) => i !== index));
    };

    const onChange: CheckboxProps['onChange'] = (e) => {
        setChecked(e.target.checked);
    };

    const milestoneTotalAmount = milestones.reduce((sum, ms) => sum + (ms.amount || 0), 0);

    const steps = [
        {
            title: "First",
            content: (
                <>
                    <Form.Item name="priceType">
                        <Radio.Group
                            value={price.priceType}
                            onChange={(e) => setPrice({ priceType: e.target.value, value: null })}>
                            {/* <Radio value="hourly">Hourly Rate</Radio> */}
                            <Radio value="fixed">Fixed Price</Radio>
                            <Radio value="milestone">Milestone</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {price.priceType === "milestone" && (
                        <>
                            <div>
                                <Form.Item>
                                    <Input
                                        value={hireTitle}
                                        onChange={(e) => setHireTitle(e.target.value)}
                                        style={{ width: "100%" }}
                                        placeholder="Enter Offer Title"
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Input.TextArea
                                        value={hireDescription}
                                        onChange={(e) => setHireDescription(e.target.value)}
                                        rows={4}
                                        placeholder="Enter Description"
                                    />
                                </Form.Item>
                            </div>

                            <div>
                                {milestones.map((ms, index) => (
                                    <div key={index} style={{ marginBottom: 10 }}>
                                        <Input
                                            placeholder="Milestone Title"
                                            value={ms.title}
                                            onChange={(e) => updateMilestone(index, "title", e.target.value)}
                                            style={{ marginBottom: 5 }}
                                        />
                                        <InputNumber
                                            placeholder="Amount"
                                            min={0}
                                            value={ms.amount}
                                            onChange={(val) => updateMilestone(index, "amount", val ?? 0)}
                                            style={{ marginBottom: 5, width: "100%" }}
                                        />
                                        <DatePicker
                                            placeholder="Due Date"
                                            value={ms.due_date}
                                            onChange={(val) => updateMilestone(index, "due_date", val)}
                                            style={{ width: "100%" }}
                                        />
                                        <Button
                                            danger
                                            onClick={() => removeMilestone(index)}
                                            style={{ marginTop: 5 }}
                                        >
                                            Remove
                                        </Button>
                                        <hr />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {
                        price.priceType === "milestone" && (
                            <Button type="dashed" onClick={addMilestone} block>Add Milestone</Button>
                        )
                    }

                    {
                        price.priceType === "hourly" && (
                            <>
                                <div>
                                    <Form.Item>
                                        <Input
                                            value={hireTitle}
                                            onChange={(e) => setHireTitle(e.target.value)}
                                            style={{ width: "100%" }}
                                            placeholder="Enter Offer title"
                                        />
                                    </Form.Item>
                                </div>
                                <div>
                                    <Form.Item>
                                        <InputNumber
                                            min={0}
                                            value={price.value}
                                            onChange={(value) => setPrice((prev) => ({ ...prev, value: value ?? null }))}
                                            style={{ width: "100%" }}
                                            placeholder="Enter hourly rate"
                                        />
                                    </Form.Item>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <Form.Item style={{ width: "100%" }} name="startDateTime">
                                            <DatePicker value={hiringDate.start_datetime} onChange={(value) => setHiringDate({ ...hiringDate, start_datetime: value })} style={{ width: "100%" }} placeholder='Select Start Date' />
                                        </Form.Item>
                                        <Form.Item style={{ width: "100%" }} name="endDateTime">
                                            <DatePicker value={hiringDate.end_datetime} onChange={(value) => setHiringDate({ ...hiringDate, end_datetime: value })} style={{ width: "100%" }} placeholder='Select End Date' />
                                        </Form.Item>
                                    </div>
                                </div>
                            </>
                        )
                    }

                    {
                        price.priceType === "fixed" && (
                            <div>
                                <div>
                                    <Form.Item>
                                        <Input
                                            value={hireTitle}
                                            onChange={(e) => setHireTitle(e.target.value)}
                                            style={{ width: "100%" }}
                                            placeholder="Enter Offer title"
                                        />
                                    </Form.Item>
                                </div>
                                <Form.Item>
                                    <InputNumber
                                        min={0}
                                        value={price.value}
                                        onChange={(value) => setPrice((prev) => ({ ...prev, value: value ?? null }))}
                                        style={{ width: "100%" }}
                                        placeholder="Enter fixed price"
                                    />
                                </Form.Item>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Form.Item style={{ width: "100%" }} name="startDateTime">
                                        <DatePicker value={hiringDate.start_datetime} onChange={(value) => setHiringDate({ ...hiringDate, start_datetime: value })} style={{ width: "100%" }} placeholder='Select Start Date' />
                                    </Form.Item>
                                    <Form.Item style={{ width: "100%" }} name="endDateTime">
                                        <DatePicker value={hiringDate.end_datetime} onChange={(value) => setHiringDate({ ...hiringDate, end_datetime: value })} style={{ width: "100%" }} placeholder='Select End Date' />
                                    </Form.Item>
                                </div>
                            </div>
                        )
                    }
                    {
                        (price.priceType && price.priceType !== 'milestone') && (
                            <Form.Item>
                                <Input.TextArea value={hireDescription} onChange={(e) => setHireDescription(e.target.value)} rows={4} placeholder="Enter Description" />
                            </Form.Item>
                        )
                    }
                </>
            ),
        },
        {
            title: "Second",
            content: (
                <div className="agreement-container" style={{ display: "flex", flexDirection: "column", gap: 25 }}>

                    <div>
                        <span className="block-span agreement-header-heading">Work-for-Hire Agreement</span>
                        <span className="block-span">This Work-for-Hire Agreement (the "Agreement") is made and entered into on {dayjs().format("MMMM DD, YYYY")} by and between the following parties:</span>
                    </div>

                    <div>
                        <div>
                            <span style={{ fontWeight: "bold" }}>Client: </span>
                            <span>{currentProfile.firstName} {currentProfile.lastName}</span>
                        </div>
                        <div>
                            <span style={{ fontWeight: "bold" }}>Service Provider: </span>
                            <span>{visionaryName}</span>
                        </div>
                    </div>

                    <div>
                        <ol>
                            <li className="agreement-point">
                                <span className="agreement-point-heading">Scope of Work:</span>
                                <span>The Service Provider agrees to perform the following services: <strong>"{hireTitle}"</strong>. All services will be performed according to the timeline and specifications agreed to through the Kaboom Collab platform.</span>
                            </li>
                            <li className="agreement-point">
                                <span className="agreement-point-heading">Compensation:</span>
                                <span>The Client agrees to pay the Service Provider a total of <strong> ${price.priceType === 'milestone' ? milestoneTotalAmount : price.value || 'amount'}</strong> for the completion of the work. Payment will be processed through the Kaboom Collab platform according to its standard terms.</span>
                            </li>
                            <li className="agreement-point">
                                <span className="agreement-point-heading">Work-for-Hire and Ownership:</span>
                                <span>The Parties agree that all work delivered under this Agreement shall be considered a 'work-for-hire.' All rights, title, and interest in the completed work shall be the sole property of the Client upon full payment.</span>
                            </li>
                            <li className="agreement-point">
                                <span className="agreement-point-heading">Confidentiality:</span>
                                <span>The Service Provider agrees not to disclose or use any confidential or proprietary information obtained during the course of this project.</span>
                            </li>
                            <li className="agreement-point">
                                <span className="agreement-point-heading">Independent Contractor:</span>
                                <span>The Service Provider is an independent contractor and not an employee of the Client. Nothing in this Agreement shall be construed as creating an employer-employee relationship.</span>
                            </li>
                            <li className="agreement-point">
                                <span className="agreement-point-heading">Revisions:</span>
                                <span>The Service Provider agrees to provide [#] revisions, if requested by the Client, as part of the original agreement.</span>
                            </li>
                            <li className="agreement-point">
                                <span className="agreement-point-heading">Termination:</span>
                                <span>Either party may terminate this Agreement with written notice. The Service Provider shall be compensated for completed work up to the termination date.</span>
                            </li>
                            <li className="agreement-point">
                                <span className="agreement-point-heading">Governing Law:</span>
                                <span>This Agreement shall be governed by the laws of [Your State]. Any disputes shall be resolved in the courts located in that jurisdiction.</span>
                            </li>
                        </ol>
                    </div>

                    <div style={{ display: "flex", flexDirection: 'column', gap: 20 }}>
                        <span className="block-span">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.</span>
                        <div style={{ display: "flex", flexDirection: 'column', gap: 30 }}>
                            <div>
                                <span className="block-span">Client Signature: <strong style={{ textDecoration: "underline" }}>{currentProfile.firstName} {currentProfile.lastName}</strong></span>
                                <span className="block-span">Printed Name: <strong style={{ textDecoration: "underline" }}>{currentProfile.firstName} {currentProfile.lastName}</strong></span>
                                <span className="block-span">Date: <strong style={{ textDecoration: "underline" }}>{dayjs().format("MMMM DD, YYYY")}</strong></span>
                            </div>
                            <div>
                                <span className="block-span">Service Provider Signature: <strong style={{ textDecoration: "underline" }}>{visionaryName}</strong></span>
                                <span className="block-span">Printed Name: <strong style={{ textDecoration: "underline" }}>{visionaryName}</strong></span>
                                <span className="block-span">Date: <strong style={{ textDecoration: "underline" }}>{dayjs().format("MMMM DD, YYYY")}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Checkbox checked={checked} onChange={onChange}>
                            Accept License Agreement
                        </Checkbox>
                    </div>

                </div>
            ),
        },
        {
            title: "Third",
            content: (
                <StripePayment description={hireDescription || undefined} title={hireTitle || undefined} paymentAmount={price.priceType === 'milestone' ? milestoneTotalAmount : (price.value ?? 0)} clientId={currentProfile.profileId!} visionaryId={visionary || undefined} priceType={price.priceType} startDate={hiringDate.start_datetime || undefined} endDate={hiringDate.end_datetime || undefined} setShowHireModal={setShowHireModal} milestones={milestones} receiverEmail={profile?.email || undefined} />
            )
        }
    ];

    const next = async () => {
        try {
            if (currentStep === 0) {
                await form.validateFields();
            }

            if (currentStep === 1 && !checked) {
                notify({ type: "error", message: "Please accept the License Agreement before proceeding." });
                return;
            }

            setCurrentStep(currentStep + 1);
        } catch (err) {
            console.log("Validation error", err);
        }
    };

    const prev = () => setCurrentStep(currentStep - 1);

    if (loading) {
        return (
            <div className={styles.profileCardMain}>
                <div className={styles.loadingCard}>
                    <Skeleton active />
                </div>
            </div>
        )
    }

    return (
        <div className="profile-page">
            <div className="floating-orb orb-1"></div>
            <div className="floating-orb orb-2"></div>
            <div className="floating-orb orb-3"></div>

            <MaxWidthWrapper withPadding={false} className="profile-container">
                <Modal
                    title={
                        <Title level={2}>
                            <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                                <span style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", padding: 10, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)" }}>
                                    <FaFileSignature size={24} />
                                </span>
                                <span style={{ color: 'white' }}>Kaboom Collab – Work-for-Hire Agreement</span>
                            </div>
                        </Title>
                    }
                    open={showHireModal}
                    onCancel={() => setShowHireModal(false)}
                    centered
                    width={900}
                    footer={null}
                    className="custom-modal"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {currentStep < 2 ? (
                            <Form
                                form={form}
                                layout="vertical"
                                name="agreement_form"
                                style={{ padding: '1rem 0' }}
                            >
                                {steps[currentStep].content}
                            </Form>
                        ) : (
                            <div style={{ padding: '1rem 0' }}>
                                {steps[currentStep].content}
                            </div>
                        )}

                        <div className="modal-footer">
                            {currentStep > 0 && (
                                <button className="action-btn secondary" onClick={() => prev()}>Back</button>
                            )}

                            {currentStep < steps.length - 1 && (
                                <button className="action-btn primary" onClick={() => next()} disabled={currentStep === 1 && !checked}>Next</button>
                            )}
                        </div>
                    </div>
                </Modal>

                <Drawer
                    placement="right"
                    onClose={onClose}
                    styles={{ header: { border: "none" } }}
                    open={open}
                    getContainer={false}
                    closeIcon={<RiCloseLargeFill />}
                    mask={false}
                >
                    <ProfileStats
                        completion={stats?.completionPercentage!}
                        Views={stats?.totalStats.views!}
                        Impressions={stats?.totalStats.impressions!}
                        Clicks={stats?.totalStats.clicks!}
                    />
                </Drawer>

                <div className="profile-header">
                    <div className="profile-cover">
                        <Image
                            src={profile?.profileCoverImage || coverImg}
                            alt="Cover"
                            className="cover-image"
                            width={1200}
                            height={280}
                            style={{ objectFit: 'cover' }}
                        />
                        {profile?.isOwnProfile && (
                            <button className="edit-cover-btn" onClick={() => coverInputRef.current?.click()}>
                                {profileCoverLoading ? <Skeleton.Button active size="small" shape="circle" /> : <Camera size={20} />}
                            </button>
                        )}
                        <input type="file" ref={coverInputRef} style={{ display: "none" }} onChange={handleAddCoverImage} />
                    </div>

                    <div className="profile-main-info">
                        <div className="profile-avatar-section">
                            <div className="profile-avatar-wrapper">
                                <UserAvatar
                                    size={160}
                                    className="profile-avatar"
                                    src={profile?.profileImage}
                                    lastSeen={profile?.last_seen}
                                    fallbackSrc={userImg}
                                    onlineDotStyle={{ display: 'none' }}
                                />
                                {profile?.isOwnProfile && (
                                    <button className="edit-avatar-btn" onClick={() => profileInputRef.current?.click()}>
                                        {profileUploadLoading ? <Skeleton.Button active size="small" shape="circle" /> : <Camera size={16} />}
                                    </button>
                                )}
                                <input type="file" ref={profileInputRef} style={{ display: "none" }} onChange={handleAddProfileImage} />
                                {showOnline && <div className="online-status"></div>}
                            </div>

                            <div className="profile-header-info">
                                <div className="profile-name-section">
                                    <h1 className="profile-name">{profile?.firstName} {profile?.lastName}</h1>
                                    {profile?.isOwnProfile && (
                                        <button className="edit-profile-btn">
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <p className="profile-username">@{profile?.userName}</p>
                                <p className="profile-title">{profile?.title}</p>

                                <div className="profile-meta">
                                    <div className="meta-item">
                                        <MapPin size={16} />
                                        <span>{profile?.country}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Calendar size={16} />
                                        <span>Member since {dayjs(profile?.createdAt).format("MMMM YYYY")}</span>
                                    </div>
                                    {!profile?.isClient && (
                                        <div className="meta-item rating">
                                            <Star size={16} fill="currentColor" />
                                            <span>4.5/5</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!profile?.isClient && (
                            <div className="profile-stats">
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <MessageCircle size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <p className="stat-label">Response Time</p>
                                        <p className="stat-value">{responseTime}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <p className="stat-label">Collabs Completed</p>
                                        <p className="stat-value">{collabsCompleted}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <Award size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <p className="stat-label">Services Offered</p>
                                        <p className="stat-value">{services?.totalServices || 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="profile-actions">
                            {(visionary && currentProfile.profileType === "client") && (
                                <button className="action-btn primary" onClick={handleOpenHireModal}>
                                    <MessageCircle size={20} />
                                    Let's Collab
                                </button>
                            )}
                            {profile?.isOwnProfile && !profile?.isClient && (
                                <button className="action-btn primary" onClick={showDrawer}>
                                    <MdQueryStats size={20} />
                                    View Insights
                                </button>
                            )}
                            {!profile?.isOwnProfile && (
                                <>
                                    <button className="action-btn secondary">
                                        <Mail size={20} />
                                        Send Message
                                    </button>
                                    <button className="action-btn secondary">
                                        <Phone size={20} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-content">
                    <div className="profile-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                            onClick={() => setActiveTab('about')}
                        >
                            About Me
                        </button>
                        {!profile?.isClient && (
                            <>
                                <button
                                    className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('portfolio')}
                                >
                                    Portfolio
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('services')}
                                >
                                    Services
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('certificates')}
                                >
                                    Certificates
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('experience')}
                                >
                                    Experience
                                </button>
                            </>
                        )}
                    </div>

                    <div className="tab-content">
                        {activeTab === 'about' && (
                            <div className="about-section glass-card">
                                <h2 className="section-title">About Me</h2>
                                <p className="about-text">{profile?.overview}</p>
                                {profile?.skills && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Skills and Expertise</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {profile.skills.map((skill, index) => (
                                                <span key={index} style={{
                                                    padding: '0.5rem 1rem',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    fontSize: '0.875rem'
                                                }}>{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'portfolio' && (
                            <div className="portfolio-section">
                                <PortfolioSample userId={profile?.profileId} />
                            </div>
                        )}

                        {activeTab === 'services' && (
                            <div className="services-section">
                                <ServiceSection services={services.services} isOwnProfile={profile?.isOwnProfile!} />
                            </div>
                        )}

                        {activeTab === 'certificates' && (
                            <div className="certificates-section">
                                <Certification profile={profile!} />
                            </div>
                        )}

                        {activeTab === 'experience' && (
                            <div className="experience-section">
                                <WorkExperience profile={profile!} />
                            </div>
                        )}
                    </div>
                </div>
            </MaxWidthWrapper>
        </div>
    )
}

export default ProfileDashboard
