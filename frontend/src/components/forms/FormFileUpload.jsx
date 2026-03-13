

export default function FormFileUpload({ label, name, register, error, onChange, inputRef, inputKey }) {
  const registration = register(name);

  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label fw-semibold">{label}</label>
      <input key={inputKey} id={name} type="file" className={`form-control ${error ? 'is-invalid' : ''}`} {...registration} ref={(element) => {
        registration.ref(element);
        if (inputRef) {
          inputRef.current = element;
        }
      }} onChange={onChange} />
      {error && <div className="invalid-feedback">{error.message}</div>}
    </div>
  );
}