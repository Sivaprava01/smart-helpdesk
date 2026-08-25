import React, { useState, useEffect } from 'react';

/**
 * 15-minute response window countdown timer for offered technician assignments.
 */
export default function ActiveOfferTimer({ offeredAt, onExpired = null }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isWarning, setIsWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!offeredAt) return;

    const offerTime = new Date(offeredAt).getTime();
    const expiryTime = offerTime + 15 * 60 * 1000; // 15 minutes window

    function updateTimer() {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
        if (onExpired) onExpired();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeLeft(formatted);
      setIsWarning(minutes < 3); // Under 3 mins left
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [offeredAt, onExpired]);

  if (!offeredAt) return <span className="font-mono text-secondary small">--:--</span>;

  let badgeColor = 'bg-primary-subtle text-primary border-primary-subtle';
  if (isWarning) badgeColor = 'bg-warning-subtle text-warning-emphasis border-warning';
  if (isExpired) badgeColor = 'bg-danger-subtle text-danger border-danger';

  return (
    <span
      className={`badge border font-mono d-inline-flex align-items-center gap-1 py-1 px-2 ${badgeColor}`}
      style={{ fontSize: '11px' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
        {isExpired ? 'timer_off' : 'timer'}
      </span>
      <span>{isExpired ? 'Expired' : timeLeft}</span>
    </span>
  );
}
