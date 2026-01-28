'use client';
import React, { useState } from 'react';
import { Card, Typography, Collapse, Form, Input, Button, Alert, Divider, Space, List } from 'antd';
import {
    QuestionCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    BulbOutlined,
    MailOutlined,
    PhoneOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import styles from './styles.module.css';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const Support = () => {
    const profile = useAppSelector((state) => state.auth);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { notify } = useNotification();

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            const response = await fetch('/api/ads/support/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    advertiser_id: profile.profileId,
                    name: values.name,
                    email: values.email,
                    subject: values.subject,
                    message: values.message,
                }),
            });

            const result = await response.json();

            if (result.success) {
                notify({
                    type: 'success',
                    message: 'Message sent successfully! We\'ll get back to you within 24-48 hours.'
                });
                form.resetFields();
            } else {
                notify({
                    type: 'error',
                    message: result.error || 'Failed to send message. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error sending support message:', error);
            notify({
                type: 'error',
                message: 'Failed to send message. Please try again later.'
            });
        } finally {
            setLoading(false);
        }
    };

    const faqs = [
        {
            question: 'How long does ad approval take?',
            answer: 'Ad approval typically takes 1-2 business days. You\'ll receive an email notification once your ad has been reviewed. If revisions are needed, you can resubmit at no additional cost.'
        },
        {
            question: 'What happens if my ad is rejected?',
            answer: 'If your ad is rejected, you\'ll receive detailed feedback explaining the reason. You can revise your ad and resubmit it at no additional cost. Only if your revised ad still meets all guidelines and is declined will you be eligible for a refund.'
        },
        {
            question: 'How are impressions counted?',
            answer: 'Impressions are counted each time your ad is viewed. Your ad will play in the lobby mini-screen before sessions and as a pre-roll before replays, up to 2,000 impressions or 30 days, whichever comes first.'
        },
        {
            question: 'Can I edit my ad after it\'s approved?',
            answer: 'Once approved and active, major edits require resubmission for review. Minor changes to the title and description can be made without re-approval. Video changes always require a new review.'
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processor. All transactions are encrypted and PCI-compliant.'
        },
        {
            question: 'Can I get a refund?',
            answer: 'Refunds are only issued if your final revised ad meets all guidelines and Kaboom Collab still declines to run it. Once your ad is approved and running, refunds are not available as the service has been rendered.'
        },
        {
            question: 'How many ads can I run at once?',
            answer: 'You can run multiple ads simultaneously across different rooms or sessions. Each ad slot is $25 and provides up to 2,000 impressions or 30 days of exposure.'
        },
        {
            question: 'Can I target specific audiences?',
            answer: 'Yes! When uploading your ad, you can choose specific Collab Rooms and sessions. Each room has its own audience profile, allowing you to target musicians, artists, performers, or other creative professionals.'
        },
        {
            question: 'What video formats are supported?',
            answer: 'We support MP4 and MOV formats. Your video must be between 15-30 seconds long, with a maximum file size of 50MB. Recommended resolution is 1920x1080 (16:9) or 1080x1920 (9:16).'
        },
        {
            question: 'Can I download my ad performance reports?',
            answer: 'Yes! Visit the Ad Analytics page to view detailed performance metrics including impressions, view locations (lobby vs replay), and engagement data. You can export this data for your records.'
        }
    ];

    const improvementTips = [
        {
            title: 'Use High-Quality Visuals',
            description: 'Ensure your video is shot in HD (1080p or higher), well-lit, and properly color-graded. Avoid shaky camera work and pixelated footage.',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
            title: 'Clear and Concise Messaging',
            description: 'Get your main message across in the first 5 seconds. Keep text large and readable. Use simple language that resonates with creative professionals.',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
            title: 'Professional Audio',
            description: 'Use clear, balanced audio without distortion. Music should enhance, not overpower your message. Consider professional voice-over for better engagement.',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
            title: 'Strong Call-to-Action',
            description: 'Tell viewers exactly what you want them to do next. Include your website, social handle, or brand name clearly at the end of your ad.',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
            title: 'Test Before Uploading',
            description: 'Watch your ad on different devices and screen sizes. Ask colleagues for feedback. Ensure all text is readable and timing is perfect.',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
            title: 'Brand Consistency',
            description: 'Maintain consistent branding with your other marketing materials. Use your brand colors, fonts, and style guide to build recognition.',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        }
    ];

    const rejectionReasons = [
        {
            reason: 'Low Video Quality',
            description: 'Blurry, pixelated, or poorly lit footage. Solution: Re-record in better lighting with a stable camera and HD resolution.',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        },
        {
            reason: 'Copyrighted Content',
            description: 'Using music, images, or video clips without proper licensing. Solution: Use royalty-free content or obtain proper licenses.',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        },
        {
            reason: 'Misleading Claims',
            description: 'False advertising or unrealistic promises. Solution: Be honest and accurate in your messaging. Back up claims with evidence.',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        },
        {
            reason: 'Inappropriate Content',
            description: 'Explicit, violent, or discriminatory content. Solution: Keep ads professional and brand-safe for all audiences.',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        },
        {
            reason: 'Audio Issues',
            description: 'Distorted, too loud, or inaudible audio. Solution: Balance audio levels, remove background noise, and test on multiple devices.',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        },
        {
            reason: 'Duration Not Met',
            description: 'Video is shorter than 15 seconds or longer than 30 seconds. Solution: Edit your video to meet the required duration.',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        },
        {
            reason: 'Flashing/Strobe Effects',
            description: 'Rapid flashing that can trigger seizures or discomfort. Solution: Remove strobe effects and fast transitions.',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        },
        {
            reason: 'Unreadable Text',
            description: 'Text too small, wrong contrast, or on screen too briefly. Solution: Use larger fonts, high contrast, and give viewers time to read.',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        }
    ];

    return (
        <div className={styles.supportContainer}>
            <div className={styles.header}>
                <Title level={2}>Advertiser Support</Title>
                <Paragraph>
                    Find answers to common questions, learn how to improve your ads, and get in touch with our support team.
                </Paragraph>
            </div>

            {/* FAQ Section */}
            <Card
                title={
                    <Space>
                        <QuestionCircleOutlined />
                        <Text strong>Frequently Asked Questions</Text>
                    </Space>
                }
                className={styles.faqCard}
            >
                <Collapse
                    accordion
                    bordered={false}
                    expandIconPosition="end"
                >
                    {faqs.map((faq, index) => (
                        <Panel header={<Text strong>{faq.question}</Text>} key={index}>
                            <Paragraph>{faq.answer}</Paragraph>
                        </Panel>
                    ))}
                </Collapse>
            </Card>

            <Divider />

            {/* How to Improve Your Ad */}
            <Card
                title={
                    <Space>
                        <BulbOutlined />
                        <Text strong>How to Improve Your Ad</Text>
                    </Space>
                }
                className={styles.tipsCard}
            >
                <Paragraph>
                    Follow these best practices to create high-performing ads that get approved quickly and deliver results.
                </Paragraph>
                <List
                    dataSource={improvementTips}
                    renderItem={(tip) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={tip.icon}
                                title={<Text strong>{tip.title}</Text>}
                                description={tip.description}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Divider />

            {/* Why Ads Get Rejected */}
            <Card
                title={
                    <Space>
                        <InfoCircleOutlined />
                        <Text strong>Common Rejection Reasons</Text>
                    </Space>
                }
                className={styles.rejectionCard}
            >
                <Alert
                    message="Understanding Rejections"
                    description="Learn why ads get rejected and how to fix common issues before resubmitting."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <List
                    dataSource={rejectionReasons}
                    renderItem={(rejection) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={rejection.icon}
                                title={<Text strong>{rejection.reason}</Text>}
                                description={rejection.description}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Divider />

            {/* Contact Support Form */}
            <Card
                title={
                    <Space>
                        <MailOutlined />
                        <Text strong>Contact Support</Text>
                    </Space>
                }
                className={styles.contactCard}
            >
                <Alert
                    message="Need Help?"
                    description="Fill out the form below and our support team will get back to you within 24-48 hours."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
                        email: profile.email || ''
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Your Name"
                        rules={[{ required: true, message: 'Please enter your name' }]}
                    >
                        <Input placeholder="Enter your full name" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input placeholder="your.email@example.com" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="subject"
                        label="Subject"
                        rules={[{ required: true, message: 'Please enter a subject' }]}
                    >
                        <Input placeholder="Brief description of your issue" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="message"
                        label="Message"
                        rules={[
                            { required: true, message: 'Please enter your message' },
                            { min: 20, message: 'Message must be at least 20 characters' }
                        ]}
                    >
                        <TextArea
                            rows={6}
                            placeholder="Describe your issue or question in detail..."
                            maxLength={2000}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item>
                        <ActionButton
                            htmlType="submit"
                            size="large"
                            loading={loading}
                            icon={<MailOutlined />}
                            block
                        >
                            Send Message
                        </ActionButton>
                    </Form.Item>
                </Form>

                <Divider />

                <div className={styles.alternativeContact}>
                    <Title level={5}>Other Ways to Reach Us</Title>
                    <Space direction="vertical" size="small">
                        <Text>
                            <MailOutlined /> Email: <a href="mailto:support@kaboomcollab.com">support@kaboomcollab.com</a>
                        </Text>
                        <Text>
                            <PhoneOutlined /> Phone: +1 (555) 123-4567
                        </Text>
                        <Text type="secondary">
                            Support hours: Monday - Friday, 9:00 AM - 6:00 PM EST
                        </Text>
                    </Space>
                </div>
            </Card>
        </div>
    );
};

export default Support;