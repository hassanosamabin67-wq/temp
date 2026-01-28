import React, { FC, useState } from 'react'
import styles from './style.module.css'
import { FaStar } from "react-icons/fa";
import { Button, DatePicker, Empty, Form, Input, Modal } from 'antd';
import dayjs from 'dayjs';
import { MdEdit } from "react-icons/md";
import { useNotification } from '@/Components/custom/custom-notification';
import { useAppDispatch } from '@/store';
import { setAuthData } from '@/store/slices/auth-slice';
import { supabase } from '@/config/supabase';
import { AuthState, certificationsInterface, ProfileWithOwnership } from '@/types/userInterface';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const Certification: FC<{ profile: ProfileWithOwnership }> = ({ profile }) => {
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm();
    const { notify } = useNotification();
    const dispatch = useAppDispatch();

    const handleAddCertificate = async (profile: AuthState) => {
        try {
            setLoading(true)
            const values = await form.validateFields();
            const formattedIssuedDate = dayjs(values.issuedDate).format("MMMM YYYY");
            const formattedValidTill = dayjs(values.validTill).format("MMMM YYYY");

            const newCertification: certificationsInterface = {
                name: values.name,
                issuedBy: values.issuedBy,
                issuedDate: formattedIssuedDate,
                validTill: formattedValidTill,
            };

            const updatedCertifications: certificationsInterface[] = [
                ...(profile?.certifications || []),
                newCertification,
            ];

            const isDuplicate = [...profile?.certifications || []]?.some(cert =>
                cert.name === newCertification.name && cert.issuedBy === newCertification.issuedBy
            );

            if (isDuplicate) {
                notify({ type: "warning", message: "This certificate already exists!" });
                return;
            }

            dispatch(setAuthData({ ...profile, certifications: updatedCertifications }));

            const { error } = await supabase
                .from("users")
                .update({ certifications: updatedCertifications })
                .eq("userId", profile.profileId);

            if (error) {
                notify({ type: "error", message: "Failed to add certificate" });
            } else {
                notify({ type: "success", message: "Certificate added successfully" });
                setShowModal(false)
                form.resetFields()
            }
        } catch (error) {
            console.error('Unexpected error: ', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="section">
                {profile.isOwnProfile && (<ActionButton onClick={() => setShowModal(true)} icon={<MdEdit />} style={{ marginBottom: 15 }}>Add New Certification</ActionButton>)}
                <div>
                    {(profile?.certifications && profile?.certifications?.length > 0) ? (profile?.certifications?.map((certficate, index) => (
                        <div key={index} className={styles.certItem}>
                            <div className={styles.certIcon}>
                                <FaStar />
                            </div>
                            <div className={styles.certContent}>
                                <div className={styles.certTitle}>{certficate.name}</div>
                                <div className={styles.certIssuer}>{certficate.issuedBy}</div>
                                <div className={styles.certDate}>{certficate.issuedDate} {certficate.validTill}</div>
                            </div>
                        </div>
                    ))) : (
                        <Empty description='No Certificate' />
                    )}
                </div>
            </div>

            <Modal
                title="Add Certification"
                open={showModal}
                onCancel={() => setShowModal(false)}
                footer={null}
                width={900}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="add_certificate_form"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        label="Certificate Name"
                        name="name"
                        rules={[{ required: true, message: "Certificate name is required." }]}
                    >
                        <Input placeholder="e.g. AWS Certified Solutions Architect" />
                    </Form.Item>

                    <Form.Item
                        label="Issuing Organization"
                        name="issuedBy"
                        rules={[{ required: true, message: "Issuing organization is required." }]}
                    >
                        <Input placeholder="e.g. Amazon Web Services (AWS)" />
                    </Form.Item>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Form.Item
                            label="Issued Date"
                            name="issuedDate"
                            style={{ flex: 1 }}
                            rules={[{ required: true, message: "Please select the issued date." }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                placeholder="Select issued date"
                                format="MMMM YYYY"
                                picker="month"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Valid Until"
                            name="validTill"
                            style={{ flex: 1 }}
                            rules={[{ required: true, message: "Please select the expiration date." }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                placeholder="Select expiration date"
                                format="MMMM YYYY"
                                picker="month"
                            />
                        </Form.Item>
                    </div>
                    <ActionButton style={{ marginTop: 10 }} onClick={() => handleAddCertificate(profile)} loading={loading}>Save Certification</ActionButton>
                </Form>
            </Modal>
        </>
    )
}

export default Certification
