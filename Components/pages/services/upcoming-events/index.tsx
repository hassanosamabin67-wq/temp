import React, { useMemo, useState } from "react";
import "./style.css";
import EventCard from "./event-card";
import { events } from "@/utils/services";
import { useAppSelector } from "@/store";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const UpcomingEvents: React.FC = () => {
  const selectedCategory = useAppSelector((state) => state.category.selectedCategory!);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Filter events based on category and date range
  const filteredEvents = useMemo(() => {
    const categoryEvents = events.find((category) => category.id === selectedCategory)?.events || [];

    // If no date range is selected, return all events
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return categoryEvents;
    }

    const [startDate, endDate] = dateRange;

    return categoryEvents.filter((event) => {
      const eventDate = dayjs(event.date, "MMM D, YYYY");
      return eventDate.isValid() && eventDate.isBetween(startDate, endDate, "day", "[]");
    });
  }, [selectedCategory, dateRange]);

  // Disable dates before the current date
  const disabledDate = (current: Dayjs | null): boolean => {
    return current ? current.isBefore(dayjs().startOf("day")) : false;
  };

  // Handle changes to the date range picker
  const onDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  if (!filteredEvents.length) {
    return (
      <div className="calendar-section">
        <h2>Upcoming Events</h2>
        <p>No events found for the selected category.</p>
      </div>
    );
  }

  return (
    <div className="calendar-section">
      <div className="calendar-header">
        <h2>Upcoming Events</h2>
        <RangePicker 
          disabledDate={disabledDate} 
          onChange={(dates) => onDateRangeChange(dates)} 
        />
      </div>
      <div className="events-list">
        {filteredEvents.map((event: any, index: number) => (
          <EventCard key={event.id || index} event={event} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
