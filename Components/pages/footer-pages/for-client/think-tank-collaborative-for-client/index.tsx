'use client';
import React from 'react';
import './style.css';
import collaborative from '@/public/assets/img/calloborative.png';
import jhunjhuna from '@/public/assets/img/jhunjhuna.png';
import cross from '@/public/assets/img/questionmark.png';
import questionmark from '@/public/assets/img/questionmark.png';
import flower from '@/public/assets/img/flower.png';
import calendar from '@/public/assets/img/calendar.png';
import Image from 'next/image';
import { UIButton } from '@/Components/custom';

function ThinkThankCollaborativeClient() {
  return (
    <>
      {/* Hero Section */}
      <div className='think-tank-hero'>
        <div className='think-tank-overlay'>
          <h1 className='think-tank-title'>Think Tank Collaboratives</h1>
          <p className='think-tank-subtitle'>
            Brainstorm, Innovate, and Build Projects Together
          </p>
          <div className='think-tank-cta'>
            <UIButton>Request Access</UIButton>
          </div>
        </div>
      </div>

      {/* Why Use Think Tank Section */}
      {/* <div className='why-use-think-tankClient'>
        <div className='why-use-content'>
          <h2 className='section-title'>Why Use Think Tank Collaboratives?</h2>
          <p className='section-description'>
            The Think Tank Collaborative is Kaboom Collab’s space for deep, collaborative brainstorming and project planning. Designed for clients with complex or large-scale creative projects, this room allows you to engage with visionaries across fields, refine ideas, and build a solid foundation together.
          </p>
        </div>
        <div className='why-use-image'>
          <Image src={cross} height={300} width={400} alt='cross' />
        </div>
      </div> */}

      {/* How to Get Started Section */}
      <div className='getting-started'>
        <h2 className='section-title'>How to Get Started</h2>
        <div className='card-container-thinktank2'>
          <div className='card-thinktank2'>
            <Image src={collaborative} alt='Collaborative Brainstorming' width={80} height={80} />
            <div className='card-content'>
              <h3>Dynamic Brainstorming</h3>
              <p>Bring together creative minds to generate new ideas, solve challenges, and discover unique solutions for your project.</p>
            </div>
          </div>

          <div className='card-thinktank2'>
            <Image src={jhunjhuna} alt='Project-Building Support' width={80} height={80} />
            <div className='card-content'>
              <h3>Global Collaboration</h3>
              <p>Collaborate with talent from diverse backgrounds and specialties, bringing fresh perspectives to your project.</p>
            </div>
          </div>

          <div className='card-thinktank2'>
            <Image src={cross} alt='Global Connections' width={80} height={80} />
            <div className='card-content'>
              <h3>Structured Project Planning</h3>
              <p>Work with visionaries to break down your project into actionable steps, ensuring a smooth creative process from concept to completion.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-Action Banner */}
      <div className='cta-banner'>
        <h2>Explore Innovative Possibilities</h2>
        <p className='cta-text'>
          Build something extraordinary in the Think Tank Collaborative. Request access today to turn your ideas into action.
        </p>
        <button className='cta-button'>Request Access</button>
      </div>
    </>
  );
}

export default ThinkThankCollaborativeClient;