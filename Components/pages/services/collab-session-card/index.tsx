import React, { useState } from "react";
import "./style.css"; // Add styles for the cards
import LoginModal from "@/Components/custom/login-modal";

export default function CollabSessionCard({ session }: any) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
  return (
    <div className="collab-session-card">
      <div>
        <h3 className="session-title">{session.name}</h3>
        <p className="session-description">{session.description}</p>
      </div>
      <button className="cta-button" onClick={openModal}>
        {/* {session.cta} */}
        Join Room
      </button>
      <LoginModal visible={isModalVisible} onClose={closeModal} />
    </div>
  );
}
