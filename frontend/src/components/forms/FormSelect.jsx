

export default function FormSelect({ label, name, register, error, options, ...rest }) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label fw-semibold">{label}</label>
      <select id={name} className={`form-select ${error ? 'is-invalid' : ''}`} {...register(name)} {...rest}>
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="invalid-feedback">{error.message}</div>}
    </div>
  );
}