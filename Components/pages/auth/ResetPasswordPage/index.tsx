'use client'
import { UIForm, UIFormItem } from '@/Components/custom/custom-form'
import { Button, Input } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import '../style.css'

function ResetPasswordPage() {
    const [loader, setLoader] = useState(false);
    const [session, setSession] = useState<any>(null);
    const { notify } = useNotification();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token")

    const [form, setForm] = useState({
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        // Get the session from the URL hash
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleChange = (changedValues: any) => {
        setForm({
            ...form,
            ...changedValues,
        });
    };

    console.log('session check::', session);

    const handleSubmit = async (values: any) => {
        if (!session) {
            notify({
                type: "error",
                message: "Invalid or expired reset link. Please request a new password reset.",
            });
            return;
        }

        if (values.password !== values.confirmPassword) {
            notify({
                type: "error",
                message: "Passwords do not match",
            });
            return;
        }

        if (values.password.length < 6) {
            notify({
                type: "error",
                message: "Password must be at least 6 characters long",
            });
            return;
        }

        try {
            setLoader(true);

            const { error } = await supabase.auth.updateUser({
                password: values.password
            });

            if (error) {
                console.error("Password Update Error:", error);
                notify({
                    type: "error",
                    message: error.message || "Failed to update password",
                });
                return;
            }

            notify({
                type: "success",
                message: "Password updated successfully! Redirecting to login...",
            });

            // Sign out the user and redirect to login
            await supabase.auth.signOut();

            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err) {
            console.error("Unexpected Error:", err);
            notify({
                type: "error",
                message: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setLoader(false);
        }
    };

    // If no session, show invalid link message
    if (!session) {
        return (
            <div className="login-CssBg" style={{
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
                    maxWidth: '500px'
                }}>
                    <h2 style={{ color: 'white', marginBottom: '20px' }}>Invalid Reset Link</h2>
                    <p style={{ color: 'white', marginBottom: '20px' }}>
                        This password reset link is invalid or has expired. Please request a new password reset.
                    </p>
                    <Button
                        type="primary"
                        onClick={() => router.push('/login')}
                        style={{ marginTop: '10px' }}
                    >
                        Back to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-CssBg" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: "#2c2c2cff"
        }}>
            <div className='auth-card' style={{ background: "#0000002e" }}>
                <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>
                    Reset Your Password
                </h2>

                <UIForm
                    onFinish={handleSubmit}
                    initialValues={form}
                    onValuesChange={handleChange}
                    layout="vertical"
                    autoComplete="off"
                >
                    <UIFormItem
                        label={<span style={{ color: "white", fontWeight: "bold" }}>New Password</span>}
                        name="password"
                        rules={[
                            { required: true, message: "Please enter your new password" },
                            { min: 6, message: "Password must be at least 6 characters long" }
                        ]}
                    >
                        <Input.Password />
                    </UIFormItem>

                    <UIFormItem
                        label={<span style={{ color: "white", fontWeight: "bold" }}>Confirm Password</span>}
                        name="confirmPassword"
                        rules={[
                            { required: true, message: "Please confirm your new password" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password />
                    </UIFormItem>

                    <UIFormItem>
                        <Button
                            loading={loader}
                            htmlType="submit"
                            className="auth-submit-btn"
                            style={{ width: '100%', marginTop: '10px' }}
                        >
                            Update Password
                        </Button>
                    </UIFormItem>

                    <p className='auth-form-link'>
                        <a href="/login">
                            Back to Login
                        </a>
                    </p>
                </UIForm>
            </div>
        </div>
    )
}

export default ResetPasswordPage