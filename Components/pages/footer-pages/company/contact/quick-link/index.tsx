import React from "react";
import "./style.css";

function QuickLinks() {
  return (
    <>
      <div>
        <div className="quick">
          <div className="quick-title">
            <h2>Quick Links</h2>
          </div>
          <div className="using-quick-link">
            <ol>
              <li>
                <h3>FAQ Page</h3>
                <div className="steps">
                  <p>Get answers to commonly asked questions. </p>
                </div>
              </li>
              <li>
                <h3>Tutorial & Guides</h3>
                <div className="steps">
                  <p>Explore resources for using Kaboom Collab. </p>
                </div>
              </li>
              <li>
                <h3>Community Challenge</h3>
                <div className="steps">
                  <p>Learn more about our monthly challenges. </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

export default QuickLinks;
