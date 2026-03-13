

export default function FormTextarea({ label, name, register, error, rows = 6, ...rest }) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label fw-semibold">{label}</label>
      <textarea id={name} rows={rows} className={`form-control ${error ? 'is-invalid' : ''}`} {...register(name)} {...rest} />
      {error && <div className="invalid-feedback">{error.message}</div>}
    </div>
  );
}