import React from "react";
import ContentCard from "./ContentCard";
// import useProfileSetup from './'; // corrected typo
import { Button, Tag } from "antd";
import useProfileStup from "./ts";
import { categoriesContent, menuData } from "@/utils/services";
import ShowSubcategories from "@/Components/custom/show-categories";
import "./style.css";
import ProfileVideo from "./uploadVideo";

function ProfileContent() {
  const { profile } = useProfileStup();

  return (
    <div className="main-cont-secondsec-profile" >
      {/* <div className="cardOneProfilePage">
        <ContentCard cardTitle="Experience" details={profile?.experience} categoryKey={'experience'} />
      </div> */}
      {/* <section className="JoinThinkTankProfilePagebtnSec">

        <div className="cardTwoProfilePage">
          <ContentCard
            cardTitle="Certifications"
            details={profile?.certifications}
            categoryKey={'certifications'}
          />
        </div>
      </section> */}

      {/* <section className="portfolioSkillsSecProfilePage"> */}
        {/* <div className="cardThreeProfilePage">
          <ContentCard cardTitle="Portfolio" details={profile?.workshops} categoryKey={'workshops'} />
        </div> */}
        {/* <div className="SkillProfilePageSec">
          <h2>Skills</h2>
          <ShowSubcategories categoryId={profile?.category} />
        </div> */}

        {/* <ContentCard cardTitle='Skills' details={profile?.mentorships} /> */}
      {/* </section> */}
      <div className="cardFourProfilePage">
        <ContentCard
          cardTitle="Client Reviews"
          details={profile?.mentorships}
          categoryKey={"mentorships"}
        />
      </div>

    </div>
  );
}

export default ProfileContent;
