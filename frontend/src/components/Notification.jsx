import { useEffect, useState } from 'react';
import { getSocket } from '../socket/socket';

export default function Notification() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (data) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, ...data }]);
      // Auto-dismiss after 5 s
      setTimeout(() => dismiss(id), 5000);
    };

    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, []);

  const dismiss = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const icon = (type) => {
    if (type === 'complaint_update') return '📋';
    if (type === 'new_announcement') return '📢';
    return '🔔';
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <span className="toast-icon">{icon(t.type)}</span>
          <div className="toast-body">
            <p className="toast-title">
              {t.type === 'complaint_update' ? 'Complaint Updated' : 'New Announcement'}
            </p>
            <p className="toast-msg">{t.message}</p>
          </div>
          <button className="toast-close" onClick={() => dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
