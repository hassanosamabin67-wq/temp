import Image from "next/image";
import React from "react";
import "./style.css"; // Import the CSS file

const Card = ({ imageSrc, title, description,col }: any) => (
  <div className={col?"coloumn-card":"card-container-soundscapes"}>
    <Image className="card-image" src={imageSrc} alt={title} width={50} height={50} />
    <h1 className="card-title">{title}</h1>
    <p className="card-description">{description}</p>
  </div>
);

export default Card;
