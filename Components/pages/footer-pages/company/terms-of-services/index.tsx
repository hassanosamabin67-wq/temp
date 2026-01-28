import React from "react";
import "./style.css";

function TermsOfServiceComponent() {
  return (
    <div className="terms-container">
      {/* Hero Section */}
      <section className="terms-hero">
        <h1>Terms of Service</h1>
        <p>Understand the Guidelines of Kaboom Collab</p>
      </section>

      {/* Terms Sections */}
      <div className="terms-content">
        {/* Section 1 */}
        <section>
          <h2>1. Introduction</h2>
          <p>
            <strong>Scope of Services:</strong> Kaboom Collab is a curated creative hub that
            connects visionaries (creators) and clients within the music, arts,
            and entertainment industries.
          </p>
          <p>
            <strong>Acceptance of Terms:</strong> By using Kaboom Collab, users agree to these
            Terms of Service. Kaboom Collab reserves the right to modify terms.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2>2. Account Registration and Use</h2>
          <p>
            <strong>Eligibility and Account Approval:</strong> Kaboom Collab is a curated
            platform. Visionaries must request to join, and all profiles are reviewed.
          </p>
          <p>
            <strong>User Conduct:</strong> Users must act professionally. Any misconduct
            may result in account suspension or termination.
          </p>
        </section>

        {/* Section 3 */}
        <section>
          <h2>3. Project and Service Agreements</h2>
          <p>
            <strong>Project Posting and Application:</strong> Clients must provide clear
            project descriptions. Visionaries must commit to quality services.
          </p>
          <p>
            <strong>Service Contracts:</strong> Standard contracts include deliverables,
            intellectual property rights, and non-disclosure clauses.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2>4. Payments and Fees</h2>
          <p>
            <strong>Payment Structure:</strong> Payments can be one-time or milestone-based.
          </p>
          <p>
            <strong>Fees and Commissions:</strong> A transparent tiered commission structure applies.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2>5. Professional Standards and Dispute Resolution</h2>
          <p>
            <strong>Professional Conduct:</strong> Visionaries must maintain professionalism.
          </p>
          <p>
            <strong>No-Tolerance Policy:</strong> Violations may lead to account suspension.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2>6. Intellectual Property and Confidentiality</h2>
          <p>
            <strong>Ownership and Transfer:</strong> Deliverables are transferred to the client
            upon project completion and payment.
          </p>
          <p>
            <strong>Non-Disclosure:</strong> All project information must remain confidential.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2>7. Termination and Account Suspension</h2>
          <p>
            <strong>Grounds for Termination:</strong> Kaboom Collab reserves the right to suspend
            accounts for violations.
          </p>
          <p>
            <strong>User-Initiated Termination:</strong> Users may close their accounts after
            resolving active contracts.
          </p>
        </section>
      </div>
    </div>
  );
}

export default TermsOfServiceComponent;
