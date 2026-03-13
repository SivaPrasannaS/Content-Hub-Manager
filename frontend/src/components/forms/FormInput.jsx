

import { useState } from 'react';

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="password-toggle-icon">
      <path
        d="M1.75 12s3.5-6.25 10.25-6.25S22.25 12 22.25 12 18.75 18.25 12 18.25 1.75 12 1.75 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="password-toggle-icon">
      <path
        d="M3 3l18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10.58 5.89A11.18 11.18 0 0 1 12 5.75c6.75 0 10.25 6.25 10.25 6.25a17.78 17.78 0 0 1-3.72 4.38M6.1 8.22A17.54 17.54 0 0 0 1.75 12S5.25 18.25 12 18.25c1.15 0 2.21-.18 3.2-.49"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FormInput({ label, name, register, error, type = 'text', ...rest }) {
  const isPasswordField = type === 'password';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const registration = register(name);
  const inputType = isPasswordField ? (isPasswordVisible ? 'text' : 'password') : type;
  const visibilityStateLabel = isPasswordVisible ? 'Hide value' : 'Show value';
  const ToggleIcon = isPasswordVisible ? EyeOpenIcon : EyeClosedIcon;

  const handleTogglePasswordVisibility = () => {
    if (!isPasswordField) {
      return;
    }

    setIsPasswordVisible((current) => !current);
  };

  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label fw-semibold">{label}</label>
      <div className="password-input-wrapper">
        <input
          id={name}
          type={inputType}
          className={`form-control ${isPasswordField ? 'password-field' : ''} ${error ? 'is-invalid' : ''}`}
          {...registration}
          {...rest}
        />
        {isPasswordField ? (
          <button
            type="button"
            className="password-toggle-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleTogglePasswordVisibility}
            aria-label={visibilityStateLabel}
            title={visibilityStateLabel}
            aria-pressed={isPasswordVisible}
            data-visibility-state={isPasswordVisible ? 'visible' : 'hidden'}
          >
            <ToggleIcon />
          </button>
        ) : null}
      </div>
      {error && <div className="invalid-feedback">{error.message}</div>}
    </div>
  );
}