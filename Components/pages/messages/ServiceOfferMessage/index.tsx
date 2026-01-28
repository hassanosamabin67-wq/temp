"use client"
import React, { useState, useRef } from 'react'
import userImg from '@/public/assets/img/userImg.webp'
import Image from 'next/image'
import { Button, Modal, Typography, Form, Rate, Input, Tag, InputNumber } from 'antd';
import { BsCartFill } from "react-icons/bs";
import { FaCheckSquare } from "react-icons/fa";
import { AiFillCloseSquare } from "react-icons/ai";
import { IoDocument } from "react-icons/io5";
import { MdDownload } from "react-icons/md";
import dayjs from 'dayjs';
import { useAppSelector } from '@/store';
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import { createOfferMessageNotification, createOfferMessageNotificationWithEmail } from '@/lib/notificationService';
import { FaFileZipper } from 'react-icons/fa6';
import styles from './style.module.css'
import { updateProfileRating } from '@/utils/updateProfileRating';

const { Title } = Typography;

interface ServiceOfferProps {
    serviceOrder: any;
    userDetail: any;
    conversationId: string;
}

const ServiceOfferMessage: React.FC<ServiceOfferProps> = ({ serviceOrder, userDetail, conversationId }) => {
    const profile = useAppSelector((state) => state.auth);
    const isOwnMessage = profile.profileId === serviceOrder.client_id;
    const { notify } = useNotification();

    const [localStatus, setLocalStatus] = useState(serviceOrder.status);
    const [submittedFileUrl, setSubmittedFileUrl] = useState(serviceOrder.file_url);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form] = Form.useForm();
    const tipPrice = Form.useWatch("tip_price", form);

    const clientDetail = userDetail[serviceOrder.client_id];
    const visionaryDetail = userDetail[serviceOrder.visionary_id];

    const isAccepted = localStatus === "Accepted";
    const isSubmitted = localStatus === "Submitted";
    const isApproved = localStatus === "Approved";
    const isRejected = localStatus === "Rejected";

    // Parse add-ons from JSON string
    const addOns = serviceOrder.add_ons ? JSON.parse(serviceOrder.add_ons) : [];
    const enabledAddOns = addOns.filter((addon: any) => addon.enabled);

    // Calculate total with add-ons
    const baseAmount = serviceOrder.amount;
    const addOnTotal = enabledAddOns.reduce((sum: number, addon: any) => sum + addon.price, 0);
    const totalAmount = baseAmount + addOnTotal;

    const handleAcceptServiceOffer = async () => {
        try {
            const { error } = await supabase
                .from("service_orders")
                .update({ status: "Accepted" })
                .eq("id", serviceOrder.id);

            if (error) {
                console.error("Error accepting service offer", error);
                return;
            }

            setLocalStatus("Accepted");

            try {
                await createOfferMessageNotificationWithEmail(
                    profile.profileId!,
                    profile.firstName!,
                    serviceOrder.client_id,
                    `${profile.firstName!} has accepted your service request`,
                    clientDetail.email,
                    serviceOrder.service_name || 'Service Request',
                    serviceOrder.id,
                    'offer-accepted',
                    'Service Request Accepted by',
                    `${conversationId}?ch=${profile.profileId!}`
                );
            } catch (error) {
                console.error("Error sending notification:", error);
            }

            notify({ type: 'success', message: 'Service request accepted!' });
        } catch (err) {
            console.error("Unexpected error:", err);
        }
    };

    const handleRejectServiceOffer = async () => {
        try {
            const { error } = await supabase
                .from("service_orders")
                .update({ status: "Rejected" })
                .eq("id", serviceOrder.id);

            if (error) {
                console.error("Error rejecting service offer", error);
                return;
            }

            setLocalStatus("Rejected");

            try {
                await createOfferMessageNotificationWithEmail(
                    profile.profileId!,
                    profile.firstName!,
                    serviceOrder.client_id,
                    "Your service request has been rejected",
                    clientDetail.email,
                    serviceOrder.service_name || 'Service Request',
                    serviceOrder.id,
                    'offer-declined',
                    'Service Request Rejected by',
                    `${conversationId}?ch=${profile.profileId!}`
                );
            } catch (error) {
                console.error("Error sending notification:", error);
            }

            notify({ type: 'success', message: 'Service request rejected.' });
        } catch (err) {
            console.error("Unexpected error:", err);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.name.endsWith('.zip')) {
            notify({ type: "error", message: "Please upload a .zip file." });
            return;
        }
        setAttachedFile(file);
    };

    const handleSubmitWork = async () => {
        if (!attachedFile) return;

        setIsSubmitting(true);
        const fileName = `${Date.now()}-${attachedFile.name}`;
        const filePath = `submitted/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('submitted-work')
                .upload(filePath, attachedFile);

            if (uploadError) {
                notify({ type: "error", message: "Failed to upload file." });
                return;
            }

            const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/submitted-work/${filePath}`;

            const { error: updateError } = await supabase
                .from('service_orders')
                .update({
                    status: 'Submitted',
                    file_url: fileUrl,
                })
                .eq('id', serviceOrder.id);

            if (updateError) {
                notify({ type: "error", message: "Failed to update service order." });
                return;
            }

            try {
                await createOfferMessageNotification(
                    profile.profileId!,
                    profile.firstName!,
                    serviceOrder.client_id,
                    `${profile.firstName!} has submitted the work! Please review it.`,
                    serviceOrder.service_name,
                    `${conversationId}?ch=${profile.profileId!}`
                );
            } catch (error) {
                console.error("Error sending notification:", error);
            }

            setSubmittedFileUrl(fileUrl);
            setLocalStatus("Submitted");
            notify({ type: "success", message: "Work submitted successfully!" });

        } catch (err) {
            console.error("Error submitting work:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveWork = async () => {
        try {
            setIsApproving(true);
            const tip = form.getFieldValue("tip_price") || 0;
            const values = await form.validateFields();

            const { error } = await supabase
                .from('service_orders')
                .update({
                    status: 'Approved',
                    review: values.review,
                    review_message: values.review_message,
                    ...(tip > 0 && { tip_price: tip })
                })
                .eq('id', serviceOrder.id);

            if (error) {
                notify({ type: "error", message: "Failed to approve work." });
                return;
            }

            const { data: existingService, error: fetchError } = await supabase
                .from('service')
                .select('reviews, review_message')
                .eq('id', serviceOrder.service_id)
                .single();

            if (fetchError) {
                console.error("Failed to fetch existing reviews. :", fetchError);
                return;
            }

            const reviewPayload = [
                ...(existingService.review_message || []),
                {
                    rating: values.review,
                    clientName: `${profile.firstName} ${profile.lastName}`,
                    reviewMessage: values.review_message
                }
            ];
            const updatedReviews = [...(existingService.reviews || []), values.review];

            const { error: serviceReviewError } = await supabase
                .from('service')
                .update({
                    reviews: updatedReviews,
                    review_message: reviewPayload
                })
                .eq('id', serviceOrder.service_id);

            if (serviceReviewError) {
                notify({ type: "error", message: "Failed to add review." });
                console.error("Update error:", serviceReviewError);
                return;
            }

            const amount = totalAmount + (tip > 0 ? tip : 0);

            const res = await fetch('/api/stripe/completed-order-release', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visionary: serviceOrder.visionary_id,
                    amount
                }),
            });

            if (!res.ok) {
                const result = await res.json();
                notify({ type: 'error', message: result.error || 'Failed to release payment.' });
                return;
            }

            try {
                await updateProfileRating({ profileId: serviceOrder.visionary_id, rating: values.review })
            } catch (error) {
                console.error("Error updating profile rating:", error)
            }

            try {
                await createOfferMessageNotificationWithEmail(
                    profile.profileId!,
                    profile.firstName!,
                    visionaryDetail.userId,
                    `Your service work has been approved by ${profile.firstName!}`,
                    visionaryDetail.email,
                    serviceOrder.service_name,
                    serviceOrder.id,
                    'work-approved',
                    'New Payment Received from',
                    `${conversationId}?ch=${profile.profileId!}`
                );
            } catch (error) {
                console.error("Error sending notification:", error);
            }

            setLocalStatus("Approved");
            setShowReviewModal(false);
            form.resetFields();
            notify({ type: "success", message: "Work approved and payment released!" });

        } catch (err) {
            console.error("Error approving work:", err);
        } finally {
            setIsApproving(false);
        }
    };

    const getDownloadUrl = (url: string) => {
        const { data } = supabase.storage
            .from('submitted-work')
            .getPublicUrl(url);
        return data.publicUrl;
    };

    const getFileName = (url: string) => {
        return url.split('/').pop()?.split('-').slice(1).join('-') || 'Download file';
    };

    return (
        <>
            <Modal
                title={<Title level={2} style={{ marginBottom: 0 }}>Review Service Work</Title>}
                open={showReviewModal}
                onCancel={() => setShowReviewModal(false)}
                footer={null}
                width={500}
                centered
            >
                <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                    <Form.Item
                        label="Give Review"
                        name="review"
                        rules={[{ required: true, message: 'Please give a rating.' }]}
                    >
                        <Rate allowHalf style={{ fontSize: 35 }} />
                    </Form.Item>
                    <Form.Item
                        label="Write a Review"
                        name="review_message"
                        rules={[{ required: true, message: 'Please write a review.' }]}
                    >
                        <Input.TextArea placeholder='Write review' />
                    </Form.Item>
                    <Form.Item label="Add Tip" name="tip_price">
                        <InputNumber
                            min={1}
                            prefix="$"
                            style={{ width: '100%' }}
                            placeholder="Enter Tip amount"
                            disabled={!isOwnMessage}
                        />
                    </Form.Item>
                </Form>
                <div style={{ marginBottom: 15 }}>
                    <strong>Service Amount: </strong>${totalAmount}{tipPrice ? <span>+ Tip: ${tipPrice}</span> : null}
                </div>
                <Button
                    type='primary'
                    style={{ width: "100%" }}
                    loading={isApproving}
                    onClick={handleApproveWork}
                >
                    Approve Work
                </Button>
            </Modal>

            <div className={`${styles.offerMessage} ${styles.serviceOffer} ${isOwnMessage ? `${styles.ownerMessage}` : ""}`}>
                <div className={`${isOwnMessage ? `${styles.ownerOffer}` : ""}`} style={{ display: "flex", gap: 10 }}>
                    <Image className={styles.messageSenderImage} src={userImg} alt='user-img' width={300} height={300} />
                    <div className={styles.serviceOfferContainer}>
                        <div className={styles.offerSender}>
                            <span className={styles.messageSenderName}>
                                {isOwnMessage ? "You" : clientDetail?.firstName + " " + clientDetail?.lastName}
                            </span>
                            <span>{isOwnMessage ? "Service Purchase Request" : "Service request received"}</span>
                        </div>

                        <div className={styles.serviceOfferBox}>
                            <div className={styles.serviceOfferHeader} style={{
                                backgroundColor: '#e6f7ff',
                                padding: '10px 15px',
                                borderRadius: '8px 8px 0 0',
                                borderBottom: '1px solid #d9d9d9'
                            }}>
                                <BsCartFill className={styles.messageIcon} style={{ color: '#1890ff' }} />
                                <span className={styles.offerHeading} style={{ fontSize: 16, fontWeight: 600 }}>
                                    {isOwnMessage ? "Service Purchase" : "Service Request"}
                                </span>
                                <span style={{ color: '#666' }}>({serviceOrder.package_name})</span>
                            </div>

                            <div className={styles.serviceDetails} style={{ padding: '15px' }}>
                                <h4 style={{ marginBottom: 10, color: '#1890ff' }}>
                                    {serviceOrder.service_name}
                                </h4>

                                {serviceOrder.details_text && (
                                    <p style={{ marginBottom: 15, color: '#666' }}>
                                        {serviceOrder.details_text}
                                    </p>
                                )}

                                <div className={styles.servicePricing} style={{
                                    backgroundColor: '#fafafa',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    marginBottom: '15px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span><strong>Base Price:</strong></span>
                                        <span>${baseAmount}</span>
                                    </div>

                                    {enabledAddOns.length > 0 && (
                                        <div style={{ marginBottom: 10 }}>
                                            <strong>Add-ons:</strong>
                                            {enabledAddOns.map((addon: any, index: number) => (
                                                <div key={addon.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginLeft: 10,
                                                    fontSize: '14px'
                                                }}>
                                                    <span>• {addon.name}</span>
                                                    <span>+${addon.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontWeight: 600,
                                        fontSize: '16px',
                                        paddingTop: '8px',
                                        borderTop: '1px solid #d9d9d9'
                                    }}>
                                        <span>Total Amount:</span>
                                        <span>${totalAmount}</span>
                                    </div>

                                    {serviceOrder.deadline && (
                                        <div style={{ marginTop: 10 }}>
                                            <strong>Deadline:</strong> {dayjs(serviceOrder.deadline).format("MMM DD, YYYY")}
                                        </div>
                                    )}
                                </div>

                                {/* Reference Files Display */}
                                {serviceOrder.reference_file && serviceOrder.reference_file.length > 0 && (
                                    <div className={styles.referenceFiles} style={{ marginBottom: 15 }}>
                                        <strong style={{ display: 'block', marginBottom: 8 }}>Reference Files:</strong>
                                        {serviceOrder.reference_file.map((fileUrl: string, index: number) => (
                                            <div key={index} className={styles.fileItem} style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: 'space-between',
                                                border: "1px solid #e8e8e8",
                                                padding: '8px 12px',
                                                margin: "5px 0",
                                                borderRadius: '6px',
                                                backgroundColor: '#f9f9f9'
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <IoDocument style={{ fontSize: 18, color: "#1890ff" }} />
                                                    <span style={{ fontSize: 14 }}>
                                                        {getFileName(fileUrl)}
                                                    </span>
                                                </div>
                                                <a href={fileUrl} target='_blank' rel='noopener noreferrer'>
                                                    <MdDownload style={{
                                                        fontSize: 18,
                                                        color: '#1890ff',
                                                        cursor: 'pointer'
                                                    }} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Status Tags */}
                                <div>
                                    {isAccepted && <Tag color="green">Accepted</Tag>}
                                    {isRejected && <Tag color="red">Rejected</Tag>}
                                    {isSubmitted && <Tag color="blue">Work Submitted</Tag>}
                                    {isApproved && <Tag color="purple">Completed</Tag>}
                                    {!isAccepted && !isRejected && !isSubmitted && !isApproved && (
                                        <Tag color="orange">Pending Response</Tag>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons for visionary (receiver) */}
                            {!isOwnMessage && (!isAccepted && !isRejected) && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: '0 15px 15px'
                                }}>
                                    <Button
                                        onClick={handleRejectServiceOffer}
                                        className={styles.offerButton}
                                        disabled={isAccepted || isSubmitted || isApproved || isRejected}
                                        icon={<AiFillCloseSquare className={styles.rejectIcon} />}
                                        danger
                                    >
                                        Decline Request
                                    </Button>
                                    <Button
                                        onClick={handleAcceptServiceOffer}
                                        className={styles.offerButton}
                                        type="primary"
                                        disabled={isAccepted || isSubmitted || isApproved || isRejected}
                                        icon={<FaCheckSquare className={styles.checkIcon} />}
                                    >
                                        Accept Request
                                    </Button>
                                </div>
                            )}

                            {/* Status indicators for client (sender) */}
                            {isOwnMessage && (
                                <div style={{ padding: '0 15px 15px' }}>
                                    {isAccepted && <Button disabled icon={<FaCheckSquare />} type="primary">Request Accepted</Button>}
                                    {isRejected && <Button disabled icon={<AiFillCloseSquare />} danger>Request Declined</Button>}
                                    {!isAccepted && !isRejected && <Button disabled>Awaiting Response</Button>}
                                </div>
                            )}

                            {/* Work submission area (for accepted requests) */}
                            {(!isOwnMessage && isAccepted) && (
                                <div className={styles.workSubmissionArea} style={{
                                    margin: '15px',
                                    padding: 15,
                                    backgroundColor: '#f0f9ff',
                                    borderRadius: 8,
                                    border: '1px solid #bae7ff'
                                }}>
                                    <h5 style={{ marginBottom: 15, color: '#1890ff' }}>Work Delivery</h5>

                                    {submittedFileUrl && (
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: 'space-between',
                                            border: "1px solid #d7d7d7",
                                            padding: 12,
                                            marginBottom: 15,
                                            borderRadius: '6px',
                                            backgroundColor: 'white'
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <IoDocument style={{ fontSize: 20, color: "#52c41a" }} />
                                                <span style={{ fontWeight: 500 }}>Delivered Work</span>
                                            </div>
                                            <a href={getDownloadUrl(submittedFileUrl)} target='_blank' rel='noopener noreferrer'>
                                                <MdDownload style={{
                                                    fontSize: 22,
                                                    padding: 4,
                                                    borderRadius: "50%",
                                                    border: "2px solid #52c41a",
                                                    color: '#52c41a'
                                                }} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isOwnMessage && !isSubmitted && !isApproved && (
                                <div style={{ display: "flex", gap: 10 }}>
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSubmitted}
                                        icon={<FaFileZipper />}
                                    >
                                        Upload Work
                                    </Button>
                                    <Button
                                        type='primary'
                                        disabled={!attachedFile || isSubmitted}
                                        loading={isSubmitting}
                                        onClick={handleSubmitWork}
                                    >
                                        Submit Work
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                        onChange={handleFileUpload}
                                        accept=".zip"
                                    />
                                </div>
                            )}

                            {(isOwnMessage && isSubmitted) && (
                                <Button
                                    type='primary'
                                    onClick={() => setShowReviewModal(true)}
                                    disabled={isApproved}
                                    style={{ width: '100%' }}
                                >
                                    {isApproved ? 'Work Approved' : 'Review & Approve Work'}
                                </Button>
                            )}

                            {!isOwnMessage && isSubmitted && (
                                <Button disabled style={{ width: '100%' }}>
                                    Work Submitted - Awaiting Review
                                </Button>
                            )}

                            {isApproved && (
                                <Button
                                    disabled
                                    icon={<FaCheckSquare />}
                                    style={{ color: '#52c41a', width: '100%' }}
                                >
                                    Order Completed & Approved
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <span className={styles.messageTime}>
                    {dayjs(serviceOrder.created_at).calendar(null, {
                        sameDay: '[Today] h:mm A',
                        lastDay: '[Yesterday] h:mm A',
                        lastWeek: 'dddd h:mm A',
                        sameElse: 'DD/MM/YYYY h:mm A'
                    })}
                </span>
            </div >
        </>
    );
};

export default ServiceOfferMessage;