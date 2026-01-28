
import React from 'react';
import Image from 'next/image';
import mensPic from "@/public/assets/img/men.jpg";
import presentation from "@/public/assets/img/presentation.png";
import feedBack from "@/public/assets/img/feedback.png";
import compass from "@/public/assets/img/compass.png";
import "./style.css";

export default function FindVisionary() {
  return (
    <>
      <div className='visionExhibit'>
        <div className='visionExhibitTitle'>
          <p>Find a Visionary
          </p>
        </div>
        <div className='visionExhibitText'>
          <p>Discover Exceptional Talent, Bring Your Vision to Life

At Kaboom Collab, we make it easy to find and connect with top creative talent in music, arts, and entertainment. Our curated community of visionaries offers a wide range of skills and expertise, ensuring that you can find the perfect fit for any project.</p>
          {/* <div className='visionExhibitButton'>
            <button>Explore the Gallery</button>
          </div> */}
        </div>
      </div>
      <div className='visionExhibitAbout'>
        <div className='visionExhibitAboutText'>
          <h1>Why Choose Kaboom Collab?
          </h1>
          <p>

          Curated Network: Access a select group of talented and experienced artists.
Streamlined Collaboration: Our platform simplifies the process of finding, communicating with, and working alongside your chosen visionary.
Creative Alignment: Ensure your project's vision is shared and effectively executed.
          </p>
                  </div>
        <div className='visionExhibitAboutImage'>
          <Image src={mensPic} alt="men" width={500} height={400} />
        </div>
      </div>
      <div className='visionExhibitEnhance'>
        <h2>How Kaboom Collab Helps</h2>
        <div className='visionExhibitEnhanceCard'>
          <div className='visionExhibitEnhanceCardItem'>
            <Image src={presentation} alt="presentation" width={100} height={100} />
            <h3>Discover Visionaries</h3>
            <p>Explore a diverse range of artistic styles and specialties.</p>
          </div>
          <div className='visionExhibitEnhanceCardItem'>
            <Image src={feedBack} alt="feedback" width={100} height={100} />
            <h3>Achieve Your Vision</h3>
            <p>Partner with a visionary who understands your goals and can deliver exceptional results.</p>
          </div>
          <div className='visionExhibitEnhanceCardItem'>
            <Image src={compass} alt="compass" width={100} height={100} />
            <h3>Seamless Collaboration</h3>
            <p>Our platform facilitates clear communication and efficient project management.</p>
          </div>
        </div>
      </div>
      <div className='visionExhibitIdeal'>
        <h1>What Makes Kaboom Collab Different</h1>
        <ul>
          <li>We've hand-picked a network of amazing artists.</li>
          <li>Our platform makes collaboration easy and efficient</li>
          <li>We're dedicated to helping you achieve your creative goals.</li>
        </ul>
      </div>
      <div className='visionExhibitGetStarted'>
        <h1>Bring Your Ideas to Life</h1>
        <p>Get started today and find your visionary!</p>
        <div className='visionExhibitButton'>
          <button>Get Started</button>
        </div>
      </div>
    </>
  );
}
