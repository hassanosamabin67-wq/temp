import React from 'react'
import "./style.css"
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
interface CustomGetStartedProps {
  heading: string;
  description: string;
  ctabtn: string
}
function CustomGetStarted({ heading, description, ctabtn }: CustomGetStartedProps) {
  return (
    <MaxWidthWrapper>
      <section className="get-started-section">
        <div className="get-started-content">
          <h1 className="get-started-heading">
            Explore, Learn, and Grow
          </h1>
          <p className="get-started-description">
            Dive into Industry Insights today and stay connected to the heart of creativity.
          </p>
          <div className="get-started-actions">
            {/* <button className="cta-button">
Read More              </button> */}
          </div>
        </div>
      </section>
    </MaxWidthWrapper>
  )
}

export default CustomGetStarted