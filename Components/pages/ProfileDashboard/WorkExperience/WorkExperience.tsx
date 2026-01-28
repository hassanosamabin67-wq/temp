import React, { FC, useState } from 'react'
import styles from './style.module.css'
import { Button, DatePicker, Empty, Form, Input, Modal, Select } from 'antd';
import { useNotification } from '@/Components/custom/custom-notification';
import { useAppDispatch } from '@/store';
import { AuthState, experienceInterface, ProfileWithOwnership } from '@/types/userInterface';
import { supabase } from '@/config/supabase';
import { setAuthData } from '@/store/slices/auth-slice';
import dayjs from 'dayjs';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const WorkExperience: FC<{ profile: ProfileWithOwnership }> = ({ profile }) => {
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm();
    const { notify } = useNotification();
    const dispatch = useAppDispatch();

    const handleAddExperience = async (profile: AuthState) => {
        try {
            setLoading(true)
            const values = await form.validateFields();

            const formattedStartDate = dayjs(values.startDate).format("MMMM YYYY");
            const formattedEndDate = values.endDate
                ? dayjs(values.endDate).format("MMMM YYYY")
                : "Present";

            const newExperience: experienceInterface = {
                name: values.jobTitle,
                companyName: values.companyName,
                jobType: values.jobType,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                location: values.location,
            };

            const updatedExperiences: experienceInterface[] = [
                ...(profile?.experience || []),
                newExperience,
            ];

            dispatch(setAuthData({ ...profile, experience: updatedExperiences }));

            const { error } = await supabase
                .from("users")
                .update({ experience: updatedExperiences })
                .eq("userId", profile.profileId);

            if (error) {
                notify({ type: "error", message: "Failed to add experience" });
            } else {
                notify({ type: "success", message: "Experience added successfully" });
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
            <div className="content-grid">
                {profile.isOwnProfile && (<ActionButton onClick={() => setShowModal(true)} style={{ marginBottom: 15 }}>Add Experience</ActionButton>)}
                <div className="section">
                    {(profile?.experience && profile.experience.length > 0) ? (profile?.experience?.map((exp, index) => (
                        <div key={index} className={styles.certItem}>
                            <div className={styles.certContent}>
                                <div className={styles.certTitle}>{exp.name}</div>
                                <div className={styles.certIssuer}>{exp.companyName}</div>
                                <div className={styles.certDate}>
                                    {exp.startDate} - {exp.endDate} • {exp.location}
                                </div>
                            </div>
                        </div>
                    ))) : (
                        <Empty description='No Work Experience Added' />
                    )}
                </div>
            </div>

            <Modal
                title="Add Work Experience"
                open={showModal}
                onCancel={() => setShowModal(false)}
                footer={null}
                width={900}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="add_experience_form"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        label="Job Title"
                        name="jobTitle"
                        rules={[{ required: true, message: "Job title is required." }]}
                    >
                        <Input placeholder="e.g. Senior UI/UX Designer" />
                    </Form.Item>

                    <Form.Item
                        label="Company Name"
                        name="companyName"
                        rules={[{ required: true, message: "Company name is required." }]}
                    >
                        <Input placeholder="e.g. TechFlow Solutions" />
                    </Form.Item>

                    <Form.Item
                        label="Job Type"
                        name="jobType"
                        rules={[{ required: true, message: "Please select job type." }]}
                    >
                        <Select placeholder="e.g. Full-time">
                            <Select.Option value="Full-time">Full-time</Select.Option>
                            <Select.Option value="Part-time">Part-time</Select.Option>
                            <Select.Option value="Contract">Contract</Select.Option>
                            <Select.Option value="Internship">Internship</Select.Option>
                            <Select.Option value="Freelance">Freelance</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Location"
                        name="location"
                        rules={[{ required: true, message: "Location is required." }]}
                    >
                        <Input placeholder="e.g. San Francisco, CA" />
                    </Form.Item>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Form.Item
                            label="Start Date"
                            name="startDate"
                            style={{ flex: 1 }}
                            rules={[{ required: true, message: "Please select the start date." }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                placeholder="Select start date"
                                format="MMMM YYYY"
                                picker="month"
                            />
                        </Form.Item>

                        <Form.Item
                            label="End Date"
                            name="endDate"
                            style={{ flex: 1 }}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                placeholder="Select end date (leave empty if Present)"
                                format="MMMM YYYY"
                                picker="month"
                            />
                        </Form.Item>
                    </div>

                    <ActionButton
                        style={{ marginTop: 10 }}
                        onClick={() => handleAddExperience(profile)}
                        loading={loading}
                    >
                        Save Experience
                    </ActionButton>
                </Form>
            </Modal>
        </>
    )
}

export default WorkExperience