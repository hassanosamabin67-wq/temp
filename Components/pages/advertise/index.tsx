'use client'
import React from 'react';
import { Typography, Divider, List, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styles from './styles.module.css';
import Link from 'next/link';
import { useAppSelector } from '@/store';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const { Title, Paragraph } = Typography;

const AdvertisePage = () => {
  const profile = useAppSelector((state) => state.auth);

  const dos = [
    'Upload high-quality MP4 or MOV (15–30 seconds)',
    'Use clean and professional visuals',
    'Provide accurate information',
    'Use copyright-free music',
    'Keep your message brand-safe and community-friendly'
  ];

  const donts = [
    'No explicit or adult content',
    'No hateful, violent, or discriminatory language',
    'No copyrighted music without proper rights',
    'No misleading or scam-like claims',
    'No flashing/strobe-heavy visuals',
    'No distorted, blurry, or low-quality video'
  ];

  return (
    <MaxWidthWrapper className={styles.container}>
      <div className={styles.header}>
        <Title level={1} className={styles.title}>Advertise on Kaboom Collab</Title>
        <Paragraph className={styles.intro}>
          Kaboom Collab offers a premium advertising opportunity inside a curated community of musicians, artists, performers, strategists, and creators.
          Promote your brand with a 15–30 second video ad placed directly inside the Collab Room Lobby and Replay videos for active sessions.
        </Paragraph>
        <Space className={styles.ctaButtonDiv} size="middle" wrap>
          <Link href="/advertise/dashboard?tab=upload">
            <ActionButton size="large" className={styles.ctaButton}>
              Request Ad Space - $25
            </ActionButton>
          </Link>
          {profile.profileId && (<Link href="/advertise/dashboard">
            <ActionButton size="large" className={styles.ctaButton}>
              Go to Advertiser Dashboard
            </ActionButton>
          </Link>)}
        </Space>
      </div>

      <div className={styles.section}>
        <Title level={2}>What You Receive for $25</Title>
        <List
          itemLayout="horizontal"
          dataSource={[
            'Ad plays in the Collab Room lobby mini-screen before the live session begins',
            'Ad plays once as a pre-roll on the replay video',
            'Placement runs for up to 30 days OR 2,000 impressions (whichever comes first)',
            'Ads are displayed inside the room experience (no pop-ups, no redirects)',
            'Revenue is shared with the Visionary hosting the room (70/30 split)'
          ]}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />}
                description={item}
              />
            </List.Item>
          )}
        />
      </div>

      <Divider />

      <div className={styles.section}>
        <Title level={2}>Don't Have a Promotional Video Yet?</Title>
        <p style={{ marginBottom: '16px' }}>
          Not every brand comes with a ready-made promo video — and that's okay.
        </p>
        <p style={{ marginBottom: '24px' }}>
          Kaboom Collab connects advertisers with vetted Visionaries who specialize in promotional videos,
          branded visuals, and creative storytelling designed specifically for Collab Rooms and replay
          formats.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <p>Need a Promotional Video?</p>
          <Link href={"/services/Entertainment/Promotional Videos"}>Work With a Visionary</Link>
        </div>
      </div>

      <Divider />

      <div className={styles.section}>
        <Title level={2}>Do's and Don'ts</Title>
        <div className={styles.dosDonts}>
          <div className={styles.dos}>
            <Title level={4} className={styles.dosTitle}>DO:</Title>
            <List
              dataSource={dos}
              renderItem={item => (
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  {item}
                </List.Item>
              )}
            />
          </div>
          <div className={styles.donts}>
            <Title level={4} className={styles.dontsTitle}>DON'T:</Title>
            <List
              dataSource={donts}
              renderItem={item => (
                <List.Item>
                  <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                  {item}
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>

      <Divider />

      <div className={styles.section}>
        <Title level={2}>Review & Approval Policy</Title>
        <Paragraph>
          All ads undergo a review process before going live. If your ad is not approved, you may revise and re-upload at no additional cost.
          Refunds are only issued if the final revised ad meets all guidelines and Kaboom Collab still declines to run it.
        </Paragraph>
      </div>

      <div className={styles.ctaSection}>
        <Title level={3}>Ready to get started?</Title>
        <Space className={styles.ctaButtonDiv} size="middle" wrap>
          <Link href="/advertise/dashboard?tab=upload">
            <ActionButton size="large" className={styles.ctaButton}>
              Request Ad Space - $25
            </ActionButton>
          </Link>
          {profile.profileId && (<Link href="/advertise/dashboard">
            <ActionButton size="large" className={styles.ctaButton}>
              Go to Advertiser Dashboard
            </ActionButton>
          </Link>)}
        </Space>
      </div>
    </MaxWidthWrapper>
  );
};

export default AdvertisePage;