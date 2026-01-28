import Image from "next/image";
import styles from "./style.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import logo from "@/public/assets/img/kaboomlogo.png";

export default function CustomLogo() {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };
  return (
    <div className={styles.navbarlogo} onClick={handleLogoClick}>
      <p className={styles.logoText}>Kaboom Collab</p>
    </div>
  );
}
