import { useEffect } from 'react';
import './Toast.css';

function Toast({ message, type = 'info', onClose, duration = 3000, persist = false }) {
  useEffect(() => {
    if (!persist && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, persist, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        {type === 'schedule' ? (
          <div className="toast-schedule">
            {message}
          </div>
        ) : (
          <p>{message}</p>
        )}
      </div>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default Toast;
