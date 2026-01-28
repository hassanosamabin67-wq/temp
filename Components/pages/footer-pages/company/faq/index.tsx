import React from "react";
import "./style.css";

function Faq() {
  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions (FAQ)</h1>
        <p>Get answers to your questions about Kaboom Collab</p>
      </div>

      <div className="faq-content">
        {/* General Questions */}
        <section>
          <h2>General Questions</h2>
          <details>
            <summary>What is Kaboom Collab?</summary>
            <p>
              Kaboom Collab is a creative hub that connects visionaries and
              clients within music, arts, and entertainment. Our platform offers
              unique spaces and tools to bring creative projects to life.
            </p>
          </details>
          <details>
            <summary>How do I join Kaboom Collab?</summary>
            <p>
              Visionaries can submit a request to join. Upon approval, you can
              create a profile, showcase your work, and connect with clients and
              collaborators.
            </p>
          </details>
        </section>

        {/* Visionaries Section */}
        <section>
          <h2>For Visionaries</h2>
          <details>
            <summary>How do I start collaborating?</summary>
            <p>
              Create a profile showcasing your skills and portfolio. Browse
              projects, connect with clients, and engage in short- or long-term
              collaborations.
            </p>
          </details>
          <details>
            <summary>Can I work on multiple projects at once?</summary>
            <p>
              Yes! Kaboom Collab supports flexibility, allowing you to manage
              multiple projects simultaneously with our organizational tools.
            </p>
          </details>
        </section>

        {/* Clients Section */}
        <section>
          <h2>For Clients</h2>
          <details>
            <summary>How do I post a project?</summary>
            <p>
              Choose a main category, outline your project’s scope, and define
              requirements and budget. You can also request a Collab Room for
              interactive sessions.
            </p>
          </details>
          <details>
            <summary>How can I find the right visionary?</summary>
            <p>
              Use Kaboom Collab’s search and filter options to browse
              categories, portfolios, and skillsets.
            </p>
          </details>
        </section>

        {/* Security and Process Section */}
        <section>
          <h2>Process and Security</h2>
          <details>
            <summary>How does Kaboom Collab handle payments?</summary>
            <p>
              We offer secure and transparent transactions with options for
              project-based or milestone-based payments.
            </p>
          </details>
          <details>
            <summary>How is my intellectual property protected?</summary>
            <p>
              Contracts and NDAs ensure professional and secure handling of all
              projects.
            </p>
          </details>
        </section>
      </div>
    </div>
  );
}

export default Faq;
