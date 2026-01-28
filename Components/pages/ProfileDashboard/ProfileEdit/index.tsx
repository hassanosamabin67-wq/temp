'use client'
import React, { useState, useEffect, useMemo } from 'react'
import styles from './style.module.css'
import { Button, Form, Input, Skeleton, Tag, Select } from 'antd'
import { CiUser, CiMail } from "react-icons/ci";
import { PlusOutlined } from '@ant-design/icons';
import { useProfileEdit } from '@/hooks/profileDashboard/useProfileEdit';
import { useNotification } from '@/Components/custom/custom-notification';
import useFetchProfileData from '@/hooks/profileDashboard/fetchProfileData';

const ProfileEdit = () => {
    const { form, loading, error, initialValues, handleSubmit, handleSkillAdd, handleSkillRemove } = useProfileEdit();
    const { profile, loading: profileDataLoading } = useFetchProfileData();
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const { notify } = useNotification()
    const [hasInitialized, setHasInitialized] = useState(false);
    const businessType = Form.useWatch('businessType', form);

    useEffect(() => {
        if (!initialValues || hasInitialized) return;

        form.setFieldsValue(initialValues);
        setSkills(Array.isArray(initialValues.skills) ? initialValues.skills : []);
        setHasInitialized(true);
    }, [form, initialValues, hasInitialized]);

    const onFinish = async () => {
        try {
            const values = await form.validateFields();
            await handleSubmit({ ...values, skills });
            notify({ type: "success", message: 'Profile updated successfully!' });
        } catch (err) {
            notify({ type: "error", message: 'Failed to update profile. Please try again.' });
        }
    };

    const handleAddSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            const newSkills = [...skills, skillInput.trim()];
            setSkills(newSkills);
            handleSkillAdd(skillInput.trim());
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (removedSkill: string) => {
        const newSkills = skills.filter(skill => skill !== removedSkill);
        setSkills(newSkills);
        handleSkillRemove(removedSkill);
    };

    const handleSkillInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    if (profileDataLoading) {
        return (
            <div className={styles.profileEditMain}>
                <Skeleton active />
            </div>
        )
    }

    return (
        <div className={styles.profileEditMain}>
            <div>
                <span className={styles.pageTitle}>Edit Your Profile Info</span>
                <p className={styles.pageDesc}>Keep your profile up-to-date so others can get to know you better.</p>
            </div>
            <div className={styles.formDiv}>
                <div className={styles.formHeader}>
                    <span className={styles.formHeading}>Personal Information</span>
                </div>
                <div className={styles.formContainer}>
                    <Form
                        form={form}
                        layout="vertical"
                        name="edit_profile_form"
                        initialValues={initialValues}
                    >
                        <div className={styles.formGrid}>
                            <Form.Item
                                className={styles.formItem}
                                name="firstName"
                                label="First Name"
                                rules={[{ required: true, message: "Please enter your first name!" }]}
                            >
                                <Input
                                    prefix={<CiUser />}
                                    className={styles.formInput}
                                    placeholder="David"
                                />
                            </Form.Item>
                            <Form.Item
                                className={styles.formItem}
                                name="lastName"
                                label="Last Name"
                                rules={[{ required: true, message: "Please enter your last name!" }]}
                            >
                                <Input
                                    className={styles.formInput}
                                    placeholder="Johnson"
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            className={styles.formItem}
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: "Please enter your email address!" },
                                { type: 'email', message: 'Please enter a valid email address!' }
                            ]}
                        >
                            <Input
                                prefix={<CiMail />}
                                className={styles.formInput}
                                placeholder="david.johnson@gmail.com"
                            />
                        </Form.Item>

                        <Form.Item
                            className={styles.formItem}
                            name="userName"
                            label="Username"
                            rules={[{ required: true, message: "Please enter your username!" }]}
                        >
                            <Input
                                className={styles.formInput}
                                placeholder="davidjohnson24"
                            />
                        </Form.Item>

                        <div className={styles.formGrid}>
                            <Form.Item
                                className={styles.formItem}
                                name="phoneNumber"
                                label="Phone Number"
                                rules={[{ required: true, message: "Please enter your phone number!" }]}
                            >
                                <Input
                                    className={styles.formInput}
                                    placeholder="093-123-4234"
                                />
                            </Form.Item>
                            <Form.Item
                                className={styles.formItem}
                                name="location"
                                label="Country Name"
                                rules={[{ required: true, message: "Please enter your country name!" }]}
                            >
                                <Input
                                    className={styles.formInput}
                                    placeholder="USA"
                                />
                            </Form.Item>
                        </div>

                        {/* Business Type Section */}
                        <Form.Item
                            className={styles.formItem}
                            label="Change your business type"
                            name="businessType"
                            rules={[{ required: true, message: "Please select your business type" }]}
                        >
                            <Select
                                placeholder="Select your role"
                                className={`${styles.formSelect}`}
                            >
                                <Select.Option value="individual">Individual</Select.Option>
                                <Select.Option value="company">Company</Select.Option>
                            </Select>
                            {/* <div className="ant-form-text">
                                <small>
                                    Choose <strong>Individual</strong> if you're applying for jobs personally.
                                    Choose <strong>Company</strong> if you're hiring or representing a business.
                                </small>
                            </div> */}
                        </Form.Item>

                        {businessType === "company" && (
                            <Form.Item
                                className={styles.formItem}
                                label="Company Name"
                                name="companyName"
                                rules={[
                                    { required: true, message: "Please enter your company name" },
                                ]}
                            >
                                <Input
                                    placeholder="e.g., Acme Inc."
                                    className={styles.formInput}
                                />
                            </Form.Item>
                        )}

                        <Form.Item
                            className={styles.formItem}
                            name="profileTagline"
                            label="Profile Tagline"
                            rules={[{ required: true, message: "Please enter your profile tagline!" }]}
                        >
                            <Input
                                className={styles.formInput}
                                placeholder="Expert Full Stack Developer"
                            />
                        </Form.Item>

                        {/* Skills Section */}
                        {!profile?.isClient && (<Form.Item
                            className={styles.formItem}
                            label="Skills"
                        >
                            <div className={styles.skillsContainer}>
                                <div className={styles.skillsInput}>
                                    <Input
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={handleSkillInputKeyPress}
                                        placeholder="Add a skill (press Enter)"
                                        className={styles.formInput}
                                        suffix={
                                            <Button
                                                type="text"
                                                icon={<PlusOutlined />}
                                                onClick={handleAddSkill}
                                                size="small"
                                            />
                                        }
                                    />
                                </div>
                                <div className={styles.skillsTags}>
                                    {skills.map((skill) => (
                                        <Tag
                                            key={skill}
                                            closable
                                            onClose={() => handleRemoveSkill(skill)}
                                            className={styles.skillTag}
                                        >
                                            {skill}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        </Form.Item>)}

                        <Form.Item
                            className={styles.formItem}
                            name="bio"
                            label="BIO"
                            rules={[{ required: true, message: "Please write your bio!" }]}
                        >
                            <Input.TextArea
                                className={styles.formInput}
                                placeholder="Write your bio here"
                                rows={5}
                            />
                        </Form.Item>

                        {error && (
                            <div className={styles.errorMessage}>
                                {error}
                            </div>
                        )}
                    </Form>

                    <div className={styles.formFooter}>
                        <Button
                            type="primary"
                            className={styles.formActionBtn}
                            onClick={onFinish}
                            loading={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </div >
        </div >
    )
}

export default ProfileEdit