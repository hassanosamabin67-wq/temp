'use client'
import React from "react";
import "./style.css";
import Link from "next/link";
import MaxWidthWrapper from "@/Components/UIComponents/MaxWidthWrapper";

function TutorialGuideComponent() {
  return (
    <MaxWidthWrapper className="tutorial-guide-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Kaboom Collab Tutorials & Guides</h1>
          <h3 className="hero-subtitle">Welcome to the Kaboom Collab Resource Hub</h3>
          <p className="hero-description">
            Discover step-by-step tutorials, best practices, and tips to make
            the most of Kaboom Collab’s features and collaborative tools.
          </p>
          {/* <button className="hero-button">Get Started</button> */}
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="getting-started-section">
        <h2 className="section-title">Getting Started</h2>
        <div className="getting-started-grid">
          <div className="getting-started-card">
            <h3 className="card-title">For Visionaries</h3>
            <div className="card-content">
              <p><span className="highlight">Creating Your Profile:</span> Learn how to set up a profile that highlights your skills, portfolio, and experience.</p>
              <p><span className="highlight">Navigating Project Opportunities:</span> A guide to finding and applying to projects that match your expertise.</p>
            </div>
          </div>
          <div className="getting-started-card">
            <h3 className="card-title">For Clients</h3>
            <div className="card-content">
              <p><span className="highlight">Posting Your First Project:</span> Tips on crafting a project post that attracts the right talent.</p>
              <p><span className="highlight">Finding the Perfect Visionary:</span> Learn how to browse profiles and select the best match.</p>
              <p><span className="highlight">Managing Projects and Payments:</span> Track progress, set milestones, and manage secure payments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration Tools Section */}
      <div className="collaboration-tools-section">
        <h2 className="section-title">Collaboration Tools and Features</h2>
        <div className="tools-grid">
          <div className="tool-card">
            <h3 className="card-title">Soundscapes Tutorial</h3>
            <p className="card-description">
              Learn how to use Soundscapes for live music collaboration, audio
              sharing, and hosting private sessions.
            </p>
          </div>
          <div className="tool-card">
            <h3 className="card-title">Art Exhibits Tutorial</h3>
            <p className="card-description">
              Discover tips for setting up virtual art exhibits and engaging
              with clients and fellow visionaries.
            </p>
          </div>
          <div className="tool-card">
            <h3 className="card-title">Think Tank Collaboratives</h3>
            <p className="card-description">
              Maximize brainstorming and project planning with virtual
              whiteboards and group creativity tools.
            </p>
          </div>
        </div>
      </div>

      {/* Explore Section */}
      <div className="explore-section">
        <h2 className="section-title">Explore Our Guides and Start Creating</h2>
        <p className="explore-description">
          Get started by diving into our tutorials and resources. Whether
          you’re new or looking to expand your skills, we’re here to help you
          succeed.
        </p>
        <button className="explore-button" onClick={() => window.open("https://www.youtube.com/@kaboomcollab4893", "_blank")}>Learn More</button>
        {/* <Link className="explore-button" href={'https://www.youtube.com/@kaboomcollab4893'} >Learn More</Link> */}
      </div>
    </MaxWidthWrapper>
  );
}

export default TutorialGuideComponent;