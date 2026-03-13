import { useMemo, useState } from 'react';

export const useSearch = (items = [], selector = (item) => Object.values(item).join(' ')) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) {
      return items;
    }
    return items.filter((item) => selector(item).toLowerCase().includes(normalized));
  }, [items, query, selector]);

  return { query, setQuery, filtered };
};

export default useSearch;