'use client'
import React from 'react';
import "./style.css";
import GuidePostProject from './guide';
import Benefits from './benefit/index'

function PostProject() {
  return (
    <>
    <div className='preject'>
        <div className='preject-title'>
          <p>How to Post a Project
          </p>
        </div>
        <div className='project-description'>
          <p>Connect with the Right Talent, Bring Your Ideas to Life Kaboom Collab makes it simple to post a project, connect with talented visionaries, and bring your vision to life.</p>
        </div>
      </div>
      <GuidePostProject />
      <Benefits />
      <div className='get-started'>
        <div><h1>Get Started Today</h1></div>
        <div><p>Ready to find the right visionary for your project? Start by choosing your main category and outline your project.</p></div>
        <div className='ui-button'><button>Post a Project Now</button></div>
      </div>
    </>
  )
}

export default PostProject