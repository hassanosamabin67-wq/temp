'use client'
import React from 'react'
import styles from './style.module.css'
import Link from 'next/link'

const HelpSupport = () => {
    return (
        <div className={styles.main}>
            <div className={styles.contentDiv}>
                <div className={styles.header}>
                    <h1 className={styles.heading}>■ THE KABOOM DAILY</h1>
                    <p className={styles.pageText}>Help • Support • Discovery</p>
                </div>

                {/* K.A.I. Assistant Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ Need Help? Meet K.A.I.</h2>
                    <p className={styles.sectionText}>
                        Your built-in Kaboom AI Assistant is here 24/7. Ask questions, get instant answers,
                        or let K.A.I. guide you through tutorials, billing, and collaboration tips.
                        If K.A.I. can't solve it — we'll step in within 24 hours.
                    </p>
                </div>

                {/* Tutorials Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ STEP-BY-STEP: MASTER KABOOM</h2>
                    <p className={styles.sectionText}>Learn how to:</p>
                    <ul className={styles.bulletList}>
                        <li>Create and host Collab Rooms</li>
                        <li>Go live or hybrid with instant payouts</li>
                        <li>Collaborate across Soundscape, Art Exhibit, Think Tank & Collab Fitness</li>
                        <li>Manage replays and tickets</li>
                        <li>Use K.A.I. to find instant answers</li>
                    </ul>
                    <Link href="https://www.youtube.com/@kaboomcollab4893" className={styles.linkButton}>
                        Browse All Tutorials
                    </Link>
                </div>

                {/* Collaboration Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ COLLABORATION SOLVES MOST PROBLEMS</h2>
                    <p className={styles.sectionText}>
                        Start by messaging your collaborator directly inside your Room or Project Chat.
                        If an issue can't be resolved through direct communication, K.A.I. or our support team will help.
                        Most issues are resolved within 24 hours.
                    </p>
                </div>

                {/* Prohibited Conduct Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ PROHIBITED CONDUCT</h2>
                    <p className={styles.sectionText}>
                        Kaboom Collab is a curated, professional creative space. The following are not tolerated:
                    </p>
                    <ul className={styles.bulletList}>
                        <li>Harassment or discrimination</li>
                        <li>Unauthorized recording or redistribution of paid content</li>
                        <li>Off-platform payments or solicitation</li>
                        <li>Sharing explicit or violent material</li>
                    </ul>
                    <p className={styles.sectionText}>
                        Violations may lead to suspension or account removal.
                    </p>
                </div>

                {/* Payments & Billing Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ PAYMENTS & BILLING</h2>
                    <p className={styles.sectionText}>
                        All transactions are powered by Stripe. Visionaries can choose:
                    </p>
                    <ul className={styles.bulletList}>
                        <li>Instant Payouts via Collab Card (fee applies)</li>
                        <li>Standard Bank Transfers (2–3 business days)</li>
                    </ul>
                    <p className={styles.sectionText}>
                        Refunds are available only until a session status changes to In Progress.
                    </p>
                </div>

                {/* Common Topics Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ COMMON TOPICS</h2>
                    <p className={styles.sectionText}>
                        Click a topic and K.A.I. will instantly guide you through it:
                    </p>
                    <div className={styles.topicsGrid}>
                        {[
                            'Account Access',
                            'Collab Room Setup',
                            'Audio & Video Troubleshooting',
                            'Payments & Refunds',
                            'Report Misconduct',
                            'Billing'
                        ].map((topic) => (
                            <button
                                key={topic}
                                className={styles.topicButton}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Report Misconduct Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ REPORT MISCONDUCT</h2>
                    <p className={styles.sectionText}>If you experience or witness misconduct:</p>
                    <ul className={styles.bulletList}>
                        <li>Tell K.A.I.: "Report a misconduct issue."</li>
                        <li>Or email: report@kaboomcollab.com</li>
                    </ul>
                    <p className={styles.sectionText}>Reports go directly to our review team.</p>
                </div>

                {/* Discover More Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ DISCOVER MORE</h2>
                    <div className={styles.discoverGrid}>
                        <div className={styles.discoverItem}>
                            <h3>■ Collab Rooms</h3>
                            <p>Join Soundscape, Art Exhibit, Think Tank, and Collab Fitness.</p>
                            <Link href={'/think-tank'} className={styles.linkButton}>
                                Explore Collab Rooms
                            </Link>
                        </div>
                        <div className={styles.discoverItem}>
                            <h3>■ Services Marketplace</h3>
                            <p>Find or hire Visionaries offering music, visual arts, strategy, and more.</p>
                            <Link href={'/services'} className={styles.linkButton}>
                                Browse Services
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Breaking News Section */}
                <div className={styles.section}>
                    <span className={styles.breakingNews}>■ BREAKING NEWS</span>
                    <p className={styles.sectionText}>
                        Stay tuned for product updates, bug fixes, and Visionary highlights.
                        New articles are added weekly inside The Kaboom Daily.
                    </p>
                </div>

                {/* Contact Us Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>■ CONTACT US</h2>
                    <div className={styles.contactGrid}>
                        <div className={styles.contactItem}>
                            <div className={styles.contactLabel}>General Support</div>
                            <span>support@kaboomcollab.com</span>
                        </div>
                        <div className={styles.contactItem}>
                            <div className={styles.contactLabel}>Billing</div>
                            <span>billing@kaboomcollab.com</span>
                        </div>
                        <div className={styles.contactItem}>
                            <div className={styles.contactLabel}>Partnerships</div>
                            <span>partnership@kaboomcollab.com</span>
                        </div>
                    </div>
                    <p className={styles.sectionText}>We reply within 24 hours.</p>
                </div>
            </div>
        </div>
    )
}

export default HelpSupport