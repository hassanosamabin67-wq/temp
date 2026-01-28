'use client';
import React from 'react';
import { Card, Typography, List, Divider, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from './styles.module.css';

const { Title, Paragraph } = Typography;

const AdGuidelines = () => {
    const dos = [
        'Upload high-quality MP4 or MOV (15–30 seconds)',
        'Use clean and professional visuals',
        'Provide accurate information',
        'Use copyright-free music',
        'Keep your message brand-safe and community-friendly',
        'Include a clear call-to-action',
        'Test your video before uploading',
        'Ensure audio is clear and balanced'
    ];

    const donts = [
        'No explicit or adult content',
        'No hateful, violent, or discriminatory language',
        'No copyrighted music without proper rights',
        'No misleading or scam-like claims',
        'No flashing/strobe-heavy visuals',
        'No distorted, blurry, or low-quality video',
        'No excessive volume or jarring audio',
        'No unrelated or offensive imagery'
    ];

    return (
        <div className={styles.guidelinesContainer}>
            <div className={styles.header}>
                <Title level={2}>Ad Guidelines</Title>
                <Paragraph>
                    Follow these guidelines to ensure your ad is approved quickly and performs well
                </Paragraph>
            </div>

            <Alert
                message="Important Notice"
                description="All ads undergo a review process before going live. Adhering to these guidelines will help ensure quick approval."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 24 }}
            />

            <Row className={styles.guidelinesRow}>
                <Col xs={24} lg={12} className={styles.guidelineCol}>
                    <Card title={<span className={styles.dosTitle}><CheckCircleOutlined /> DO:</span>} className={styles.dosCard}>
                        <List
                            dataSource={dos}
                            renderItem={item => (
                                <List.Item className={styles.listItem}>
                                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '12px', fontSize: '16px' }} />
                                    {item}
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={12} className={styles.guidelineCol}>
                    <Card title={<span className={styles.dontsTitle}><CloseCircleOutlined /> DON'T:</span>} className={styles.dontsCard}>
                        <List
                            dataSource={donts}
                            renderItem={item => (
                                <List.Item className={styles.listItem}>
                                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '12px', fontSize: '16px' }} />
                                    {item}
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            <Divider />

            <Card title="Technical Requirements" className={styles.technicalCard}>
                <div className={styles.techRequirements}>
                    <div className={styles.techItem}>
                        <Title level={5}>Video Duration</Title>
                        <Paragraph>15–30 seconds</Paragraph>
                    </div>
                    <div className={styles.techItem}>
                        <Title level={5}>File Format</Title>
                        <Paragraph>MP4 or MOV</Paragraph>
                    </div>
                    <div className={styles.techItem}>
                        <Title level={5}>Max File Size</Title>
                        <Paragraph>50 MB</Paragraph>
                    </div>
                    <div className={styles.techItem}>
                        <Title level={5}>Recommended Resolution</Title>
                        <Paragraph>1920x1080 (16:9) or 1080x1920 (9:16)</Paragraph>
                    </div>
                </div>
            </Card>

            <Divider />

            <Card title="Review & Approval Policy" className={styles.policyCard}>
                <Paragraph>
                    All ads undergo a review process before going live. The review typically takes 1-2 business days.
                </Paragraph>
                <Paragraph>
                    <strong>If your ad is not approved:</strong> You may revise and re-upload at no additional cost.
                    We'll provide specific feedback on why your ad was rejected.
                </Paragraph>
                <Paragraph>
                    <strong>Refund Policy:</strong> Refunds are only issued if the final revised ad meets all guidelines
                    and Kaboom Collab still declines to run it.
                </Paragraph>
            </Card>

            <Divider />

            <Card title="Ad Placement Information" className={styles.placementCard}>
                <List>
                    <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                        Your ad plays in the Lobby mini-screen during the 30 minutes before a live session begins
                    </List.Item>
                    <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                        Your ad plays once as a pre-roll before the Replay for up to 30 days or 2,000 impressions
                    </List.Item>
                    <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                        Exposure inside a premium, creative-focused ecosystem
                    </List.Item>
                    <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                        Non-clickable ads ensure a clean, safe, distraction-free environment
                    </List.Item>
                </List>
            </Card>

            <Alert
                message="Need Help?"
                description="If you have questions about the guidelines or need assistance with your ad, please contact our support team support@kaboomcollab.com."
                type="success"
                showIcon
                style={{ marginTop: 24 }}
            />
        </div>
    );
};

// Create Row and Col components if not using antd Grid
const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {children}
    </div>
);

const Col = ({ children, xs, lg, className }: { children: React.ReactNode; xs?: number; lg?: number; className?: string }) => (
    <div className={className} style={{ flex: `0 0 ${lg ? (lg / 24) * 100 : 100}%`, minWidth: xs === 24 ? '100%' : 'auto' }}>
        {children}
    </div>
);

export default AdGuidelines;