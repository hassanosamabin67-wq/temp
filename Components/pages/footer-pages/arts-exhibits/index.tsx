import React from "react";
import privateImg from "@/public/assets/img/private.png";
import musicImg from "@/public/assets/img/sound.png";
import micImg from "@/public/assets/img/mic.png";
import session from "@/public/assets/img/session.png";
import track from "@/public/assets/img/tracks.png";
import network from "@/public/assets/img/network.png";
import frame from "@/public/assets/img/frame.png";
import artshak from "@/public/assets/img/artshak.png";
import msg from "@/public/assets/img/artmsg.png";

import { UIButton } from "@/Components/custom";
import "../for-client/client-art-exhibits/style.css"; // Import the CSS file
import Card from "../visionary/soundscaps/card";

function ArtsExhibitComponent() {
  return (
    <div className="soundscapes-page">
      {/* Hero Section */}
      <div className="soundscapes-hero">
        <h1 className="soundscapes-title">Art Exhibit (for Creators)</h1>
        <p className="soundscapes-subtitle">
        Showcase Your Art, Connect with Buyers, and Find Inspiration
        </p>
        <p className="soundscapes-description">
        The Art Exhibit is Kaboom Collab’s dedicated space for visual artists to share their work with the world. It’s more than a gallery—it’s a creative space where you can engage with clients, discover new opportunities, and connect with other artists        </p>
      </div>

      {/* Why Use Soundscapes Section */}
      <div className="why-soundscapes">
        <h2 className="section-title">Why Use Art Exhibit?</h2>
        <div className="cards-container">
          <Card
            imageSrc={frame}
            title="Display Your Work Professionally"
            description="Create a portfolio that showcases your art in a virtual gallery environment. Each piece you share is an opportunity to connect with clients and collaborators who value creativity and originality."
          />
          <Card
            imageSrc={artshak}
            title="Engage with Potential Buyers"
            description="The Art Exhibit allows clients to view, inquire, and purchase your artwork directly on Kaboom Collab. Turn your passion into profit by sharing your art with a receptive audience."
          />
          <Card
            imageSrc={msg}
            title="Find Inspiration"
            description="Explore works from other talented artists in the Kaboom Collab community. The Art Exhibit is a space where creativity thrives, giving you endless inspiration to push your own boundaries."
          />
        </div>
      </div>

      {/* How to Get Started Section */}
      <div className="get-started">
        <h2 className="section-title">How to Get Started with Art Exhibit</h2>
        <div className="cards-container columns">
          <Card
          col={true}
            imageSrc={session}
            title="Upload Your Work"
            description="Create a portfolio of your best pieces. Use high-quality images and descriptions that capture the essence of your art."
          />
          <Card
          col={true}
            imageSrc={track}
            title="Set Your Prices"
            description="Decide whether pieces are for sale, for hire, or simply for show. The Art Exhibit lets you define the terms, making it easy for clients to reach out with offers or inquiries."
          />
          <Card
          col={true}
            imageSrc={network}
            title="Connect and Sell"
            description="Share your art, engage with clients, and participate in community events like virtual gallery shows. Kaboom Collab makes it easy for you to connect with buyers who appreciate your work."
          />
        </div>
      </div>

      {/* Banner Section */}
      <div className="banner">
        <p className="banner-text">
        Start building your Art Exhibit and let the world see what you can create!
        </p>
        <div className="ui-button">
          <button className="soundscapesjoinbtn">Start Now</button>
        </div>
      </div>
    </div>
  );
}

export default ArtsExhibitComponent;