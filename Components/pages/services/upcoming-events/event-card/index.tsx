'use client';
import React from "react";
import "./style.css";
// import { Calendar } from "antd";
import dayjs from "dayjs";
// import ReactPlayer from "react-player";
import Image from "next/image";

const EventCard = ({ event }: any) => {
  // Convert event.date to a Dayjs object
  const eventDate = dayjs(event.date, "MMM D, YYYY"); // Adjust format to match your `event.date`

  return (
    <div className="event-card">
      {event.image && (
        <div className="event-image">
          {/* Ant Design Calendar with the event's date set as active */}
         
        <Image src={event?.url} alt="meeting"  />
        </div>
      )}
      <div className="event-details">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-date-time">
          {event.date} | {event.time}
        </p>
        <p className="event-location">{event.location}</p>
        <p className="event-description">{event.description}</p>
        <button className="cta-button join-button">Join Event</button>
      </div>
    </div>
  );
};

export default EventCard;
