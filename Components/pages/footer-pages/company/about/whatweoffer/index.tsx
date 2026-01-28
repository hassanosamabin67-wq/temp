import React from 'react'
import './style.css'
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper'

function WhatWeOffer() {
    return (
        <MaxWidthWrapper>
            <div className='benefit'>
                <div className='benefit-title'>
                    <h2>What We Offer</h2>
                </div>
                <div className='using-whatweoffer'>
                    <ol>
                        <li>
                            <h3>Soundscapes</h3>
                            <div className='steps'>
                                <p>Private rooms for musicians and entertainers to host music sessions and brainstorming events.</p>
                            </div>
                        </li>
                        <li>
                            <h3>Art Exhibits</h3>
                            <div className='steps'>
                                <p>A space for artists to showcase work, connect with audiences, and gain inspiration</p>
                            </div>
                        </li>
                        <li>
                            <h3>Think Tank Collaboratives</h3>
                            <div className='steps'>
                                <p>Global brainstorming spaces for creatives to collaborate and bring ideas to life.</p>
                            </div>
                        </li>
                    </ol>
                </div>
            </div>
        </MaxWidthWrapper>
    )
}

export default WhatWeOffer