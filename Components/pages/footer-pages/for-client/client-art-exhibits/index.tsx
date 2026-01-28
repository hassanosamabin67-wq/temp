import React from 'react';
import Image from 'next/image';
import mensPic from "@/public/assets/img/men.jpg";
import presentation from "@/public/assets/img/presentation.png";
import feedBack from "@/public/assets/img/feedback.png";
import compass from "@/public/assets/img/compass.png";
import "./style.css";

function ArtsExhibit() {
  return (
    <>
      <div className='artExhibit'>
        <div className='artExhibitTitle'>
          <p>Art Exhibit</p>
        </div>
        <div className='artExhibitText'>
          <p>Showcase and Refine Visual Projects with Creative Professionals</p>
          <div className='artExhibitButton'>
            <button>Explore the Gallery</button>
          </div>
        </div>
      </div>
      <div className='artExhibitAbout'>
        <div className='artExhibitAboutText'>
          <h1>About Art Exhibit</h1>
          <p>Art Exhibit is Kaboom Collab’s exclusive gallery space for visual projects, designed to let clients and artists collaborate in a shared, visual workspace.</p>
          <p>Display your project ideas, explore new concepts, and gain valuable feedback in a gallery-like environment that brings your vision to life.</p>
        </div>
        <div className='artExhibitAboutImage'>
          <Image src={mensPic} alt="men" width={500} height={400} />
        </div>
      </div>
      <div className='artExhibitEnhance'>
        <h2>How Art Exhibit Enhances Your Project</h2>
        <div className='artExhibitEnhanceCard'>
          <div className='artExhibitEnhanceCardItem'>
            <Image src={presentation} alt="presentation" width={100} height={100} />
            <h3>Showcase Your Concepts</h3>
            <p>Display artwork, illustrations, designs, or brand visuals in a professional gallery space for review and refinement.</p>
          </div>
          <div className='artExhibitEnhanceCardItem'>
            <Image src={feedBack} alt="feedback" width={100} height={100} />
            <h3>Receive Visual Feedback</h3>
            <p>Get input from artists and designers on color, composition, and overall design, helping you create a polished final product.</p>
          </div>
          <div className='artExhibitEnhanceCardItem'>
            <Image src={compass} alt="compass" width={100} height={100} />
            <h3>Align Creative Vision</h3>
            <p>Refine your project’s direction and ensure it matches your goals before moving forward.</p>
          </div>
        </div>
      </div>
      <div className='artExhibitIdeal'>
        <h1>Art Exhibit Is Ideal For:</h1>
        <ul>
          <li>• Branding and logo design</li>
          <li>• Illustrations, graphic design, and visual art</li>
          <li>• Feedback and refinement on visual projects</li>
        </ul>
      </div>
      <div className='artExhibitGetStarted'>
        <h1>Bring Your Ideas to Life</h1>
        <p>Connect with visionary artists and refine your creative vision with Art Exhibit.</p>
        <div className='artExhibitButton'>
          <button>Get Started</button>
        </div>
      </div>
    </>
  );
}

export default ArtsExhibit;