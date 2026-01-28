import React from "react";
import "./style.css";
import MaxWidthWrapper from "@/Components/UIComponents/MaxWidthWrapper";

function MentorshipComponent() {
  return (
    <MaxWidthWrapper className="mentorship-container">
      {/* Hero Section */}
      <div className="mentorship-hero">
        <div className="mentorship-hero-content">
          <h1 className="mentorship-hero-title">Kaboom Collab Mentorship Program</h1>
          <h3 className="mentorship-hero-subtitle">Guidance for Every Step of Your Creative Journey</h3>
        </div>
      </div>

      {/* Program Tiers Section */}
      <div className="mentorship-program-tiers">
        <h2 className="mentorship-section-title">Program Tiers</h2>
        <div className="mentorship-tiers-grid">
          <div className="mentorship-tier-card">
            <h3 className="mentorship-tier-title">Community Access (Free)</h3>
            <div className="mentorship-tier-content">
              <p><span className="mentorship-highlight">Mentorship Circles:</span> Free group sessions (6-10 mentees) led by industry mentors on topics like “Introduction to Songwriting.”</p>
              <p><span className="mentorship-highlight">Workshops:</span> Monthly sessions with guest mentors on broad topics like “Networking for Creatives.”</p>
            </div>
          </div>
          <div className="mentorship-tier-card">
            <h3 className="mentorship-tier-title">Advanced Mentorship (Paid)</h3>
            <div className="mentorship-tier-content">
              <p><span className="mentorship-highlight">One-on-One Sessions:</span> Personalized mentorship for specific needs like portfolio reviews or advanced marketing.</p>
              <p><span className="mentorship-highlight">Mentor Academy:</span> Structured courses with beginner and intermediate levels, including certifications.</p>
              <p><span className="mentorship-highlight">Advanced Group Tracks:</span> Focused training in small groups on specialized topics like “Writing for Film.”</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Summary Section */}
      <div className="mentorship-pricing-summary">
        <h2 className="mentorship-section-title">Pricing Summary for Paid Tiers</h2>
        <div className="mentorship-pricing-grid">
          <div className="mentorship-pricing-card">
            <h3 className="mentorship-pricing-title">One-on-One Sessions</h3>
            <p className="mentorship-pricing-detail">Pricing: $40-$100 per session</p>
            <p className="mentorship-pricing-detail">Platform Cut: 10-15% commission</p>
          </div>
          <div className="mentorship-pricing-card">
            <h3 className="mentorship-pricing-title">Mentor Academy</h3>
            <p className="mentorship-pricing-detail">Beginner Level: $100</p>
            <p className="mentorship-pricing-detail">Intermediate Level: $200</p>
            <p className="mentorship-pricing-detail">Certification Fee: Included</p>
          </div>
          <div className="mentorship-pricing-card">
            <h3 className="mentorship-pricing-title">Advanced Group Tracks</h3>
            <p className="mentorship-pricing-detail">Subscription: $50/month</p>
            <p className="mentorship-pricing-detail">Pay-per-Track: $75 per track</p>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="mentorship-cta">
        <h2 className="mentorship-section-title">Join the Kaboom Collab Mentorship Program</h2>
        <p className="mentorship-cta-description">
          Explore our free and paid programs, connect with mentors, and elevate your creative journey today.
        </p>
        {/* <button className="mentorship-cta-button">Get Started</button> */}
      </div>
    </MaxWidthWrapper>
  );
}

export default MentorshipComponent;