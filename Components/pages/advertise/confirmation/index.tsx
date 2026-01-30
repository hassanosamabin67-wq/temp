'use client';
import React from 'react';
import { Typography, Button, Card, Result, Divider, List } from 'antd';
import { CheckCircleFilled, ClockCircleOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import styles from '../advertise.module.css';

const { Title, Text, Paragraph } = Typography;

const AdConfirmationPage = () => {
    const steps = [
        {
            title: 'Submission Received',
            description: 'We have received your ad submission.',
            icon: <CheckCircleFilled style={{ color: '#52c41a', fontSize: '24px' }} />
        },
        {
            title: 'Under Review',
            description: 'Our team is reviewing your ad for approval.',
            icon: <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '24px' }} />
        },
        {
            title: 'Approval & Scheduling',
            description: 'Once approved, your ad will be scheduled for display.',
            icon: <MailOutlined style={{ color: '#722ed1', fontSize: '24px' }} />
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Result
                    status="success"
                    title="Your Ad Request Has Been Submitted!"
                    subTitle={
                        <>
                            <p>Thank you for choosing Kaboom Collab for your advertising needs.</p>
                            <p>Your submission is currently under review.</p>
                        </>
                    }
                    extra={[
                        <Link href="/" key="home">
                            <Button type="primary">Back to Home</Button>
                        </Link>,
                        <Link href="/advertise" key="advertise">
                            <Button>View Advertising Options</Button>
                        </Link>,
                    ]}
                />
            </div>

            <Card className={styles.statusCard}>
                <Title level={4} className={styles.sectionTitle}>What Happens Next?</Title>
                <div className={styles.timeline}>
                    {steps.map((step, index) => (
                        <div key={step.title} className={styles.timelineItem}>
                            <div className={styles.timelineDot}>
                                {step.icon}
                            </div>
                            <div className={styles.timelineContent}>
                                <Text strong style={{ marginRight: 5 }}>{step.title}</Text>
                                <Text type="secondary">{step.description}</Text>
                            </div>
                            {index < steps.length - 1 && <div className={styles.timelineConnector} />}
                        </div>
                    ))}
                </div>
            </Card>

            <Card className={styles.infoCard}>
                <Title level={4} className={styles.sectionTitle}>Important Information</Title>
                <List
                    itemLayout="horizontal"
                    dataSource={[
                        'You will receive a confirmation email with your submission details.',
                        'Our team typically reviews submissions within 1-2 business days.',
                        'Once approved, your ad will be scheduled to run as per your selected dates.',
                        'For any questions, please contact our support team at ads@kaboomcollab.com',
                    ]}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<CheckCircleFilled style={{ color: '#52c41a' }} />}
                                description={item}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <div className={styles.ctaSection}>
                <Title level={4}>Need to make changes to your submission?</Title>
                <Paragraph>
                    If you need to update any information about your ad, please contact our support team at{' '}
                    <a href="mailto:ads@kaboomcollab.com">support@kaboomcollab.com</a> with your submission details.
                </Paragraph>
            </div>
        </div>
    );
};

export default AdConfirmationPage;