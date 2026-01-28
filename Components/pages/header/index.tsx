import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateRightOutlined, UserOutlined, MenuOutlined, CloseOutlined } from "@ant-design/icons";
import CustomPopover from "@/Components/custom/custom-popover";
import { Col, Row, Tooltip } from "antd";
import { UIButton } from "@/Components/custom";
import SearchComponent from "./search";
import styles from "./header.module.css";
import { useAppSelector } from "@/store";
import AuthedPopover from "./search/authed-popover";
import { supabase } from "@/config/supabase";
import Notification from "./Notification";
import { TbMessage } from "react-icons/tb";
import MobileAuthAccordion from "./MobileAuthAccordion";
import { Sparkles } from 'lucide-react';
import AuthModal from "./AuthModal";

const Header = () => {
  const router = useRouter();
  const profile = useAppSelector((state) => state.auth);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select("userId,status")
        .eq("userId", userId)
        .maybeSingle()
      if (fetchError) {
        console.error("Error Fetching User from headers ", fetchError);
        return;
      }
      setUserStatus(user?.status)
    } catch (err) {
      console.error("Unexpected Error: ", err);
    }
  }

  useEffect(() => {
    if (!profile.profileId) return;
    fetchUserData(profile.profileId!);
  }, [profile])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    closeMobileMenu();
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <header className={styles.header}>
        <div className={styles.navbarContainer}>
          {/* Left Section: Logo and Mobile Menu Button */}
          <div className={styles.navbarLogo}>
            <button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
            {/* <p className={styles.logoText} onClick={() => handleNavigation("/")}>
              Kaboom Collab
            </p> */}
            <div className={styles.headerLogo} onClick={() => handleNavigation("/")}>
              {/* <Sparkles className={styles.headerLogoIcon} /> */}
              <span className={`${styles.headerLogoText} ${styles.logoText}`}>Kaboom Collab</span>
            </div>
          </div>

          {/* Middle Section: Desktop Navigation */}
          <nav className={styles.navbarMenu}>
            <div className={`${styles.menuItem} ${styles.headerLink}`} onClick={() => router.push("/services")}>
              Services
            </div>
            <div className={`${styles.menuItem} ${styles.headerLink}`} onClick={() => router.push("/think-tank")}>
              Collab Rooms
            </div>
            <div className={`${styles.menuItem} ${styles.headerLink}`} onClick={() => router.push("/advertise")}>
              Advertise
            </div>
            {profile.profileType === "client" && (
              <div className={`${styles.menuItem} ${styles.headerLink}`} onClick={() => router.push('/visionaries')}>
                Explore Visionaries
              </div>
            )}
          </nav>

          {/* Search Component */}
          <div className={styles.searchContainer}>
            <SearchComponent />
          </div>

          {/* Right Section: User Options */}
          <div className={styles.navbarIconMenu}>
            {profile.profileId && (
              <div className={styles.inboxIcon} onClick={() => router.push(`/messages/${profile.profileId}`)}>
                <TbMessage />
              </div>
            )}
            {profile.email ? (
              <>
                <Notification />
                <AuthedPopover profileStatus={userStatus} />
              </>
            ) : (
              // <CustomPopover
              //   placement="bottomRight"
              //   content={
              //     <div className={styles.popoverContent}>
              //       <Row>
              //         <Col>
              //           <UIButton
              //             type="text"
              //             className={styles.popoverButton}
              //             icon={<UserOutlined />}
              //             onClick={() => router.push("/login")}
              //           >
              //             Login
              //           </UIButton>
              //         </Col>
              //       </Row>
              //       <Row>
              //         <Col>
              //           <UIButton
              //             type="text"
              //             className={styles.popoverButton}
              //             icon={<RotateRightOutlined />}
              //             onClick={() => router.push("/signup")}
              //           >
              //             Signup
              //           </UIButton>
              //         </Col>
              //       </Row>
              //     </div>
              //   }
              // >
              //   <UserOutlined className={styles.userIcon} />
              // </CustomPopover>
              <button className={styles.headerCta} onClick={() => setShowAuthModal(true)}>
                Get Started
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.open : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
        {/* Navigation Section */}
        <div className={styles.mobileMenuSection}>
          <div className={styles.mobileMenuTitle}>Menu</div>
          <div className={styles.mobileMenuItem} onClick={() => handleNavigation("/")}>
            Home
          </div>
          <div className={`${styles.mobileMenuItem} ${styles.mobileServiceItem}`} onClick={() => handleNavigation("/services")}>
            Services
          </div>
          <div className={styles.mobileMenuItem} onClick={() => handleNavigation("/think-tank")}>
            Collab Rooms
          </div>
          {profile.profileType === "client" && (
            <div className={styles.mobileMenuItem} onClick={() => handleNavigation('/visionaries')}>
              Hire a Visionary Today
            </div>
          )}
          {profile.profileId && (
            <div className={styles.mobileMenuItem} onClick={() => handleNavigation(`/messages/${profile.profileId}`)}>
              Messages
            </div>
          )}
        </div>

        {/* Auth Section with Ant Design Accordion */}
        <div className={styles.mobileMenuSection}>
          <div className={styles.mobileMenuTitle}>Account</div>
          <div className={styles.mobileAuthSection}>
            <MobileAuthAccordion
              profileStatus={userStatus}
              onNavigate={handleNavigation}
            />
          </div>
        </div>

      </div>
    </>
  );
};

export default Header;