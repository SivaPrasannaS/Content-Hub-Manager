export const truncateText = (value, maxLength = 96) => {
  if (!value) {
    return '';
  }

  const normalizedValue = String(value).trim().replace(/\s+/g, ' ');
  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

export default truncateText;