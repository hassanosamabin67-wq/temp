import React from "react";
import styles from "./style.module.css";

const PrivacyPolicy = () => {
    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Kaboom Collab Privacy Policy</h1>
                <p className={styles.meta}><strong>Effective Date:</strong> August 16, 2025</p>
                <p className={styles.meta}><strong>Last Updated:</strong> August 16, 2025</p>
            </header>

            <nav className={styles.toc} aria-label="Table of contents">
                <h2 className={styles.sectionTitle}>Contents</h2>
                <ol>
                    <li><a href="#introduction">Introduction</a></li>
                    <li><a href="#types">1. Types of Information We Collect</a></li>
                    <li><a href="#collect">2. How We Collect Information</a></li>
                    <li><a href="#use">3. How We Use Information</a></li>
                    <li><a href="#sharing">4. Sharing and Disclosure of Information</a></li>
                    <li><a href="#cookies">5. Cookies and Tracking Technologies</a></li>
                    <li><a href="#retention">6. Data Retention and Security</a></li>
                    <li><a href="#rights">7. Your Rights and Choices</a></li>
                    <li><a href="#children">8. Children’s Privacy</a></li>
                    <li><a href="#thirdparty">9. Third‑Party Links and Services</a></li>
                    <li><a href="#changes">10. Changes to This Privacy Policy</a></li>
                    <li><a href="#contact">11. Contact Us</a></li>
                    <li><a href="#disclaimer">Disclaimer</a></li>
                </ol>
            </nav>

            <section id="introduction" className={styles.section}>
                <h2 className={styles.sectionTitle}>Introduction</h2>
                <p>
                    Kaboom Collab ("Kaboom," "we," "us," or "our") is a service-based platform that connects
                    creatives and clients in the music, arts and entertainment industries. This Privacy Policy
                    explains how we collect, use, share, and safeguard personal information when you use our website,
                    mobile application, and related services (collectively, the "Service"). By accessing or using the
                    Service, you agree to the terms of this Privacy Policy and our Terms of Service.
                </p>
            </section>

            <section id="types" className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Types of Information We Collect</h2>
                <p>We collect both personal and non‑personal information about you when you use the Service.</p>
                <ul className={styles.list}>
                    <li>
                        <strong>Account and contact details:</strong> name, stage name or alias, profile photo, email address,
                        phone number, mailing address, and password.
                    </li>
                    <li>
                        <strong>Profile and content data:</strong> information you provide in your profile, biography, and any
                        content you upload, share, or stream on the Service (e.g., music tracks, artwork, performances, commentary,
                        metadata and tags).
                    </li>
                    <li>
                        <strong>Payment and transaction data:</strong> billing information such as payment card details (processed by a
                        third‑party payment processor), bank or payout information, and transaction history relating to paid services
                        or payouts.
                    </li>
                    <li>
                        <strong>Communications:</strong> information you provide when you communicate with us or other users, including
                        messages, feedback, support requests, dispute information, and any correspondence.
                    </li>
                    <li>
                        <strong>User‑generated content visibility:</strong> your profile information and content may be viewable by other
                        users. When you participate in a collaboration ("Collab Rooms") or engage with others, your username, profile,
                        and interactions may be accessible to collaborators and clients.
                    </li>
                </ul>
                <p>
                    <strong>Non‑personal information</strong> includes data that does not identify you directly. Examples include browser type,
                    device information, language preferences, pages visited, referring URLs, cookies, pixel tags, IP addresses,
                    aggregated statistical or demographic data, and usage patterns. We collect this data automatically through the
                    Service and third‑party analytics tools to monitor usage, improve performance, and analyze trends.
                </p>
            </section>

            <section id="collect" className={styles.section}>
                <h2 className={styles.sectionTitle}>2. How We Collect Information</h2>
                <ul className={styles.list}>
                    <li>
                        <strong>Directly from you:</strong> when you create an account, upload content, subscribe to our newsletter,
                        complete forms, participate in Collab Rooms, make purchases, communicate with us, or update your profile.
                    </li>
                    <li>
                        <strong>Automatically:</strong> we use cookies and similar technologies to collect usage data, device identifiers, IP
                        addresses, browser details, and information about how you use the Service. This information helps us
                        authenticate users, remember preferences, prevent fraud, and provide a personalized experience.
                    </li>
                    <li>
                        <strong>From third parties:</strong> we may receive information about you from payment processors (e.g., Stripe),
                        identity verification services, marketing partners, analytics providers, social media platforms, or other
                        users when they invite you to collaborate.
                    </li>
                </ul>
            </section>

            <section id="use" className={styles.section}>
                <h2 className={styles.sectionTitle}>3. How We Use Information</h2>
                <ul className={styles.list}>
                    <li>
                        <strong>To operate and provide the Service:</strong> including account creation, profile management, content hosting,
                        facilitating collaborations, processing payments and payouts, and enabling communications.
                    </li>
                    <li>
                        <strong>To personalize and improve the Service:</strong> customizing user experience, recommending collaborators, helping
                        users find relevant services, and understanding usage to develop new features.
                    </li>
                    <li>
                        <strong>For safety, security, and fraud prevention:</strong> verifying identities, monitoring suspicious activity,
                        enforcing our Terms of Service, preventing unauthorized transactions, and protecting the rights of Kaboom
                        Collab and our users.
                    </li>
                    <li>
                        <strong>To communicate with you:</strong> sending account confirmations, notifications about activity or comments,
                        responses to inquiries, promotional and marketing communications, and service updates. You may opt out of
                        marketing emails at any time, but we may still send you administrative messages.
                    </li>
                    <li>
                        <strong>For analytics and research:</strong> analyzing how users interact with our Service, measuring the effectiveness of
                        marketing campaigns, and using aggregated, non‑personal data for business planning and partner reporting.
                    </li>
                    <li>
                        <strong>To comply with legal obligations:</strong> meeting regulatory or legal requirements, responding to law enforcement
                        requests, and protecting the safety, rights, or property of Kaboom Collab, users, and others.
                    </li>
                </ul>
            </section>

            <section id="sharing" className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Sharing and Disclosure of Information</h2>
                <ul className={styles.list}>
                    <li>
                        <strong>Service providers and business partners:</strong> We share information with trusted third‑party vendors, payment
                        processors, analytics providers, hosting services, marketing and advertising partners, customer support
                        providers, and other contractors who perform services on our behalf. These parties are authorized to use
                        personal information only as needed to provide the services to us and must adhere to confidentiality
                        obligations.
                    </li>
                    <li>
                        <strong>Collaborators and clients:</strong> When you participate in a project or Collab Room, your profile information,
                        services offered, content, and communications may be visible to collaborators, clients, or other users involved
                        in the project.
                    </li>
                    <li>
                        <strong>Legal and safety disclosures:</strong> We may disclose information if required by law, court order, or legal
                        process; to enforce our Terms of Service; to respond to claims; or to protect the rights, property, or safety
                        of Kaboom Collab, our users, or the public.
                    </li>
                    <li>
                        <strong>Business transfers:</strong> In the event of a merger, acquisition, bankruptcy, reorganization, sale of assets, or
                        other business transaction, personal information may be transferred to the acquiring or successor entity. We
                        will provide notice if such a transfer occurs and inform you of any choices you may have.
                    </li>
                    <li>
                        <strong>With your consent:</strong> We may share information with third parties or partners when you give us permission to
                        do so.
                    </li>
                </ul>
            </section>

            <section id="cookies" className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Cookies and Tracking Technologies</h2>
                <p>
                    We use cookies, web beacons, pixels, and similar tracking technologies to collect data about your interactions
                    with our Service. Cookies are small text files stored on your device that help us remember your preferences,
                    improve your experience, and track usage patterns. You can control the use of cookies through your browser
                    settings. If you disable cookies, certain features of the Service may not function properly. For more
                    information about cookies and how we use them, please refer to our Cookie Policy (if available).
                </p>
            </section>

            <section id="retention" className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Data Retention and Security</h2>
                <p>
                    We retain your personal information only for as long as necessary to fulfill the purposes described in this
                    Privacy Policy, to comply with our legal obligations, to resolve disputes, and to enforce our agreements. When
                    your account is closed or your personal information is no longer needed, we will delete or anonymize it in
                    accordance with applicable laws and regulations.
                </p>
                <p>
                    Kaboom Collab implements administrative, technical, and physical safeguards designed to protect your
                    information against unauthorized access, theft, or loss. These measures include encryption, secure server
                    connections, firewalls, and access controls. However, no method of transmission or storage is completely
                    secure. By using our Service, you acknowledge that we cannot guarantee absolute security and agree to assume
                    these risks.
                </p>
            </section>

            <section id="rights" className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Your Rights and Choices</h2>
                <p>
                    Depending on your location and applicable privacy laws, you may have rights regarding your personal
                    information, including:
                </p>
                <ul className={styles.list}>
                    <li><strong>Access and rectification:</strong> You can access and update your personal information in your account settings.</li>
                    <li>
                        <strong>Deletion (“Right to be Forgotten”):</strong> You may request that we delete certain personal information.
                        Please note that we may retain some information as required by law or for legitimate business purposes.
                    </li>
                    <li><strong>Data portability:</strong> You can request a copy of your personal information in a machine‑readable format.</li>
                    <li>
                        <strong>Opt‑out of marketing communications:</strong> You can unsubscribe from marketing emails by following the
                        instructions in those emails or adjusting preferences in your account settings.
                    </li>
                    <li>
                        <strong>California Consumer Privacy Act (CCPA):</strong> If you are a California resident, you may have specific rights
                        regarding your personal information, including the right to know what categories of data we collect, to
                        request deletion, and to opt out of the sale (we do not sell personal data).
                    </li>
                    <li>
                        <strong>European Economic Area (EEA) and GDPR:</strong> If you are located in the EEA, you may have additional rights
                        under the General Data Protection Regulation (GDPR), such as the right to object to processing, restrict
                        processing, or lodge a complaint with a data protection authority.
                    </li>
                </ul>
                <p>
                    To exercise these rights, please contact us using the details provided below. We will respond to your request
                    in accordance with applicable laws and may ask for verification of your identity.
                </p>
            </section>

            <section id="children" className={styles.section}>
                <h2 className={styles.sectionTitle}>8. Children’s Privacy</h2>
                <p>
                    The Service is not directed to anyone under the age of 13, and we do not knowingly collect personal
                    information from children under 13. If we learn that a child under 13 has provided personal information without
                    parental consent, we will take steps to delete that information. If you believe we might have information from
                    or about a child under 13, please contact us.
                </p>
            </section>

            <section id="thirdparty" className={styles.section}>
                <h2 className={styles.sectionTitle}>9. Third‑Party Links and Services</h2>
                <p>
                    Our Service may contain links to third‑party websites, applications, or services that are not operated by
                    Kaboom Collab. We are not responsible for the privacy practices of those third parties. If you choose to visit
                    or engage with third‑party services, their privacy policies will govern your use and any data they collect. We
                    encourage you to read the privacy statements of any external services you interact with.
                </p>
            </section>

            <section id="changes" className={styles.section}>
                <h2 className={styles.sectionTitle}>10. Changes to This Privacy Policy</h2>
                <p>
                    Kaboom Collab may update or modify this Privacy Policy at any time. We will post the updated version on our
                    website and indicate the effective date at the top of the policy. If we make material changes, we will provide
                    notice through the Service or by other means as required by law. Your continued use of the Service after the
                    effective date of any changes constitutes your acceptance of the updated policy.
                </p>
            </section>

            <section id="contact" className={styles.section}>
                <h2 className={styles.sectionTitle}>11. Contact Us</h2>
                <address className={styles.address}>
                    <p><strong>Kaboom Collab Privacy Team</strong></p>
                    <p>Email: <a href="mailto:support@kaboomcollab.com">support@kaboomcollab.com</a></p>
                    <p>Mailing Address: 65 Glen Rd suite 682 Garner NC 27529, USA</p>
                    <p className={styles.smallNote}>
                        Please note that the email address and mailing address provided above are for privacy‑related inquiries. For
                        other questions or customer support, please visit our support page.
                    </p>
                </address>
            </section>

            <section id="disclaimer" className={styles.section}>
                <h2 className={styles.sectionTitle}>Disclaimer</h2>
                <p>
                    This Privacy Policy template is provided for general informational purposes and does not constitute legal
                    advice. While it reflects the structure and typical clauses recommended by privacy experts, your company
                    should tailor the policy to reflect your actual data practices and consult with legal counsel to ensure
                    compliance with applicable laws and regulations.
                </p>
            </section>
        </main>
    );
}

export default PrivacyPolicy