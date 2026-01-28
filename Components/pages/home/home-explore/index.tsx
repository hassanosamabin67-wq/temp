import React from 'react';
import "./style.css";
import men from '@/public/assets/img/singing-man.png'
import Image from 'next/image'
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import AnimatedSection from '@/Components/UIComponents/AnimatedSection';
import { ArrowRight } from 'lucide-react';

function Explore() {
    return (
        <>
            {/* <div className='ca_11 '>
            <div className='ca_11a'>
            <h2>DIVE INTO A REALM WHERE CREATIVITY KNOWS NU BOUNDS,
             AND EVERY VOICE IS HEARD. 
             LET'S SHAPE THE FUTURE, TOGETHER.</h2>
            </div>
            <div className='ca_11b'>
                <button>Explore Think Tanks</button>
            </div>
        </div> */}
            {/* <div className='cb_11'>
                    <div className='cb_11a'>
                        <div className='cb_11a1'>Soundscapes</div>
                        <div className='cb_11a2'><h2>IMMERSE THE <br /> BEAT OF CREATIVITY</h2></div>
                        <div className='cb_11a3'>Connect, engage, and feel the unique vibe of our creative encounters.</div>
                    </div>
                    <div className='cb_11b'>
                        <Image src={men} alt="Men" width={500} height={500} />
                    </div>
                </div> */}
            <section className="cta">
                <div className="cta-pattern">
                    <div className="cta-pattern-bg"></div>
                </div>

                <div className="cta-blobs">
                    <div className="cta-blob-1"></div>
                    <div className="cta-blob-2"></div>
                </div>

                <AnimatedSection className="cta-content">
                    <span className="cta-badge">Soundscapes</span>
                    <h2 className="cta-title">
                        Immerse The Beat of Creativity
                    </h2>
                    <p className="cta-description">
                        Connect, engage, and feel the unique vibe of creative collaboration
                    </p>
                    {/* <button className="cta-button">
                        <span className="cta-button-content">
                            Experience Now
                            <ArrowRight className="cta-button-icon" />
                        </span>
                    </button> */}
                </AnimatedSection>
            </section>
        </>
    )
}

export default Explore