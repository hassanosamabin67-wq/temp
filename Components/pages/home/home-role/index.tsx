import React from 'react';
import "./style.css";
import discuss from '@/public/assets/img/expowerment.jpg';
import Image from 'next/image';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';

function KaboomRole() {
  return (
    <MaxWidthWrapper>
    <div className='main_class'>
        <div className='ca_1'>
            <Image src={discuss.src} alt='Discusson Image' width={450} height={350} />
        </div>
        <div className='cb_1'>
            <div className='cb_1a'>
                <h2>EMPOWER INNOVATION THROUGH COLLABORATIVE THINK TANKS</h2>
            </div>
            <div className='cb_1b'>
                <p>
                    At Kaboom Collab, we believe in the power of collective intelligence. Our Think Tank sessions are not just meetings; they are incubators for innovation, where creative minds unite to spark breakthrough ideas. Join forces with like-minded visionaries and let’s transform inspiration into red-world solutions.
                </p>
                </div>
        </div>
    </div>
    </MaxWidthWrapper>
  )
}

export default KaboomRole