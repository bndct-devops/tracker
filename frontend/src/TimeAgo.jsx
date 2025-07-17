import { useState, useEffect } from 'react';

const timeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const seconds = Math.floor((now - past) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
};

function TimeAgo({ timestamp }) {
  const [time, setTime] = useState(() => timeAgo(timestamp));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(timeAgo(timestamp));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>{time}</span>;
}

export default TimeAgo;
