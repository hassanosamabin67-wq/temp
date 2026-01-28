import moment from "moment-timezone";
interface timestape {
  createdAt:string |null
}
const MessageTimestamp = ({ createdAt }: timestape ) => {
  console.log(createdAt, "createdAt");

  const now = moment();

// Convert the createdAt timestamp from UTC to the local time zone
const messageTime = moment.utc(createdAt).local();

const isSameYear = messageTime.isSame(now, "year");
const isToday = messageTime.isSame(now, "day");
const isYesterday = messageTime.isSame(now.clone().subtract(1, 'day'), 'day'); // Check if it's yesterday

let displayTime;

if (isToday) {
  // If the message is from today, show relative time (e.g., "a few seconds ago")
  displayTime = messageTime.fromNow();
} else if (isYesterday) {
  // If the message is from yesterday, show "Yesterday" with time
  displayTime = `Yesterday at ${messageTime.format("HH:mm")}`;
} else if (isSameYear) {
  // If the message is from the same year but not today or yesterday, show the date (e.g., "25/02")
  displayTime = messageTime.format("DD/MM");
} else {
  // If the message is from a previous year, show full date with year (e.g., "25/02/2023")
  displayTime = messageTime.format("DD/MM/YYYY");
}

  return <p className="text-xs text-black-100 mt-1 text-right">{displayTime}</p>;
};

export default MessageTimestamp;
