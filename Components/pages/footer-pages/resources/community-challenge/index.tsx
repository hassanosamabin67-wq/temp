import React from "react";
import "./style.css";
import Link from "next/link";
import MaxWidthWrapper from "@/Components/UIComponents/MaxWidthWrapper";

function CommunityChallenge() {
  return (
    <MaxWidthWrapper className="community-challenge-container">
      {/* Hero Section */}
      <div className="community-challenge-hero">
        <div className="community-challenge-hero-content">
          <h1 className="community-challenge-hero-title">Kaboom Collab Community Challenge</h1>
          <h3 className="community-challenge-hero-subtitle">
            Push creative boundaries, showcase your talent, and gain recognition.
          </h3>
        </div>
      </div>

      {/* Current Challenge Section */}
      <div className="current-challenge-section">
        <h2 className="section-title">Current Challenge</h2>
        <h3 className="challenge-title">Design a Digital Album Cover Inspired by Urban Landscapes</h3>
        <p className="challenge-description">
          Capture the energy and essence of urban life through bold, creative designs.
        </p>
        <div className="challenge-details-grid">
          <div className="challenge-details-card">
            <h3 className="details-title">How to Enter</h3>
            <div className="details-content">
              <p><span className="highlight">Eligibility:</span> Open to all visionaries in visual arts.</p>
              <p><span className="highlight">File Format:</span> High-quality JPEG or PNG, 3000x3000 pixels.</p>
              <p><span className="highlight">Description:</span> Include a short description of your inspiration.</p>
              <p><span className="highlight">Deadline:</span> Submit by November 30, 2024.</p>
            </div>
          </div>
          <div className="challenge-details-card">
            <h3 className="details-title">Prizes and Recognition</h3>
            <div className="details-content">
              <p><span className="highlight">1st Place:</span> $100 Gift Card + Exclusive Badge.</p>
              <p><span className="highlight">Top 3 Entries:</span> Featured in the Challenge Gallery and Hall of Creatives for one month.</p>
              <p><span className="highlight">Community Choice Award:</span> Selected by community vote, highlighted on social media.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hall of Creatives & Challenge Gallery Section */}
      <div className="hall-of-creatives-section">
        <h2 className="section-title">Hall of Creatives & Challenge Gallery</h2>
        <div className="hall-of-creatives-grid">
          <div className="hall-of-creatives-card">
            <h3 className="hall-title">Hall of Creatives</h3>
            <p className="hall-description">
              Celebrate winners showcased on Kaboom Collab's main pages, connecting them with clients and collaborators.
            </p>
          </div>
          <div className="hall-of-creatives-card">
            <h3 className="hall-title">Challenge Gallery</h3>
            <p className="hall-description">
              View and interact with submissions, leave comments, and explore past challenges in the Hall of Creatives.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Challenges Section */}
      <div className="upcoming-challenges-section">
        <h2 className="section-title">Upcoming Challenges</h2>
        <h3 className="upcoming-challenge-title">
          Next Month: "Create a 30-Second Audio Loop Inspired by Nature Sounds."
        </h3>
        <p className="upcoming-challenge-description">
          Opt-in for notifications and be the first to participate!
        </p>
      </div>

      {/* Call to Action Section */}
      <div className="community-challenge-cta">
        <h2 className="cta-title">Join the Challenge Today!</h2>
        <p className="cta-description">
          Unleash your creativity and take your place in the Hall of Creatives. Participate now and let your talent shine!
        </p>
        {/* <button className="cta-button">Enter Now</button> */}
        <Link className="cta-button" href={'/think-tank'}>Enter Now</Link>
      </div>
    </MaxWidthWrapper>
  );
}

export default CommunityChallenge;