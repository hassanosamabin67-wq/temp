"use client";
import { CheckCircle2, XCircle, Megaphone, Play, Shield } from 'lucide-react';
import './advertise.css';
import Link from 'next/link';
import { useAppSelector } from '@/store';

export default function AdvertisePage() {
  const profile = useAppSelector((state) => state.auth);
  const benefits = [
    'Ad plays in the Collab Room lobby mini-screen before the live session begins',
    'Ad plays once as a pre-roll on the replay video',
    'Placement runs for up to 30 days OR 2,000 impressions (whichever comes first)',
    'Ads are displayed inside the room experience (no pop-ups, no redirects)',
    'Revenue is shared with the Visionary hosting the room (70/30 split)',
  ];
  const dos = [
    'Upload high-quality MP4 or MOV (15–30 seconds)',
    'Use clean and professional visuals',
    'Provide accurate information',
    'Use copyright-free music',
    'Keep your message brand-safe and community-friendly',
  ];
  const donts = [
    'No explicit or adult content',
    'No hateful, violent, or discriminatory language',
    'No copyrighted music without proper rights',
    'No misleading or scam-like claims',
    'No flashing/strobe-heavy visuals',
    'No distorted, blurry, or low-quality video',
  ];

  return (
    <div className="advertise-page">
      {/* Hero Section */}
      <div className="advertise-hero">
        <div className="advertise-hero-background" />
        <div className="advertise-hero-blobs">
          <div className="advertise-hero-blob-1" />
          <div className="advertise-hero-blob-2" />
          <div className="advertise-hero-blob-3" />
        </div>
        <div className="advertise-hero-content">
          <div className="advertise-hero-icon">
            <Megaphone className="advertise-icon-animated" />
          </div>
          <h1 className="advertise-hero-title">Advertise on Kaboom Collab</h1>
          <p className="advertise-hero-subtitle">
            Kaboom Collab offers a premium advertising opportunity inside a curated community of musicians,
            artists, performers, strategists, and creators. Promote your brand with a 15–30 second video ad placed
            directly inside the Collab Room Lobby and Replay videos for active sessions.
          </p>
          <div className="advertise-hero-buttons">
            <Link href="/advertise/dashboard?tab=upload">
              <button className="advertise-btn-primary">
                <Play size={20} />
                Request Ad Space - $25
              </button>
            </Link>
            {profile.profileId && (
              <Link href="/advertise/dashboard">
                <button className="advertise-btn-secondary">
                  Go to Advertiser Dashboard
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="advertise-main">
        <div className="advertise-container">
          {/* Benefits Section */}
          <section className="advertise-section">
            <div className="advertise-section-header">
              <h2 className="advertise-section-title">What You Receive for $25</h2>
              <div className="advertise-section-underline" />
            </div>
            <div className="advertise-benefits">
              {benefits.map((benefit, index) => (
                <div key={index} className="advertise-benefit-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="advertise-benefit-icon">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="advertise-benefit-text">{benefit}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Promo Video Section */}
          <section className="advertise-section">
            <div className="advertise-promo-card">
              <div className="advertise-promo-content">
                <h2 className="advertise-promo-title">Don't Have a Promotional Video Yet?</h2>
                <p className="advertise-promo-text">
                  Not every brand comes with a ready-made promo video — and that's okay.
                </p>
                <p className="advertise-promo-text">
                  Kaboom Collab connects advertisers with <strong>vetted Visionaries</strong> who specialize in promotional videos,
                  branded visuals, and creative storytelling designed specifically for Collab Rooms and replay formats.
                </p>
                <p className="advertise-promo-text">
                  Need a Promotional Video?{' '}
                  <Link href="/services/Entertainment/Promotional Videos" className="advertise-link">Work With a Visionary</Link>
                </p>
              </div>
            </div>
          </section>

          {/* Do's and Don'ts Section */}
          <section className="advertise-section">
            <div className="advertise-section-header">
              <h2 className="advertise-section-title">Do's and Don'ts</h2>
              <div className="advertise-section-underline" />
            </div>
            <div className="advertise-guidelines">
              {/* Do's */}
              <div className="advertise-guidelines-column">
                <h3 className="advertise-guidelines-title do">DO:</h3>
                <div className="advertise-guidelines-list">
                  {dos.map((item, index) => (
                    <div key={index} className="advertise-guideline-item do" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="advertise-guideline-icon do">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="advertise-guideline-text">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Don'ts */}
              <div className="advertise-guidelines-column">
                <h3 className="advertise-guidelines-title dont">DON'T:</h3>
                <div className="advertise-guidelines-list">
                  {donts.map((item, index) => (
                    <div key={index} className="advertise-guideline-item dont" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="advertise-guideline-icon dont">
                        <XCircle size={20} />
                      </div>
                      <p className="advertise-guideline-text">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Policy Section */}
          <section className="advertise-section">
            <div className="advertise-policy-card">
              <div className="advertise-policy-icon">
                <Shield size={32} />
              </div>
              <h2 className="advertise-policy-title">Review & Approval Policy</h2>
              <p className="advertise-policy-text">
                All ads undergo a review process before going live. If your ad is not approved, you may revise and
                re-upload at no additional cost. Refunds are only issued if the final revised ad meets all guidelines
                and Kaboom Collab still declines to run it.
              </p>
            </div>
          </section>

          {/* CTA Section */}
          <section className="advertise-cta-section">
            <h2 className="advertise-cta-title">Ready to get started?</h2>
            <div className="advertise-cta-buttons">
              <Link href="/advertise/dashboard?tab=upload">
                <button className="advertise-btn-primary">
                  <Play size={20} />
                  Request Ad Space - $25
                </button>
              </Link>
              {profile.profileId && (
                <Link href="/advertise/dashboard">
                  <button className="advertise-btn-secondary">
                    Go to Advertiser Dashboard
                  </button>
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}