"use client";
import React from "react";
import "./style.css";

function GuidePostProject() {
  const stepGuide = [
    {
      title: "Choose Your Project Category",
      subHeading1: "Main Categories:",
      subHeading2: "Category Details:",
      step1:
        "Start by selecting the primary category for your project—such as Music, Visual Arts, Performing Arts, or Entertainment Content.",
      step2:
        "Within each category, you’ll find subcategories to further define your project (e.g., Audio Engineering in Music or Logo Design in Visual Arts).",
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
    <div className="guide">
      <div className="guideProject">
        <div className="title">
          <h2>Step-by-Step Guide to Posting a Project</h2>
        </div>
        <ol className="stepList">
          {stepGuide.map((step, index) => (
            <li key={index} className="stepItem">
              <h3 className="stepTitle">{step.title}</h3>
              <div className="steps">
                <div className="stepDetail">
                  <span className="subHeading">{step.subHeading1}</span>
                  <p>{step.step1}</p>
                </div>
                {step.subHeading2 && step.step2 && (
                  <div className="stepDetail">
                    <span className="subHeading">{step.subHeading2}</span>
                    <p>{step.step2}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default GuidePostProject;
