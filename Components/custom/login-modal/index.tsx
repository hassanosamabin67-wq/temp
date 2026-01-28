import { Modal } from "antd";
import React from "react";
import LoginForm from "@/Components/pages/auth/login-form";
import loginImage from "@/public/assets/img/loginimage.png";
import Image from "next/image";
import styles from "./style.module.css";

function LoginModal({ visible, onClose }: any) {
  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        centered
        width={800} // Modal width
        className={styles.modal} // Add custom modal styling
      >
        <div className={styles.modalContent}>
          <div className="main-heading-desc-modal">
          <h2 className={styles.title}>
              You need to log in to access this feature.
            </h2>

            <p className={styles.description}>
              Access thousands of features and connect across the globe!
            </p>
          </div>
          {/* Left Side: Image */}
          {/* <div className={styles.imageContainer}>
            <Image
              src={loginImage}
              alt="Login Illustration"
              className={styles.loginImage}
              width={300}
            />
          </div> */}

          {/* Right Side: Text and Form */}
          <div className={styles.formContainer}>
            

            <LoginForm />

            <div className={styles.terms}>
              <p>
                By logging in, you agree to our{" "}
                <a href="/terms" className={styles.link}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className={styles.link}>
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default LoginModal;
