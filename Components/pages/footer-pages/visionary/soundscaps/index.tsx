import React from "react";
import privateImg from "@/public/assets/img/private.png";
import musicImg from "@/public/assets/img/sound.png";
import micImg from "@/public/assets/img/mic.png";
import session from "@/public/assets/img/session.png";
import track from "@/public/assets/img/tracks.png";
import network from "@/public/assets/img/network.png";
import Image from "next/image";
import Card from "./card";
import { UIButton } from "@/Components/custom";
import "./style.css"; // Import the CSS file

function SoundScapesComponent() {
  return (
    <div className="soundscapes-page">
      {/* Hero Section */}
      <div className="soundscapes-hero">
        <h1 className="soundscapes-title">Sound Scapes (for visionaries)</h1>
        <p className="soundscapes-subtitle">
          Collaborate, Share, and Bring Your Music to Life
        </p>
        <p className="soundscapes-description">
          Soundscapes is Kaboom Collab’s immersive space for musicians and entertainers to create, connect, and inspire. Designed for real-time collaboration, Soundscapes gives you everything you need to make impactful music and share your passion with others.
        </p>
      </div>

      {/* Why Use Soundscapes Section */}
      <div className="why-soundscapes">
        <h2 className="section-title">Why Use Soundscapes?</h2>
        <div className="cards-container">
          <Card
            imageSrc={privateImg}
            title="Private Creative Sessions"
            description="Host private rooms for brainstorming, creating, and refining your work. Invite collaborators for jam sessions, idea exchanges, or song critiques in a focused, distraction-free space."
          />
          <Card
            imageSrc={musicImg}
            title="Collaborative Workshops"
            description="Join interactive workshops where you can collaborate, learn new skills, and gain insights from industry experts."
          />
          <Card
            imageSrc={micImg}
            title="Community Jam Sessions"
            description="Engage with a community of like-minded creatives. Share ideas, experiment with sounds, and push your creative boundaries."
          />
        </div>
      </div>

      {/* How to Get Started Section */}
      <div className="get-started">
        <h2 className="section-title">How to Get Started with Soundscapes</h2>
        <div className="cards-container columns">
          <Card
          col={true}
            imageSrc={session}
            title="Create a Session"
            description="Open a Soundscape room and invite collaborators or clients. Set the tone for your session—whether it’s a creative brainstorming, a jam, or a listening party."
          />
          <Card
          col={true}
            imageSrc={track}
            title="Share Your Tracks"
            description="Upload or play your music directly in the session. Get live feedback, refine ideas, and experiment with new sounds as you go."
          />
          <Card
          col={true}
            imageSrc={network}
            title="Build Your Network"
            description="Use Soundscapes to meet other creators, share work, and form lasting connections that go beyond a single session."
          />
        </div>
      </div>

      {/* Banner Section */}
      <div className="banner">
        <p className="banner-text">
          Join Soundscapes and turn your creative visions into musical masterpieces.
        </p>
        <div className="ui-button">
          <button className="soundscapesjoinbtn">Join Soundscapes</button>
        </div>
      </div>
    </div>
  );
}

export default SoundScapesComponent;