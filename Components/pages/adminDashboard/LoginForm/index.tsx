import { useNotification } from '@/Components/custom/custom-notification';
import { supabase } from '@/config/supabase';
import { useAppDispatch } from '@/store';
import { setAuthData } from '@/store/slices/auth-slice';
import { Button, Form, Input } from 'antd';
import { setCookie } from 'cookies-next';
import React, { useState } from 'react'

const LoginForm = () => {
    const [loader, setLoader] = useState(false);
    const { notify } = useNotification();
    const dispatch = useAppDispatch();
    const [form, setForm] = useState({ email: "", password: "" });

    const handleChange = (changedValues: any) => setForm({ ...form, ...changedValues });

    const handleSubmit = async (values: any) => {
        try {
            setLoader(true);
            if (!values.email || !values.password) {
                notify({ type: "error", message: "Email and Password are required" });
                setLoader(false);
                return;
            }
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) {
                console.error("Login Error:", error);
                notify({ type: "error", message: error.message || "Sign-in Failed" });
                setLoader(false);
                return;
            }

            const user = data?.user;
            if (!user) {
                notify({ type: "error", message: "Authentication failed" });
                return;
            }

            const { data: adminData, error: adminError } = await supabase
                .from('users')
                .select('*')
                .eq('email', values.email)
                .eq("user_role", "admin")
                .limit(1)
                .single();

            if (adminError || !adminData) {
                console.error("Admin Data Error:", adminError);
                notify({ type: "error", message: "Invalid Credentials" });
                return;
            }

            const adminObject = {
                ...adminData,
                profileId: adminData.userId,
                isAuthenticated: true
            };

            setCookie("userData", JSON.stringify(adminObject));
            dispatch(setAuthData(adminObject));
            notify({ type: "success", message: "Logged in successfully" });

        } catch (err) {
            console.error("Unexpected Error:", err);
            notify({ type: "error", message: "An unexpected error occurred. Please try again." });
        } finally {
            setLoader(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
            <div style={{ backgroundColor: 'white', borderRadius: 10, width: '30%', padding: '30px 30px', boxShadow: "1px 1px 5px 0px #cfcfcf" }}>
                <span style={{ display: 'block', marginBottom: 24, fontSize: 25, textAlign: 'center', fontWeight: 'bold' }}>Admin Login</span>
                <Form
                    onFinish={handleSubmit}
                    initialValues={form}
                    onValuesChange={handleChange}
                    layout="vertical"
                    autoComplete="off"
                >
                    <Form.Item
                        label={<span style={{ fontWeight: "bold" }}>Email</span>}
                        name="email"
                        rules={[
                            { required: true, message: "Please enter your email" },
                            { type: "email", message: "Please enter a valid email" },
                        ]}

                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: "bold" }}>Password</span>}
                        name="password"
                        rules={[{ required: true, message: "Please enter your password" }]}
                    >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item>
                        <Button loading={loader} htmlType="submit" role="button" style={{ width: "100%" }} variant='solid' color='blue'>Login</Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}

export default LoginForm