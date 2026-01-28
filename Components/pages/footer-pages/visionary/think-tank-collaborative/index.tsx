'use client';
import React from 'react';
import './style.css';
import collaborative from '@/public/assets/img/calloborative.png';
import jhunjhuna from '@/public/assets/img/jhunjhuna.png';
import cross from '@/public/assets/img/cross.png';
import questionmark from '@/public/assets/img/questionmark.png';
import flower from '@/public/assets/img/flower.png';
import calendar from '@/public/assets/img/calendar.png';
import Image from 'next/image';

function ThinkThankCollaborative() {
  return (
    <>
      {/* Hero Section */}
      <div className='think-tank-hero'>
        <div className='think-tank-overlay'>
          <h1 className='think-tank-title'>Think Tank Collaboratives</h1>
          <p className='think-tank-subtitle'>
            Brainstorm, Innovate, and Build Projects Together
          </p>
          <p className='think-tank-description'>
            Think Tank Collaboratives is Kaboom Collab’s unique space for collective brainstorming and project-building. It’s a place where visionaries in every field—music, art, entertainment, and beyond—can come together to share ideas, solve creative challenges, and bring new projects to life.
          </p>
        </div>
      </div>

      {/* Why Use Think Tank Section */}
      <div className='why-use-think-tank'>
        <h2 className='section-title'>Why Use Think Tank Collaboratives?</h2>
        <div className='card-container-thinktank'>
          <div className='card-thinktank'>
            <Image src={collaborative} alt='Collaborative Brainstorming' width={80} height={80} />
            <div className='card-content'>
              <h3>Collaborative Brainstorming</h3>
              <p>Meet with other creatives to share ideas, explore new concepts, and brainstorm in a supportive, interactive space.</p>
            </div>
          </div>

          <div className='card-thinktank'>
            <Image src={jhunjhuna} alt='Project-Building Support' width={80} height={80} />
            <div className='card-content'>
              <h3>Project-Building Support</h3>
              <p>Think Tank provides the structure and resources to turn ideas into reality.</p>
            </div>
          </div>

          <div className='card-thinktank'>
            <Image src={cross} alt='Global Connections' width={80} height={80} />
            <div className='card-content'>
              <h3>Global Connections</h3>
              <p>Connect with visionaries from all over the world in a diverse, creative space.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Get Started Section */}
      <div className='getting-started'>
        <h2 className='section-title'>How to Get Started</h2>
        <div className='card-container-thinktank'>
          <div className='card-thinktank'>
            <Image src={flower} alt='Join or Create a Think Tank Session' width={80} height={80} />
            <div className='card-content'>
              <h3>Join or Create a Think Tank Session</h3>
              <p>Meet with other creatives to share ideas and brainstorm collaboratively.</p>
            </div>
          </div>

          <div className='card-thinktank'>
            <Image src={questionmark} alt='Project-Building Support' width={80} height={80} />
            <div className='card-content'>
              <h3>Project-Building Support</h3>
              <p>Turn entertainment and art ideas into reality with Think Tank's support.</p>
            </div>
          </div>

          <div className='card-thinktank'>
            <Image src={calendar} alt='Global Connections' width={80} height={80} />
            <div className='card-content'>
              <h3>Global Connections</h3>
              <p>Work with diverse creatives from around the globe in collaborative projects.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-Action Banner */}
      <div className='cta-banner'>
        <p className='cta-text'>
          Make creative breakthroughs in Think Tank Collaboratives and bring your biggest ideas to life!
        </p>
        <button className='cta-button'>Get Started</button>
      </div>
    </>
  );
}

export default ThinkThankCollaborative;