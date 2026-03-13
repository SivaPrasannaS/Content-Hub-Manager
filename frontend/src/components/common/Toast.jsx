import { useEffect, useState } from 'react';

export default function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const listener = (event) => {
      setToast(event.detail);
      window.setTimeout(() => setToast(null), 2500);
    };

    window.addEventListener('chm-toast', listener);
    return () => window.removeEventListener('chm-toast', listener);
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
      <div className={`toast show align-items-center text-bg-${toast.variant} border-0`} role="alert">
        <div className="d-flex">
          <div className="toast-body">{toast.message}</div>
          <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast(null)} aria-label="Close" />
        </div>
      </div>
    </div>
  );
}