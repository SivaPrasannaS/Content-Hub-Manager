export const formatDate = (value) => {
  if (!value) {
    return 'Not published';
  }
  return new Date(value).toLocaleString();
};

export const currentYearMonth = () => new Date().toISOString().slice(0, 7);