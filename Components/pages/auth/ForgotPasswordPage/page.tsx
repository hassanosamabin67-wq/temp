'use client'
import { UIForm, UIFormItem } from '@/Components/custom/custom-form'
import { Button, Input } from 'antd';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';

function ForgotPasswordPage() {
    const [loader, setLoader] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { notify } = useNotification();
    const router = useRouter();

    const [form, setForm] = useState({
        email: "",
    });

    const handleChange = (changedValues: any) => {
        setForm({
            ...form,
            ...changedValues,
        });
    };

    const handleSubmit = async (values: any) => {
        if (!values.email) {
            notify({
                type: "error",
                message: "Please enter your email address",
            });
            return;
        }

        try {
            setLoader(true);

            const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                console.error("Password Reset Error:", error);

                // Handle specific error cases
                if (error.message.includes('not authorized') || error.message.includes('Email address cannot be used')) {
                    notify({
                        type: "error",
                        message: "This email is not authorized. Please contact support or use a different email.",
                    });
                } else if (error.message.includes('rate limit')) {
                    notify({
                        type: "error",
                        message: "Too many requests. Please wait a few minutes before trying again.",
                    });
                } else {
                    notify({
                        type: "error",
                        message: error.message || "Failed to send reset email",
                    });
                }
                return;
            }

            setEmailSent(true);
            notify({
                type: "success",
                message: "If this email exists in our system, you'll receive a password reset link. Please check your inbox and spam folder.",
            });

        } catch (err) {
            console.error("Forgot Password Error:", err);
            notify({
                type: "error",
                message: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setLoader(false);
        }
    };

    if (emailSent) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: '#0000002e',
                    padding: '40px',
                    borderRadius: '10px',
                    maxWidth: '500px',
                    width: '100%'
                }}>
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#52c41a',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            fontSize: '40px',
                            color: 'white'
                        }}>
                            ✓
                        </div>
                        <h2 style={{ color: 'white', marginBottom: '20px' }}>Check Your Email</h2>
                        <p style={{ color: 'white', marginBottom: '20px', lineHeight: '1.6' }}>
                            If an account with that email exists, we've sent you a password reset link.
                            Please check your inbox and spam folder.
                        </p>
                        <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '30px' }}>
                            Didn't receive the email? Check your spam folder or try again in a few minutes.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            onClick={() => {
                                setEmailSent(false);
                                setForm({ email: "" });
                            }}
                            style={{ minWidth: '120px' }}
                        >
                            Try Again
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => router.push('/login')}
                            style={{ minWidth: '120px' }}
                        >
                            Back to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <div className='auth-card' style={{ background: "#0000002e" }}>
                <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '10px' }}>
                    Forgot Password?
                </h2>
                <p style={{
                    color: '#2c2c2cff',
                    textAlign: 'center',
                    marginBottom: '30px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                }}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <UIForm
                    onFinish={handleSubmit}
                    initialValues={form}
                    onValuesChange={handleChange}
                    layout="vertical"
                    autoComplete="off"
                >
                    <UIFormItem
                        label={<span style={{ color: "white", fontWeight: "bold" }}>Email Address</span>}
                        name="email"
                        rules={[
                            { required: true, message: "Please enter your email address" },
                            { type: "email", message: "Please enter a valid email address" }
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder="Enter your email address"
                        />
                    </UIFormItem>

                    <UIFormItem>
                        <Button
                            loading={loader}
                            className="auth-submit-btn"
                            htmlType="submit"
                            size="large"
                            style={{ width: '100%', marginTop: '10px' }}
                        >
                            Send Reset Link
                        </Button>
                    </UIFormItem>

                    <div className='auth-link-container'>
                        <p className='auth-form-link'>
                            Remember your password?{' '}
                            <a href="/login" style={{ color: '#1890ff', textDecoration: 'none' }}>
                                Back to Login
                            </a>
                        </p>
                        <p className='auth-form-link'>
                            Don't have an account?{' '}
                            <a href="/signup" style={{ color: '#1890ff', textDecoration: 'none' }}>
                                Sign Up
                            </a>
                        </p>
                    </div>
                </UIForm>
            </div>
        </div>
    )
}

export default ForgotPasswordPage