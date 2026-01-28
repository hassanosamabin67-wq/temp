"use client"

import React, { useEffect, useRef, useState } from 'react'
import userImg from '@/public/assets/img/userImg.webp'
import Image from 'next/image'
import { Button, Modal, Typography, Form, InputNumber, Rate, Input } from 'antd';
import { BsEnvelopePaperFill } from "react-icons/bs";
import { FaCheckSquare, FaAngleDown, FaAngleUp } from "react-icons/fa";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'
import { useAppSelector } from '@/store';
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import { IoDocument } from "react-icons/io5";
import { MdDownload } from "react-icons/md";
import { FaFileZipper } from "react-icons/fa6";
import { AiFillCloseSquare } from "react-icons/ai";
import { createOfferMessageNotification, createOfferMessageNotificationWithEmail } from '@/lib/notificationService';
import { updateProfileRating } from '@/utils/updateProfileRating';

dayjs.extend(relativeTime)
dayjs.extend(calendar)

const { Title } = Typography;

interface offerProps {
    offerPrice?: any;
    startDate?: any;
    endDate?: any;
    userDetail?: any;
    offerStatus?: string;
    offerSendTime?: any;
    clientId?: string;
    receiverId?: string | null;
    orderId: string;
    fileUrl?: string;
    priceType: string;
    description?: string;
    title?: string;
    milestone?: any;
    conversationId: string;
    serviceId: string;
}

const OfferMessage: React.FC<offerProps> = ({ offerPrice, startDate, endDate, userDetail, offerStatus, offerSendTime, clientId, receiverId, orderId, fileUrl, priceType, description, title, milestone, conversationId, serviceId }) => {
    const clientDetail = userDetail[clientId!];
    const visionaryDetail = userDetail[receiverId!]
    const profile = useAppSelector((state) => state.auth);
    const isOwnMessage = profile.profileId === clientId;
    const { notify } = useNotification();
    const [localStatus, setLocalStatus] = useState(offerStatus);
    const isOfferAccepted = localStatus === "Accepted";
    const isWorkSubmitted = localStatus === "Submitted";
    const isOfferApproved = localStatus === "Approved";
    const isOfferRejected = localStatus === "Rejected";
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [submittedFileUrl, setSubmittedFileUrl] = useState<string | null>(fileUrl || null);
    const [milestoneStatusMap, setMilestoneStatusMap] = useState<Record<string, { status: string; fileUrl: string | null }>>({});
    const [milestoneUploads, setMilestoneUploads] = useState<Record<string, { file?: File; fileUrl?: string; status?: string }>>({});
    const [milestoneId, setMilestoneId] = useState<string | null>(null);
    const fileName = submittedFileUrl?.split('/').pop()?.split('-').slice(1).join('-') || "Download file";
    const priceTypeLabels: Record<string, string> = {
        milestone: "Milestone Based",
        fixed: "Fixed Price",
        hourly: "Hourly Rate"
    };
    const priceTypeLabel = priceTypeLabels[priceType] || "Service Buy Request";
    const [showMilestone, setShowMilestone] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [form] = Form.useForm();
    const tipPrice = Form.useWatch("tip_price", form);
    const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
    const [showCompleteProjectModal, setShowCompleteProjectModal] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.zip')) {
            notify({ type: "error", message: "Please upload a .zip file." })
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
                notify({ type: "error", message: "Failed to upload file." })
                console.error("Failed to upload file.", uploadError);
                return;
            }

            const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/submitted-work/${filePath}`;

            const { error: updateError } = await supabase
                .from('order')
                .update({
                    status: 'Submitted',
                    file_url: fileUrl,
                })
                .eq('id', orderId);

            if (updateError) {
                notify({ type: "error", message: "Failed to update order status." })
                console.error("Failed to update order status.", updateError);
                return;
            }

            try {
                await createOfferMessageNotification(profile.profileId!, profile.firstName!, clientId!, `${profile.firstName!} has submitted the work!, please review it.`, title!, `${conversationId}?ch=${profile.profileId!}`)
            } catch (error) {
                console.error("Error Sending Notification: ", error)
            }

            notify({ type: "success", message: "Work submitted successfully!" })
            setSubmittedFileUrl(fileUrl);
            setLocalStatus("Submitted")

        } catch (err) {
            notify({ type: "error", message: "Unexpected error occurred." })
            console.error("Unexpected error occurred.", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveWork = async (orderId: string) => {
        setIsApproving(true);
        try {
            const tip = form.getFieldValue("tip_price") || 0;
            const values = await form.validateFields();

            const visionary = receiverId;
            const amount = offerPrice + (tip > 0 ? tip : 0);

            // Call payment release API first before updating status
            const res = await fetch('/api/stripe/completed-order-release', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    visionary,
                    amount
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                notify({ type: 'error', message: result.error || 'Failed to release payment.' });
                console.error("Payment release failed:", result);
                return;
            }

            // Only update order status after successful payment release
            const { error } = await supabase
                .from('order')
                .update({
                    status: 'Approved',
                    review: values.review,
                    review_message: values.review_message,
                    ...(tip > 0 && { tip_price: tip })
                })
                .eq('id', orderId);

            if (error) {
                notify({ type: "error", message: "Failed to approve work." });
                console.error("Failed to approve work.", error);
                return;
            }

            try {
                await updateProfileRating({ profileId: receiverId!, rating: values.review })
            } catch (error) {
                console.error("Error updating profile rating:", error)
            }

            await supabase.from("contract_tool_usage").update({ status: "Completed" }).eq("for", orderId)

            try {
                await createOfferMessageNotificationWithEmail(profile.profileId!, profile.firstName!, visionaryDetail.userId, `Your Work has been approved by ${profile.firstName!}`, visionaryDetail.email, title!, orderId, 'work-approved', "New Payment Received from", `${conversationId}?ch=${profile.profileId!}`)
            } catch (error) {
                console.error("Error Sending Email Notification: ", error)
            }

            notify({ type: "success", message: "Work approved and payment released!" });
            setLocalStatus("Approved");
            form.resetFields(["tip_price"]);
            setShowPaymentModal(false);

        } catch (err) {
            console.error("Unexpected error occurred.", err);
        } finally {
            setIsApproving(false);
        }
    };

    const getDownloadUrl = () => {
        const { data } = supabase
            .storage
            .from('submitted-work')
            .getPublicUrl(submittedFileUrl!);

        return data.publicUrl;
    };

    const handleAcceptOffer = async (orderId: string) => {
        try {
            const { error } = await supabase
                .from("order")
                .update({ status: "Accepted" })
                .eq("id", orderId)
            // .or(`client_id.eq."${profile.profileId}",visionary_id.eq."${profile.profileId}"`)

            if (error) {
                console.error("Error Accepting the offer", error);
                return
            }

            setLocalStatus("Accepted");

            await supabase.from("contract_tool_usage").update({ status: "Pending" }).eq("for", orderId)

            try {
                await createOfferMessageNotificationWithEmail(profile.profileId!, profile.firstName!, clientId!, `${profile.firstName!} has accepted your offer`, clientDetail.email, title!, orderId, 'offer-accepted', 'Offer Accepted by', `${conversationId}?ch=${profile.profileId!}`)
            } catch (error) {
                console.error("Error Sending Email Notification: ", error)
            }

            notify({
                type: 'success',
                message: 'You Accepted the offer',
            });

        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    }

    const handleRejectOffer = async (orderId: string) => {
        try {
            const { error } = await supabase
                .from("order")
                .update({ status: "Rejected" })
                .eq("id", orderId)
            // .or(`client_id.eq."${profile.profileId}",visionary_id.eq."${profile.profileId}"`)

            if (error) {
                console.error("Error Rejecting the offer", error);
                return
            }

            setLocalStatus("Rejected");

            await supabase.from("contract_tool_usage").update({ status: "Rejected" }).eq("for", orderId)

            try {
                await createOfferMessageNotificationWithEmail(profile.profileId!, profile.firstName!, clientId!, "Your Offer Has been rejected", clientDetail.email, title!, orderId, 'offer-declined', 'Offer Rejected by', `${conversationId}?ch=${profile.profileId!}`)
            } catch (error) {
                console.error("Error Sending Email Notification: ", error)
            }

            notify({
                type: 'success',
                message: 'You Rejected the offer',
            });

        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    }

    useEffect(() => {
        const channel = supabase.channel(`order-status-${clientId}-${receiverId}`);

        channel
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'order',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    const updatedStatus = payload.new.status;
                    if (payload.new.file_url) {
                        setSubmittedFileUrl(payload.new.file_url)
                    }
                    setLocalStatus(updatedStatus);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [clientId, receiverId]);

    const handleMilestoneFileUpload = (e: React.ChangeEvent<HTMLInputElement>, milestoneId: string) => {
        const file = e.target.files?.[0];
        if (!file || !file.name.endsWith('.zip')) {
            notify({ type: "error", message: "Please upload a .zip file." });
            return;
        }

        setMilestoneUploads(prev => ({
            ...prev,
            [milestoneId]: {
                ...prev[milestoneId],
                file
            }
        }));
    };

    const handleMilestoneSubmitWork = async (id: string) => {
        const current = milestoneUploads[id];
        if (!current?.file) return;

        setMilestoneId(id);

        const fileName = `${Date.now()}-${current.file.name}`;
        const filePath = `submitted/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('submitted-work')
                .upload(filePath, current.file);

            if (uploadError) {
                notify({ type: "error", message: "Failed to upload file." });
                return;
            }

            const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/submitted-work/${filePath}`;

            const { error: updateError } = await supabase
                .from('milestone_payment')
                .update({ status: 'Submitted', file_url: fileUrl })
                .eq('id', id);

            if (updateError) {
                notify({ type: "error", message: "Failed to update milestone." });
                return;
            }

            try {
                await createOfferMessageNotification(profile.profileId!, profile.firstName!, clientId!, `${profile.firstName!} has submitted the work!, please review it.`, title!, `${conversationId}?ch=${profile.profileId!}`)
            } catch (error) {
                console.error("Error Sending Notification: ", error)
            }

            notify({ type: "success", message: "Milestone work submitted!" });

            setMilestoneUploads(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    fileUrl,
                    status: 'Submitted'
                }
            }));
        } catch (err) {
            notify({ type: "error", message: "Unexpected error occurred." });
        } finally {
            setMilestoneId(null);
        }
    };

    const handleMilestoneApprove = async (milestoneId: string) => {
        try {
            setIsApproving(true);
            const { data: milestoneData, error: fetchError } = await supabase
                .from('milestone_payment')
                .select('amount, order_id')
                .eq('id', milestoneId)
                .single();

            if (fetchError || !milestoneData) {
                notify({ type: "error", message: "Failed to fetch milestone details." });
                console.error("Milestone fetch error:", fetchError);
                return;
            }

            const { amount, order_id } = milestoneData;
            const visionary = receiverId;

            // Call payment release API first before updating status
            const res = await fetch('/api/stripe/completed-order-release', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order_id,
                    visionary,
                    amount,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                notify({ type: 'error', message: result.error || 'Failed to release milestone payment.' });
                console.error("Milestone payment release failed:", result);
                return;
            }

            // Only update milestone status after successful payment release
            const { error: updateError } = await supabase
                .from('milestone_payment')
                .update({ status: 'Approved' })
                .eq('id', milestoneId);

            if (updateError) {
                notify({ type: "error", message: "Failed to approve milestone work." });
                console.error("Milestone approval error:", updateError);
                return;
            }

            await supabase.from("contract_tool_usage").update({ status: "Completed" }).eq("for", order_id)
            try {
                await createOfferMessageNotificationWithEmail(profile.profileId!, profile.firstName!, visionaryDetail.userId, `Your Work has been approved by ${profile.firstName!}`, visionaryDetail.email, title!, orderId, 'work-approved', 'New Payment Received from', `${conversationId}?ch=${profile.profileId!}`)
            } catch (error) {
                console.error("Error Sending Email Notification: ", error)
            }
            notify({ type: "success", message: "Milestone approved and payment released!" });

        } catch (err) {
            notify({ type: "error", message: "Unexpected error occurred." });
            console.error("Unexpected error during milestone approval:", err);
        } finally {
            setIsApproving(false);
        }
    };

    const handleCompleteProjectWithReview = async () => {
        try {
            setIsApproving(true);

            const values = await form.validateFields();
            const tip = form.getFieldValue("tip_price") || 0;
            const tipFormatted = `$${Number(tip).toFixed(2)}`;
            const message = tip > 0
                ? `Your project has been marked complete by ${profile.firstName!}, and includes a tip of ${tipFormatted} for your great work!`
                : `Your project has been marked complete by ${profile.firstName!}.`;

            const { error: updateError } = await supabase
                .from('order')
                .update({
                    status: 'Approved',
                    review: values.review,
                    review_message: values.review_message,
                    ...(tip > 0 && { tip_price: tip })
                })
                .eq('id', orderId);

            if (updateError) {
                notify({ type: 'error', message: 'Failed to complete project.' });
                console.error('Complete project error:', updateError);
                return;
            }

            try {
                await updateProfileRating({ profileId: receiverId!, rating: values.review })
            } catch (error) {
                console.error("Error updating profile rating:", error)
            }

            await supabase.from("contract_tool_usage").update({ status: "Completed" }).eq("for", orderId);

            try {
                await createOfferMessageNotificationWithEmail(
                    profile.profileId!,
                    profile.firstName!,
                    visionaryDetail.userId,
                    message,
                    visionaryDetail.email,
                    title!,
                    orderId,
                    'project-completed',
                    'Project Completed by',
                    `${conversationId}?ch=${profile.profileId!}`
                );
            } catch (error) {
                console.error('Error Sending Email Notification: ', error);
            }

            notify({ type: 'success', message: 'Project completed!' });
            setLocalStatus('Approved');
            form.resetFields();
            setShowCompleteProjectModal(false);
        } catch (err) {
            notify({ type: 'error', message: 'Unexpected error occurred.' });
            console.error('Unexpected error during project completion:', err);
        } finally {
            setIsApproving(false);
        }
    };

    useEffect(() => {
        const fetchMilestoneStatuses = async () => {
            if (!milestone || milestone.length === 0) return;

            const ids = milestone.map((m: any) => m.id);
            const { data, error } = await supabase
                .from('milestone_payment')
                .select('id, status, file_url')
                .in('id', ids);

            if (!error && data) {
                const statusMap: Record<string, { status: string; fileUrl: string | null }> = {};
                data.forEach((entry) => {
                    statusMap[entry.id] = {
                        status: entry.status,
                        fileUrl: entry.file_url,
                    };
                });
                setMilestoneStatusMap(statusMap);
            }
        };

        fetchMilestoneStatuses();
    }, [milestone]);

    useEffect(() => {
        if (!milestone || milestone.length === 0) return;

        const channel = supabase
            .channel('milestone-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'milestone_payment',
                },
                (payload) => {
                    const updated = payload.new as {
                        id: string;
                        status: string;
                        file_url: string | null;
                    };

                    if (!updated?.id) return;

                    setMilestoneStatusMap((prev) => ({
                        ...prev,
                        [updated.id]: {
                            status: updated.status,
                            fileUrl: updated.file_url,
                        },
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [milestone]);

    return (
        <>
            <Modal
                title={
                    <Title level={2} style={{ marginBottom: 0 }}>
                        Approve work
                    </Title>
                }
                open={showPaymentModal}
                onCancel={() => setShowPaymentModal(false)}
                footer={null}
                width={500}
                centered
            >
                <>
                    <Form
                        form={form}
                        layout="vertical"
                        name="order_payment_form"
                        style={{ marginTop: 20 }}
                    >
                        <Form.Item
                            label="Give Review"
                            name="review"
                            rules={[{ required: true, message: 'Please give a rating.' }]}
                        >
                            <Rate tooltips={desc} allowHalf style={{ fontSize: 35 }} />
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
                    <div>Order Amount: ${offerPrice} {tipPrice ? <span>+ Tip: ${tipPrice}</span> : null}</div>
                    <Button type='primary' style={{ width: "100%" }} disabled={!isWorkSubmitted || isApproving || isOfferApproved} loading={isApproving} onClick={() => handleApproveWork(orderId)}>Approve</Button>
                </>
            </Modal>

            <Modal
                title={
                    <Title level={2} style={{ marginBottom: 0 }}>
                        Complete Project
                    </Title>
                }
                open={showCompleteProjectModal}
                onCancel={() => setShowCompleteProjectModal(false)}
                footer={null}
                width={500}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="complete_project_form"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        label="Give Review"
                        name="review"
                        rules={[{ required: true, message: 'Please give a rating.' }]}
                    >
                        <Rate tooltips={desc} allowHalf style={{ fontSize: 35 }} />
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
                <Button
                    type='primary'
                    style={{ width: "100%" }}
                    loading={isApproving}
                    onClick={handleCompleteProjectWithReview}
                >
                    Complete Project
                </Button>
            </Modal>

            <div className={`offer-message ${isOwnMessage ? "owner-message" : ""}`}>
                <div className={`${isOwnMessage ? "owner-offer" : ""}`} style={{ display: "flex", gap: 10 }}>
                    <Image className='message-sender-image' src={userImg} alt='user-img' width={300} height={300} />
                    <div className='offer-container'>
                        <div className='offer-sender'>
                            <span className='message-sender-name'>{isOwnMessage ? "You" : clientDetail?.firstName + clientDetail?.lastName}</span>
                            <span>Hi, I have an offer for you.</span>
                        </div>
                        <div className='offer-box'>
                            <div className='offer-box-header'>
                                <BsEnvelopePaperFill className='message-icon' />
                                <span className='offer-heading'>{isOwnMessage ? "Hiring Offer" : "Offer Received"}</span>
                                <span>({priceTypeLabel})</span>
                            </div>
                            <div className='hire-credentials'>
                                <span className="hire-title">{title}</span>
                                <p>{description}</p>
                            </div>
                            {priceType === "milestone" ? (
                                <div style={{ padding: "10px 0" }}>
                                    <button className='milestone-btn' onClick={() => setShowMilestone(!showMilestone)}>Click to view milestone {showMilestone ? <FaAngleUp /> : <FaAngleDown />}</button>
                                    {showMilestone && (
                                        <div className='milestone'>
                                            <div className="milestone-header">
                                                <span className='row-item'>Milestone</span>
                                                <span className='row-item'>Description</span>
                                                <span className='row-item'>Amount</span>
                                                <span className='row-item'>Due Date</span>
                                            </div>
                                            <div className="milestone-body">
                                                {milestone && milestone.map((data: any, index: any) => {
                                                    const uploadData = milestoneUploads?.[data.id];
                                                    const statusData = milestoneStatusMap?.[data.id];
                                                    const currentStatus = statusData?.status || uploadData?.status;
                                                    const isSubmitted = currentStatus === 'Submitted';
                                                    const isApproved = currentStatus === 'Approved';
                                                    const fileUrl = statusData?.fileUrl || uploadData?.fileUrl;
                                                    const fileName = fileUrl?.split('/').pop()?.split('-').slice(1).join('-') || '';

                                                    return (
                                                        <div key={data.id}>
                                                            <div className='milestone-items'>
                                                                <span className='row-item'>#{index + 1}</span>
                                                                <span className='row-item'>{data.title}</span>
                                                                <span className='row-item'>${data.amount}</span>
                                                                <span className='row-item'>{dayjs(data.due_date).format("MMM DD YYYY")}</span>
                                                            </div>
                                                            <div style={{ margin: "10px 0" }}>
                                                                {fileUrl && (
                                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: 'space-between', border: "1px solid #d7d7d7", padding: 10, marginBottom: 5 }}>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                                            <IoDocument style={{ fontSize: 20, color: "#c9c9c9" }} />
                                                                            <span style={{ fontSize: 15, fontWeight: 500 }}>{fileName}</span>
                                                                        </div>
                                                                        <a href={fileUrl} target='_blank' rel='noopener noreferrer'>
                                                                            <MdDownload style={{ fontSize: 25, padding: 2, borderRadius: "100%", border: "1px solid" }} />
                                                                        </a>
                                                                    </div>
                                                                )}
                                                                {isOwnMessage && (isSubmitted || isApproved) && (
                                                                    <Button type='primary' style={{ width: "100%" }} disabled={isApproved} loading={isApproving} onClick={() => handleMilestoneApprove(data.id)}>{isSubmitted ? "Approve" : "Approved"}</Button>
                                                                )}
                                                                {!isOwnMessage && (
                                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                                        <Button onClick={() => document.getElementById(`milestone-input-${data.id}`)?.click()} icon={<FaFileZipper />} disabled={isSubmitted || isApproved}>Upload Zip</Button>
                                                                        <Button type='primary' onClick={() => handleMilestoneSubmitWork(data.id)} loading={milestoneId === data.id} disabled={!uploadData || isSubmitted || isApproved}>{isSubmitted ? 'Submitted' : isApproved ? "Work Approved" : 'Submit Work'}</Button>
                                                                        <input type="file" id={`milestone-input-${data.id}`} style={{ display: "none" }} onChange={(e) => handleMilestoneFileUpload(e, data.id)} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {isOwnMessage && (
                                                    (() => {
                                                        const allApproved = Array.isArray(milestone) && milestone.length > 0 && milestone.every((m: any) => (milestoneStatusMap?.[m.id]?.status || milestoneUploads?.[m.id]?.status) === 'Approved');
                                                        return (
                                                            <div style={{ marginTop: 12 }}>
                                                                <Button type='primary' style={{ width: '100%' }} disabled={!allApproved || isOfferApproved} onClick={() => setShowCompleteProjectModal(true)}>
                                                                    Complete Project
                                                                </Button>
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className='offer-details'>
                                    <div>
                                        <strong>Price: </strong>
                                        <span>${offerPrice}</span>
                                    </div>
                                    {startDate && (
                                        <>
                                            <div>
                                                <strong>Start Date: </strong>
                                                <span>{dayjs(startDate).format("MMM DD YYYY")}</span>
                                            </div>
                                            <div>
                                                <strong>Deadline: </strong>
                                                <span>{dayjs(endDate).format("MMM DD YYYY")}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            {!isOwnMessage && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Button disabled={isOfferAccepted || isWorkSubmitted || isOfferApproved || isOfferRejected} onClick={() => handleRejectOffer(orderId)} className='offer-button' icon={<AiFillCloseSquare className='reject-icon' />}>{isOfferRejected ? "Rejected" : "Reject Offer"}</Button>
                                    <Button disabled={isOfferAccepted || isWorkSubmitted || isOfferApproved || isOfferRejected} onClick={() => handleAcceptOffer(orderId)} className='offer-button' icon={<FaCheckSquare className='check-icon' />}>{isOfferAccepted || isWorkSubmitted || isOfferApproved ? "Accepted" : "Accept Offer"}</Button>
                                </div>
                            )
                            }
                            {isOwnMessage && (isOfferAccepted || isWorkSubmitted || isOfferApproved) && (
                                <Button disabled={isOfferAccepted || isWorkSubmitted || isOfferApproved} className='offer-button' icon={<FaCheckSquare className='check-icon' />}>Offer Accepted</Button>
                            )}
                            {isOwnMessage && (isOfferRejected) && (
                                <Button disabled={isOfferRejected} className='offer-button' icon={<AiFillCloseSquare className='check-icon' />}>Offer Rejected</Button>
                            )}
                        </div>
                        {priceType !== "milestone" && (
                            <div>
                                {isWorkSubmitted || isOfferAccepted || isOfferApproved ? (
                                    <div className='submit-container'>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 18, fontWeight: 500 }}>{isOwnMessage && (isWorkSubmitted || isOfferApproved) ? "Submitted Work" : "Hire Offer"}</span>
                                            {!isOwnMessage && <span style={{ fontWeight: 500 }}>${offerPrice}</span>}
                                        </div>
                                        {submittedFileUrl && (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: 'space-between', border: "1px solid #d7d7d7", padding: 10 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                    <IoDocument style={{ fontSize: 20, color: "#c9c9c9" }} />
                                                    <span style={{ fontSize: 15, fontWeight: 500 }}>{attachedFile?.name || fileName}</span>
                                                </div>
                                                <a href={getDownloadUrl()} target='_blank' rel='noopener noreferrer'>
                                                    <MdDownload style={{ fontSize: 25, padding: 2, borderRadius: "100%", border: "1px solid" }} />
                                                </a>
                                            </div>
                                        )}
                                        {isOwnMessage && (
                                            <Button type='primary' style={{ width: "100%" }} disabled={!isWorkSubmitted || isApproving || isOfferApproved} onClick={() => setShowPaymentModal(true)}>{isOfferApproved ? "Approved" : "Approve"}</Button>
                                        )}
                                        {!isOwnMessage && (
                                            <>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <Button disabled={isOfferApproved} onClick={() => fileInputRef.current?.click()} icon={<FaFileZipper />} >Upload Zip</Button>
                                                    <Button type='primary' disabled={!attachedFile || isSubmitting || isWorkSubmitted || isOfferApproved} onClick={handleSubmitWork} loading={isSubmitting}>Submit Work</Button>
                                                </div>
                                                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
                                            </>
                                        )}
                                        {(!isOwnMessage && isOfferApproved) && (
                                            <Button type='primary' style={{ width: "100%" }} disabled={true}>Approved</Button>
                                        )}
                                    </div >
                                ) : (null)}
                            </div>
                        )}
                    </div>
                </div>
                {
                    offerSendTime && (<span className='message-time'>{dayjs(offerSendTime).calendar(null, {
                        sameDay: '[Today] h:mm A',
                        lastDay: '[Yesterday] h:mm A',
                        lastWeek: 'dddd h:mm A',
                        sameElse: 'DD/MM/YYYY h:mm A'
                    })}</span>)
                }
            </div >
        </>
    )
}

export default OfferMessage