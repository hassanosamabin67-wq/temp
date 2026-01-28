import React from "react";
import "./style.css";
import WhatWeOffer from "./whatweoffer";
import CustomGetStarted from "@/Components/custom/custom-get-started";
import MaxWidthWrapper from "@/Components/UIComponents/MaxWidthWrapper";

function About() {
  return (
    <div className="about-container">
      <div className="padding-container">
        <div className="company-welcome">
          <h1 className="company-title">Welcome to Kaboom Collab</h1>
          <p className="company-subtitle">Your Creative Hub</p>
        </div>
      </div>
      <MaxWidthWrapper>
        <div className="guideProject">
          <div className="title">
            <h2>Our Mission</h2>
            <p>
              To empower visionaries by creating a space where creativity,
              collaboration, and growth thrive. Kaboom Collab isn’t just a place
              to find talent—it’s where creative minds come together to share
              ideas, learn from one another, and build long-term connections.
            </p>
          </div>
        </div>

        <div className="guideProject">
          <div className="title">
            <h2>Our Story</h2>
            <p>
              At Kaboom Collab, we started with a vision: to bring creators
              together in a space that fosters artistic expression, innovation,
              and meaningful collaboration. What began as a small idea has
              evolved into a thriving community where artists, designers, and
              creators push their boundaries and showcase their work to the world.
            </p>
          </div>
        </div>
      </MaxWidthWrapper>
      <MaxWidthWrapper className="values-section">
        <h1 className="values-title">Our Values</h1>
        <div className="values-grid">
          <div className="valueBox">
            <h2>Creativity</h2>
            <p>
              We celebrate and encourage original ideas, giving creators the
              freedom to push boundaries.
            </p>
          </div>
          <div className="valueBox">
            <h2>Collaboration</h2>
            <p>
              A meeting place for creatives who want to connect and grow as a
              community.
            </p>
          </div>
          <div className="valueBox">
            <h2>Integrity</h2>
            <p>
              We are committed to transparency and fairness in all
              collaborations.
            </p>
          </div>
          <div className="valueBox">
            <h2>Growth</h2>
            <p>
              A space for creators to learn, develop, and reach their full
              potential.
            </p>
          </div>
          <div className="valueBox">
            <h2>Inclusivity</h2>
            <p>
              We welcome visionaries from all backgrounds and perspectives.
            </p>
          </div>
        </div>
      </MaxWidthWrapper>

      <WhatWeOffer />
      <CustomGetStarted
        ctabtn="Get Started"
        description="Find collaborators, showcase your talent, and explore new creative possibilities with Kaboom Collab."
        heading="Join Us on the Creative Journey"
      />
    </div>
  );
}

export default About;
