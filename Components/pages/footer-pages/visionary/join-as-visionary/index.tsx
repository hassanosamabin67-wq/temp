'use client'
import React, { useState } from "react";
import { Card } from "antd";
import "./style.css"; // Import the CSS file
import LoginModal from "@/Components/custom/login-modal";
import { useAppSelector } from "@/store";
import { useRouter } from "next/navigation";
import { BASE_URL, BASE_URL_CLIENT } from "@/utils/constants/navigations";
import ActionButton from "@/Components/UIComponents/ActionBtn";

const sections = [
  {
    title: "Why Join Kaboom Collab?",
    content: [
      {
        bold: "A Dedicated Creative Community:",
        text: " Connect with other creators, clients, and industry professionals who share your passion for music, arts, and entertainment.",
      },
      {
        bold: "Collaborate in Real-Time:",
        text: " Take advantage of unique spaces like Soundscapes, Art Exhibits, and Think Tank Collaboratives to work with others.",
      },
      {
        bold: "Opportunities to Grow:",
        text: " Participate in mentorship programs, workshops, and industry events that help you refine your skills.",
      },
      {
        bold: "Flexible Monetization:",
        text: " Showcase your work in Art Exhibits, offer mentorship sessions, and monetize your talents through a tiered commission structure.",
      },
    ],
  },
  {
    title: "How It Works",
    content: [
      {
        bold: "Create Your Profile:",
        text: " Showcase your skills, portfolio, and experience in music, arts, or entertainment. Set yourself apart with a professional profile.",
      },
      {
        bold: "Discover Projects and Clients:",
        text: " Browse collaboration opportunities and projects posted by clients or other visionaries.",
      },
      {
        bold: "Collaborate in Creative Spaces:",
        text: " Join Soundscapes, host Art Exhibits, or brainstorm with peers in Think Tank Collaboratives.",
      },
      {
        bold: "Earn and Grow:",
        text: " Get paid securely through the platform with options for project-based or milestone payments.",
      },
    ],
  },
  {
    title: "Features for Visionaries",
    content: [
      {
        bold: "Mentorship Program:",
        text: " Join Kaboom Collab’s mentorship program as either a mentor or mentee.",
      },
      {
        bold: "Personalized Growth Opportunities:",
        text: " Access tailored workshops, professional development sessions, and curated resources.",
      },
      {
        bold: "Recognition and Community:",
        text: " Kaboom Collab celebrates visionaries who contribute to the community.",
      },
    ],
  },
];

const JoinAsVisionary: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const profile = useAppSelector((state) => state.auth);
  const router = useRouter();

  const handleJoinClick = () => {
    if (profile.profileId) {
      // User is already logged in, show loading and redirect to appropriate dashboard
      setShowLoading(true);
      if (profile.profileType?.toLowerCase() === "client") {
        router.push(`/${BASE_URL_CLIENT}`);
      } else {
        router.push(`/${BASE_URL}`);
      }
      // Don't reset loading - page will navigate away
    } else {
      // User is not logged in, show login modal (no loading needed)
      setShowModal(true);
    }
  };

  return (
    <div className="join-container">
      {/* Banner Section */}
      <div className="banner-section">
        <h1 className="banner-title">Join as a Visionary on Kaboom Collab</h1>
        <p className="banner-subtitle">Unleash Your Creativity, Connect, and Thrive</p>
        <p className="banner-description">
          Kaboom Collab is more than just a platform—it’s a creative hub where talented visionaries like you can showcase your skills, collaborate on exciting projects, and build lasting professional relationships.
        </p>
      </div>

      {sections.map((section, index) => (
        <Card key={index} className="join-card">
          <h1 className="join-title">{section.title}</h1>
          <div className="divider" />
          <ul className="join-list">
            {section?.content?.map((item, i) => (
              <li key={i}>
                <strong>{item.bold}</strong> {item.text}
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <Card className="join-card">
        <h1 className="join-title">Ready to Join Kaboom Collab?</h1>
        <p>
          Join a community that believes in your creative potential and values your work. Start connecting with clients, growing your skills, and building the career you’ve always envisioned.
        </p>
        <div className="join-footer">
          <ActionButton className="join-button" onClick={handleJoinClick} loading={showLoading}>Get Started as Visionary</ActionButton>
          <LoginModal visible={showModal} onClose={() => setShowModal(false)} />
        </div>
      </Card>
    </div>
  );
};

export default JoinAsVisionary;
