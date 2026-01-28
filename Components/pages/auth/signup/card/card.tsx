import React, { useState } from "react";
import "./style.css";
import { DesktopOutlined } from "@ant-design/icons";
import Link from "next/link";
interface SelectCard{
    selected:string |null
    handleSelection:(selected:string)=>void
    setIsContinue:(e:boolean)=>void
}

function Card({selected,setIsContinue,handleSelection}:SelectCard) {
  return (
    <div className="main">
      <div className="parent">
        <div className="class1">
          <p className="heading-signup">JOIN AS A </p>
        </div>
        <div className="class2">
          <div
            className={`siblings ${selected === "client" ? "selected" : ""}`}
            onClick={() => handleSelection("client")}
          >
            <div className="display-icon">
              {/* <DesktopOutlined /> */}

              <div className={`round ${selected === "client" ? "active" : ""}`}>
                <div
                  className={`inner-round ${
                    selected === "client" ? "active" : ""
                  }`}
                ></div>
              </div>
            </div>
            <h2>CLIENT</h2>
          </div>
          <div
            className={`siblings ${
              selected === "Visionary" ? "selected" : ""
            }`}
            onClick={() => handleSelection("Visionary")}
          >
            <div className="display-icon">
              {/* <DesktopOutlined /> */}
              <div
                className={`round ${selected === "Visionary" ? "active" : ""}`}
              >
                <div
                  className={`inner-round ${
                    selected === "Visionary" ? "active" : ""
                  }`}
                ></div>
              </div>
            </div>
            <h2>VISIONARY</h2>
          </div>
        </div>
      </div>
      <div className="parent2">
        <div className="class3">
          <button
          onClick={()=>setIsContinue(true)}
          disabled={!selected}
            className={`btn ${
              selected
                ? selected === "client"
                  ? "btn-client"
                  : "btn-Visionary"
                : ""
            }`}
          >
            {selected === "client"
              ? "As a Client"
              : "As a Visionary"}
          </button>
        </div>
        <div className="link">
          Already have an account? <Link href={'/login'}>Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default Card;
