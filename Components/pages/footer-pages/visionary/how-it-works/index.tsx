'use client'
import React, { useState } from "react";
import { Card, Row, Col } from "antd";
import "./style.css";
import LoginModal from "@/Components/custom/login-modal";
import MaxWidthWrapper from "@/Components/UIComponents/MaxWidthWrapper";
import ActionButton from "@/Components/UIComponents/ActionBtn";
import { useAppSelector } from "@/store";
import { useRouter } from "next/navigation";
import { BASE_URL, BASE_URL_CLIENT } from "@/utils/constants/navigations";
const howitworksbg = "/assets/img/howitworks.svg";

const steps = [
  {
    title: "Join the Creative Community",
    points: [
      "Sign Up: Create your profile as either a visionary or a client.",
      "Build Your Profile: Showcase your skills, portfolio, or creative needs.",
    ],
  },
  {
    title: "Discover Talent and Opportunities",
    points: [
      "Explore Visionaries: Browse curated profiles in music, visual arts, and entertainment.",
      "Find Projects and Collaborations: Connect with clients, join projects, or participate in Soundscapes, Art Exhibits, and Think Tank Collaboratives.",
    ],
  },
  {
    title: "Start Collaborating",
    points: [
      "Soundscapes: Host private rooms for listening parties and brainstorming.",
      "Art Exhibits: Showcase work, connect with buyers, and gain inspiration.",
      "Think Tank Collaboratives: Collaborate globally to build innovative projects.",
    ],
  },
  {
    title: "Secure and Transparent Transactions",
    points: [
      "Set Project Terms: Outline the scope, deliverables, and timeline.",
      "Flexible Payment Options: Secure transactions with milestone payments.",
      "Protection with Contracts and NDAs: Kaboom Collab provides built-in contracts and NDAs.",
    ],
  },
  {
    title: "Grow, Network, and Thrive",
    points: [
      "Build Lasting Connections: Foster professional relationships and explore new projects.",
      "Professional Growth: Join workshops, gain insights, and stay updated.",
      "Community Engagement: Participate in discussions and be part of a creative community.",
    ],
  },
];

const CreativeCommunity = () => {
  const [showModal, setShowModal] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const profile = useAppSelector((state) => state.auth);
  const router = useRouter();

  const handleJoinClick = () => {
    if (profile.profileId) {
      // User is already logged in, show loading and redirect to appropriate dashboard
      setShowLoading(true);
      if (profile.profileType?.toLowerCase() === "client") {
        router.push(`/${BASE_URL_CLIENT}/collab-rooms`);
      } else {
        router.push(`/${BASE_URL}/collab-room`);
      }
      // Don't reset loading - page will navigate away
    } else {
      // User is not logged in, show login modal (no loading needed)
      setShowModal(true);
    }
  };

  return (
    <div className="how-it-works">
      <div className="top-background" style={{ backgroundImage: `url(${howitworksbg})` }}>
        <div className="top-content">
          <h1 className="heading">How it Works</h1>
          <p>
            Join the creative revolution. Discover, connect, and create with the
            world’s best talent.
          </p>
        </div>
      </div>
      <MaxWidthWrapper withPadding={false}>
        <div className="welcome-section">
          <h1 className="subHeading">Welcome to Kaboom Collab</h1>
          <p>
            Whether you’re here to share your talent as a visionary or to find
            collaborators for your next project, we’ve made the process easy,
            collaborative, and rewarding.
          </p>
        </div>

        <Row className="keyPointSect" gutter={[16, 16]}>
          <h1 className="keyHeadings">How It Works</h1>
          {steps.map((step, index) => (
            <Col xs={24} sm={12} md={20} lg={11} key={index}>
              <Card title={index + 1 + ". " + step.title} className="keyPoints">
                <ol>
                  {step.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ol>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="down-content">
          <h2 className="lastsectionheadinghowitworks">Ready to Get Started</h2>
          <ActionButton className="howitworksbtn" onClick={handleJoinClick} loading={showLoading}>Join Kaboom Collab</ActionButton>
          <LoginModal visible={showModal} onClose={() => setShowModal(false)} />
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default CreativeCommunity;