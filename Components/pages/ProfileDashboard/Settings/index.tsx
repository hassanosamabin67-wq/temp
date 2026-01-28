'use client'
import React, { useEffect, useState } from 'react';
import {
    Card,
    Avatar,
    Button,
    Form,
    Input,
    Switch,
    Typography,
    Row,
    Col,
    Divider,
    Space,
    Upload,
    Select,
    message,
    Tabs
} from 'antd';
import {
    UserOutlined,
    BellOutlined,
    CreditCardOutlined,
    CameraOutlined,
    EditOutlined,
    SaveOutlined,
    GlobalOutlined,
    BankOutlined,
    MailOutlined,
    NotificationOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    ArrowRightOutlined,
    InsertRowAboveOutlined
} from '@ant-design/icons';
import ProfileEdit from '../ProfileEdit';
import { PaymentMethods } from '../Payments/PaymentMethods';
import { usePaymentMethods } from '@/hooks/profileDashboard/usePaymentMethod';
import { useAppSelector } from '@/store';
import styles from './style.module.css'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const SettingsDashboard = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profileForm] = Form.useForm();
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('https://i.pravatar.cc/120?img=1');
    const { methods, loading: methodsLoading, loadMethods, setDefaultMethod, removeMethod } = usePaymentMethods();
    const profileRedux = useAppSelector((state) => state.auth);
    const { preferences, togglePreference, updating } = useNotificationPreferences(profileRedux.profileId);

    useEffect(() => {
        if (profileRedux.profileId) {
            loadMethods(profileRedux.profileId);
        }
    }, [profileRedux.profileId, loadMethods]);

    const handleSetDefault = async (paymentMethodId: string) => {
        if (profileRedux.profileId) {
            await setDefaultMethod(profileRedux.profileId, paymentMethodId);
        }
    };

    const handleRemove = async (paymentMethodId: string) => {
        if (profileRedux.profileId) {
            await removeMethod(profileRedux.profileId, paymentMethodId);
        }
    };

    const handleMethodAdded = () => {
        if (profileRedux.profileId) {
            loadMethods(profileRedux.profileId);
        }
    };

    // Sample user data - replace with your actual data
    const [userData, setUserData] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Tech Innovations Inc.',
        country: 'United States',
        avatar: avatarUrl,
    });

    const countries = [
        'United States', 'United Kingdom', 'Canada', 'Australia',
        'Germany', 'France', 'Japan', 'Singapore', 'Netherlands',
        'Sweden', 'Denmark', 'Norway', 'Switzerland', 'Other'
    ];

    const handleProfileSave = (values: any) => {
        setUserData({ ...userData, ...values });
        setIsEditing(false);
        message.success('Profile updated successfully!');
    };

    const handleAvatarChange = (info: any) => {
        if (info.file.status === 'uploading') {
            return;
        }
        if (info.file.status === 'done') {
            // In real implementation, you'd get the URL from your server
            const newAvatarUrl = URL.createObjectURL(info.file.originFileObj);
            setAvatarUrl(newAvatarUrl);
            setUserData({ ...userData, avatar: newAvatarUrl });
            message.success('Avatar updated successfully!');
        }
    };

    const uploadProps = {
        name: 'avatar',
        showUploadList: false,
        beforeUpload: (file: File) => {
            const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
            if (!isJpgOrPng) {
                message.error('You can only upload JPG/PNG files!');
                return false;
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                message.error('Image must be smaller than 2MB!');
                return false;
            }
            return true;
        },
        onChange: handleAvatarChange,
    };

    const renderProfileSection = () => (
        // <Card
        //     title={
        //         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        //             <UserOutlined style={{ color: '#1890ff' }} />
        //             <span>Profile Information</span>
        //         </div>
        //     }
        //     extra={
        //         !isEditing ? (
        //             <Button
        //                 type="text"
        //                 icon={<EditOutlined />}
        //                 onClick={() => setIsEditing(true)}
        //                 style={{ fontWeight: 500 }}
        //             >
        //                 Edit Profile
        //             </Button>
        //         ) : null
        //     }
        //     style={{ marginBottom: '24px', borderRadius: '12px' }}
        // >
        //     {!isEditing ? (
        //         <div>
        //             <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
        //                 <div style={{ position: 'relative' }}>
        //                     <Avatar
        //                         src={userData.avatar}
        //                         size={120}
        //                         icon={<UserOutlined />}
        //                         style={{
        //                             border: '4px solid #f0f0f0',
        //                             backgroundColor: '#1890ff'
        //                         }}
        //                     />
        //                     <Upload {...uploadProps}>
        //                         <Button
        //                             type="primary"
        //                             shape="circle"
        //                             icon={<CameraOutlined />}
        //                             size="small"
        //                             style={{
        //                                 position: 'absolute',
        //                                 bottom: '8px',
        //                                 right: '8px',
        //                                 boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        //                             }}
        //                         />
        //                     </Upload>
        //                 </div>

        //                 <div>
        //                     <Title level={3} style={{ margin: 0, marginBottom: '8px' }}>
        //                         {userData.name}
        //                     </Title>
        //                     <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
        //                         {userData.email}
        //                     </Text>
        //                     <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        //                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        //                             <BankOutlined style={{ color: '#8c8c8c' }} />
        //                             <Text type="secondary">{userData.company}</Text>
        //                         </div>
        //                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        //                             <GlobalOutlined style={{ color: '#8c8c8c' }} />
        //                             <Text type="secondary">{userData.country}</Text>
        //                         </div>
        //                     </div>
        //                 </div>
        //             </div>
        //         </div>
        //     ) : (
        //         <Form
        //             form={profileForm}
        //             layout="vertical"
        //             initialValues={userData}
        //             onFinish={handleProfileSave}
        //         >
        //             <div style={{ display: 'flex', alignItems: 'start', gap: '24px', marginBottom: '24px' }}>
        //                 <div style={{ position: 'relative' }}>
        //                     <Avatar
        //                         src={userData.avatar}
        //                         size={120}
        //                         icon={<UserOutlined />}
        //                         style={{
        //                             border: '4px solid #f0f0f0',
        //                             backgroundColor: '#1890ff'
        //                         }}
        //                     />
        //                     <Upload {...uploadProps}>
        //                         <Button
        //                             type="primary"
        //                             shape="circle"
        //                             icon={<CameraOutlined />}
        //                             size="small"
        //                             style={{
        //                                 position: 'absolute',
        //                                 bottom: '8px',
        //                                 right: '8px',
        //                                 boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        //                             }}
        //                         />
        //                     </Upload>
        //                 </div>

        //                 <div style={{ flex: 1 }}>
        //                     <Row gutter={16}>
        //                         <Col span={12}>
        //                             <Form.Item
        //                                 label="Full Name"
        //                                 name="name"
        //                                 rules={[{ required: true, message: 'Please enter your name' }]}
        //                             >
        //                                 <Input placeholder="Enter your full name" />
        //                             </Form.Item>
        //                         </Col>
        //                         <Col span={12}>
        //                             <Form.Item
        //                                 label="Email"
        //                                 name="email"
        //                                 rules={[
        //                                     { required: true, message: 'Please enter your email' },
        //                                     { type: 'email', message: 'Please enter a valid email' }
        //                                 ]}
        //                             >
        //                                 <Input placeholder="Enter your email" />
        //                             </Form.Item>
        //                         </Col>
        //                     </Row>

        //                     <Row gutter={16}>
        //                         <Col span={12}>
        //                             <Form.Item
        //                                 label="Company"
        //                                 name="company"
        //                             >
        //                                 <Input placeholder="Enter your company name" />
        //                             </Form.Item>
        //                         </Col>
        //                         <Col span={12}>
        //                             <Form.Item
        //                                 label="Country"
        //                                 name="country"
        //                                 rules={[{ required: true, message: 'Please select your country' }]}
        //                             >
        //                                 <Select placeholder="Select your country">
        //                                     {countries.map(country => (
        //                                         <Option key={country} value={country}>
        //                                             {country}
        //                                         </Option>
        //                                     ))}
        //                                 </Select>
        //                             </Form.Item>
        //                         </Col>
        //                     </Row>
        //                 </div>
        //             </div>

        //             <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        //                 <Button onClick={() => setIsEditing(false)}>
        //                     Cancel
        //                 </Button>
        //                 <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
        //                     Save Changes
        //                 </Button>
        //             </div>
        //         </Form>
        //     )}
        // </Card>
        <ProfileEdit />
    );

    const renderNotificationsSection = () => (
        <Card
            title={
                <div className={styles.notificationHeader}>
                    <BellOutlined className={styles.notificationIcon} />
                    <span>Notification Preferences</span>
                </div>
            }
            className={styles.notificationTabCard}
        >
            <div style={{ marginBottom: '24px' }}>
                <Text type="secondary">
                    Choose how you want to be notified about important updates and activities.
                </Text>
            </div>

            <div className={styles.notificationContainer}>
                <div className={styles.notificationDiv}>
                    <div className={styles.notificationItem}>
                        <MailOutlined className={`${styles.notificationItemIcon} ${styles.mailIcon}`} />
                        <div>
                            <Text strong>Messages</Text>
                            <Text type="secondary" style={{ display: 'block', fontSize: '13px' }}>
                                Get new message update from clients
                            </Text>
                        </div>
                    </div>
                    <Switch
                        checked={preferences.messages}
                        onChange={(checked) => togglePreference('messages', checked)}
                    />
                </div>

                <div className={styles.notificationDiv}>
                    <div className={styles.notificationItem}>
                        <NotificationOutlined className={`${styles.notificationItemIcon} ${styles.notifyIcon}`} />
                        <div>
                            <Text strong>Project Updates</Text>
                            <Text type="secondary" style={{ display: 'block', fontSize: '13px' }}>
                                New offers, milestones, and orders
                            </Text>
                        </div>
                    </div>
                    <Switch
                        checked={preferences.projectUpdates}
                        onChange={(checked) => togglePreference('projectUpdates', checked)}
                    />
                </div>

                <div className={styles.notificationDiv}>
                    <div className={styles.notificationItem}>
                        <FileTextOutlined className={`${styles.notificationItemIcon} ${styles.fileIcon}`} />
                        <div>
                            <Text strong>Payment Updates</Text>
                            <Text type="secondary" style={{ display: 'block', fontSize: '13px' }}>
                                Payments receive, payment updates
                            </Text>
                        </div>
                    </div>
                    <Switch
                        checked={preferences.paymentUpdates}
                        onChange={(checked) => togglePreference('paymentUpdates', checked)}
                    />
                </div>
                <div className={styles.notificationDiv}>
                    <div className={styles.notificationItem}>
                        <InsertRowAboveOutlined className={`${styles.notificationItemIcon} ${styles.roomIcon}`} />
                        <div>
                            <Text strong>Collab Room</Text>
                            <Text type="secondary" style={{ display: 'block', fontSize: '13px' }}>
                                Collab Room updates, invites..
                            </Text>
                        </div>
                    </div>
                    <Switch
                        checked={preferences.collabRoom}
                        onChange={(checked) => togglePreference('collabRoom', checked)}
                    />
                </div>
            </div>
        </Card>
    );

    const renderBillingSection = () => (
        // <Card
        //     title={
        //         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        //             <CreditCardOutlined style={{ color: '#1890ff' }} />
        //             <span>Billing & Payments</span>
        //         </div>
        //     }
        //     style={{ marginBottom: '24px', borderRadius: '12px' }}
        // >
        //     <div style={{ marginBottom: '24px' }}>
        //         <Text type="secondary">
        //             Manage your payment methods, billing information, and transaction history.
        //         </Text>
        //     </div>

        //     <div style={{
        //         display: 'flex',
        //         flexDirection: 'column',
        //         gap: '16px',
        //         padding: '20px',
        //         backgroundColor: '#fafafa',
        //         borderRadius: '12px',
        //         border: '1px solid #f0f0f0'
        //     }}>
        //         <div style={{
        //             display: 'flex',
        //             justifyContent: 'space-between',
        //             alignItems: 'center',
        //             padding: '16px 20px',
        //             backgroundColor: '#fff',
        //             borderRadius: '8px',
        //             border: '1px solid #f0f0f0'
        //         }}>
        //             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        //                 <div style={{
        //                     width: '40px',
        //                     height: '40px',
        //                     backgroundColor: '#1890ff',
        //                     borderRadius: '8px',
        //                     display: 'flex',
        //                     alignItems: 'center',
        //                     justifyContent: 'center'
        //                 }}>
        //                     <CreditCardOutlined style={{ color: '#fff', fontSize: '18px' }} />
        //                 </div>
        //                 <div>
        //                     <Text strong style={{ fontSize: '16px' }}>Payment Methods</Text>
        //                     <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>
        //                         Manage your credit cards and payment options
        //                     </Text>
        //                 </div>
        //             </div>
        //             <Button
        //                 type="primary"
        //                 icon={<ArrowRightOutlined />}
        //                 style={{ borderRadius: '8px', fontWeight: 500 }}
        //                 onClick={() => console.log('Navigate to payment methods')}
        //             >
        //                 Manage Methods
        //             </Button>
        //         </div>

        //         <div style={{
        //             display: 'flex',
        //             justifyContent: 'space-between',
        //             alignItems: 'center',
        //             padding: '16px 20px',
        //             backgroundColor: '#fff',
        //             borderRadius: '8px',
        //             border: '1px solid #f0f0f0'
        //         }}>
        //             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        //                 <div style={{
        //                     width: '40px',
        //                     height: '40px',
        //                     backgroundColor: '#52c41a',
        //                     borderRadius: '8px',
        //                     display: 'flex',
        //                     alignItems: 'center',
        //                     justifyContent: 'center'
        //                 }}>
        //                     <FileTextOutlined style={{ color: '#fff', fontSize: '18px' }} />
        //                 </div>
        //                 <div>
        //                     <Text strong style={{ fontSize: '16px' }}>Billing History</Text>
        //                     <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>
        //                         View invoices, transactions, and payment history
        //                     </Text>
        //                 </div>
        //             </div>
        //             <Button
        //                 type="default"
        //                 icon={<ArrowRightOutlined />}
        //                 style={{ borderRadius: '8px', fontWeight: 500 }}
        //                 onClick={() => console.log('Navigate to billing history')}
        //             >
        //                 View History
        //             </Button>
        //         </div>

        //         <div style={{
        //             display: 'flex',
        //             justifyContent: 'space-between',
        //             alignItems: 'center',
        //             padding: '16px 20px',
        //             backgroundColor: '#fff',
        //             borderRadius: '8px',
        //             border: '1px solid #f0f0f0'
        //         }}>
        //             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        //                 <div style={{
        //                     width: '40px',
        //                     height: '40px',
        //                     backgroundColor: '#fa8c16',
        //                     borderRadius: '8px',
        //                     display: 'flex',
        //                     alignItems: 'center',
        //                     justifyContent: 'center'
        //                 }}>
        //                     <BankOutlined style={{ color: '#fff', fontSize: '18px' }} />
        //                 </div>
        //                 <div>
        //                     <Text strong style={{ fontSize: '16px' }}>Billing Information</Text>
        //                     <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>
        //                         Update your billing address and tax information
        //                     </Text>
        //                 </div>
        //             </div>
        //             <Button
        //                 type="default"
        //                 icon={<EditOutlined />}
        //                 style={{ borderRadius: '8px', fontWeight: 500 }}
        //                 onClick={() => console.log('Edit billing info')}
        //             >
        //                 Edit Details
        //             </Button>
        //         </div>
        //     </div>
        // </Card>
        <PaymentMethods
            methods={methods}
            loading={methodsLoading}
            userId={profileRedux.profileId!}
            userInfo={{
                firstName: profileRedux.firstName,
                lastName: profileRedux.lastName,
                email: profileRedux.email,
            }}
            onSetDefault={handleSetDefault}
            onRemove={handleRemove}
            onAdded={handleMethodAdded}
        />
    );

    const tabItems = [
        {
            key: 'profile',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px' }}>
                    <UserOutlined />
                    <span style={{ fontWeight: 500 }}>Profile</span>
                </div>
            ),
            children: renderProfileSection(),
        },
        ...(profileRedux.profileType === 'Visionary' ? [{
            key: 'notifications',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px' }}>
                    <BellOutlined />
                    <span style={{ fontWeight: 500 }}>Notifications</span>
                </div>
            ),
            children: renderNotificationsSection(),
        }] : []),
        {
            key: 'payment_setup',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px' }}>
                    <CreditCardOutlined />
                    <span style={{ fontWeight: 500 }}>Payment Setup</span>
                </div>
            ),
            children: renderBillingSection(),
        },
    ];

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            minHeight: '600px'
        }}>
            {/* Header */}
            <div style={{
                padding: '24px 24px 0 24px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
            }}>
                <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                    Settings
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                    Manage your account preferences and configurations
                </Text>
            </div>

            {/* Tabs Content */}
            <div style={{ padding: '0' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    className={styles.settingsTab}
                    size="large"
                    tabBarStyle={{
                        marginBottom: 0,
                        borderBottom: '1px solid #f0f0f0',
                        paddingTop: '16px'
                    }}
                />

                <div style={{ padding: '24px' }}>
                    {/* Tab content is rendered through the items array */}
                </div>
            </div>
        </div>
    );
};

export default SettingsDashboard;