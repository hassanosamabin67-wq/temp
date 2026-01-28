import Image from "next/image";
import React from "react";
import indusryImage from "@/public/assets/img/industry.avif";
import dogyImage from "@/public/assets/img/dog-4988985_640.jpg";
import CustomGetStarted from "@/Components/custom/custom-get-started";
import "./style.css"; // Import CSS module

function IndustryInsightComponent() {
  return (
    <div className="container">
      <div className="heroSection">
        <Image
          src={indusryImage}
          height={500}
          width={1200}
          alt="industry"
          className="heroImage"
        />
      </div>

      <div className="introSection">
        <p className="introText">
          Welcome to Industry Insights, Kaboom Collab’s dedicated blog for
          creatives and clients in music, arts, and entertainment. Here, we
          share the latest trends, expert advice, and success stories to keep you
          inspired and informed. Whether you’re a visionary looking to hone your
          craft or a client seeking to understand the creative industry, our
          blog is your go-to source for insights that make an impact.
        </p>
      </div>

      <div className="contentSection">
        <h1 className="sectionTitle">What You’ll Find in Industry Insights</h1>
        <div className="featureGrid">
          <div className="featureCard">
            <div className="featureImage">
              <Image src={dogyImage} width={150} height={150} alt="dog" className="cardImage" />
            </div>
            <div className="featureContent">
              <h2 className="featureTitle">Trends and Innovations</h2>
              <p className="featureDescription">
                Explore the latest in music, arts, and entertainment—from new
                technologies to emerging trends shaping the future of creativity.
              </p>
            </div>
          </div>

          <div className="featureCard">
            <div className="featureImage">
              <Image src={dogyImage} width={150} height={150} alt="dog" className="cardImage" />
            </div>
            <div className="featureContent">
              <h2 className="featureTitle">Creative Collaboration Tips</h2>
              <p className="featureDescription">
                Learn best practices for working in sessions, brainstorming in
                think tanks, or showcasing work in our exhibits.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="ctaSection">
        <CustomGetStarted
          heading="Explore, Learn, and Grow"
          description="Dive into Industry Insights today and stay connected to the heart of creativity."
          ctabtn="Read More"
        />
      </div>
    </div>
  );
}

export default IndustryInsightComponent;