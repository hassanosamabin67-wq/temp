import Image from 'next/image';
import React from 'react';
import Link from 'next/link'; // Importing the Link component for navigation
import './style.css';
import { FacebookOutlined, InstagramOutlined, XOutlined, YoutubeOutlined } from '@ant-design/icons';
import moment from 'moment';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';

function Footer() {
  return (
    <>
      <div className="ca_12">
        <MaxWidthWrapper className='max-width-wrapper'>
          <div className="ca_1aa">
            <div className="Footer-logo">
              <p className="logoFootText">Kaboom Collab</p>
            </div>
            <div className="ca_1b">
              Join Kaboom Collab to elevate your artistry, connect with global creatives, and innovate through extraordinary collaborations.
            </div>
          </div>
          <div className="ca_2">
            <div className="about">
              <div className="head">
                <h2>Services</h2>
              </div>
              <div className="list1">
                <Link className='footerlist' href="/visionary/how-it-works">How it works</Link>
              </div>
              <div className="lists">
                <Link className='footerlist' href="/visionary/join-as-visionary">Join as a visionary</Link>
              </div>
              {/* <div className="lists">
              <Link className='footerlist' href="/visionary/visionary-soundscapes">Visionary Soundscapes</Link>
            </div>
            <div className="lists">
              <Link className='footerlist' href="/visionary/arts-exhibits">Creators Art exhibits</Link>
            </div>
            <div className="lists">
              <Link className='footerlist' href="/visionary/think-tank">Think Tank Collaborative</Link>
            </div> */}
            </div>
            {/* <div className="about">
            <div className="head">
              <h2>For Clients</h2>
            </div>
            <div className="list1">
              <Link className='footerlist' href="/for-client/find-visionary">Find a Visionary</Link>
            </div>
            <div className="lists">
              <Link className='footerlist' href="/for-client/post-project">How to post a project</Link>
            </div>
            <div className="lists">
              <Link className='footerlist' href="/for-client/client-soundscapes">Soundscapes for clients</Link>
            </div>
            <div className="lists">
              <Link className='footerlist' href="/for-client/art-exhibits">Art exhibits</Link>
            </div>
            <div className="lists">
              <Link className='footerlist' href="/for-client/think-tank">Think Tank Collaborative For Clients</Link>
            </div>
          </div> */}
            <div className="about">
              <div className="head">
                <h2>Resources</h2>
              </div>
              {/* <div className="list1">
              <Link className='footerlist' href="/resource/industry-insights">Industry Insights</Link>
            </div> */}
              <div className="lists">
                <Link className='footerlist' href="/resource/tutorial-guide">Tutorials and Guides</Link>
              </div>
              <div className="lists">
                <Link className='footerlist' href="/resource/mentorship-program">Mentorship Program</Link>
              </div>
              <div className="lists">
                <Link className='footerlist' href="/community-challenges">Community Challenge</Link>
              </div>
            </div>
            <div className="about">
              <div className="head">
                <h2>Company</h2>
              </div>
              <div className="list1">
                <Link className='footerlist' href="/">Home</Link>
              </div>
              <div className="lists">
                <Link className='footerlist' href="/company/contact">Contact</Link>
              </div>
              <div className="lists">
                <Link className='footerlist' href="/company/about">About Us</Link>
              </div>
              <div className="lists">
                <Link className='footerlist' href="/company/privacy-policy">Privacy Policy</Link>
              </div>
              <div className="lists">
                <Link className='footerlist' href="/company/terms-of-service">Terms of services</Link>
              </div>
              {/* <div className="lists">
              <Link className='footerlist' href="/company/faq">FAQ</Link>
            </div> */}
              <div className="ca_1c">
                <div className="outline">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <FacebookOutlined />
                  </a>
                </div>
                <div className="outline">
                  <a href="https://x.com/kaboomco_" target="_blank" rel="noopener noreferrer">
                    <XOutlined />
                  </a>
                </div>
                <div className="outline">
                  <a href="https://www.instagram.com/kaboom_collab" target="_blank" rel="noopener noreferrer">
                    <InstagramOutlined />
                  </a>
                </div>
                <div className="outline">
                  <a href="https://www.youtube.com/@kaboomcollab4893" target="_blank" rel="noopener noreferrer">
                    <YoutubeOutlined />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </div>
      <div className="footer">© {moment().format("YYYY")} All Rights Reserved.</div>
    </>
  );
}

export default Footer;
