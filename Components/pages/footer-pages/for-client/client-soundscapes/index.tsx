"use client";
import React from "react";
import "./style.css";
import BenefitsSoundscape from "./benifit";

function Soundscape() {
  const stepGuide = [
    {
      title: "How Soundscapes Enhances Your Project",
      subHeading1: "Live Music Sessions:",
      subHeading2: "Category Details:",
      subHeading3: "Interactive Audio Collaboration:",
      step1:
        "Collaborate directly with musicians, vocalists, and producers in a private, real-time setting.",
      step2:
        "Share tracks, receive immediate input, and refine your music together to achieve the best results.",
      step3:
        "Perfect for music production, podcasting, voiceovers, and other audio projects that benefit from hands-on creative involvement.",
    },
    {
      title: "Define Project Scope and Timeline",
      subHeading1: "Project Description:",
      subHeading2: "Set Milestones and Timeline:",
      step1:
        "Outline your project goals, expectations, and specific requirements to help visionaries understand your vision.",
      step2:
        "Define any milestones or deadlines for each phase of your project.",
    },
    {
      title: "Set Your Budget",
      subHeading1: "Budget Range:",
      subHeading2: "Flexible or Fixed:",
      step1:
        "Establish a budget for your project or individual milestones if applicable.",
      step2:
        "Specify if you’re open to flexibility within the budget to attract visionaries with varying experience levels.",
    },
    {
      title: "Optional: Select a Collab Room for Enhanced Collaboration",
      subHeading1: "Collab Rooms (Optional):",
      subHeading2: "Flexible or Fixed:",
      step1:
        "If your project would benefit from real-time collaboration, consider using a Soundscape, Art Exhibit, or Think Tank Collaborative.",
    },
    {
      title: "Publish Your Project and Connect with Visionaries",
      subHeading1: "Review and Publish:",
      subHeading2: "Review Applications:",
      step1:
        "Double-check all project details, then publish your post to start receiving applications.",
      step2:
        "As applications come in, review visionary profiles, portfolios, and messages to select the best fit.",
    },
  ];

  return (
    <>
      <div className="soundscape-container">
        <div className="guide">
          <div className="guide-header">
            <h2 className="guide-title">Soundscapes (For Clients)</h2>
            <p className="guide-subtitle">
              Experience Real-Time Audio Collaboration with Talented Musicians
              and Entertainers. Soundscapes is Kaboom Collab’s dedicated space
              for clients working on music and entertainment projects.
            </p>
          </div>

          <ol className="guide-steps">
            {stepGuide.map((step, index) => (
              <li key={index} className="step-item">
                <div className="step-header">
                  <span className="step-number">{index + 1}</span>
                  <h3 className="step-title">{step.title}</h3>
                </div>
                <div className="step-content">
                  <div className="step-detail">
                    <span className="step-subheading">{step.subHeading1}</span>
                    <p className="step-description">{step.step1}</p>
                  </div>
                  {step.subHeading2 && step.step2 && (
                    <div className="step-detail">
                      <span className="step-subheading">
                        {step.subHeading2}
                      </span>
                      <p className="step-description">{step.step2}</p>
                    </div>
                  )}
                  {step.subHeading3 && step.step3 && (
                    <div className="step-detail">
                      <span className="step-subheading">
                        {step.subHeading3}
                      </span>
                      <p className="step-description">{step.step3}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <BenefitsSoundscape />
        </div>
        <section className="get-started-section">
          <div className="get-started-content">
            <h1 className="get-started-heading">
              Ready to Elevate Your Music Project?
            </h1>
            <p className="get-started-description">
              Request access to Soundscape and experience the power of real-time
              creative collaboration.
            </p>
            <div className="get-started-actions">
              <button className="cta-button">
                Request Access to Soundscapes
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Soundscape;
