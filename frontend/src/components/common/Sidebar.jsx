
import { NavLink } from 'react-router-dom';
import { useRBAC } from '../../hooks/useRBAC';

const baseLinks = [
  { to: '/articles', label: 'Articles' },
  { to: '/pages', label: 'Pages' },
  { to: '/media', label: 'Media' }
];

export default function Sidebar() {
  const { can } = useRBAC();
  const links = [
    ...baseLinks,
    ...(can('category:manage') ? [{ to: '/categories', label: 'Categories' }] : []),
    ...(can('analytics:view') ? [{ to: '/analytics', label: 'Analytics' }] : []),
    ...(can('user:manage') ? [{ to: '/admin/users', label: 'Users' }] : [])
  ];

  return (
    <aside className="col-lg-2 d-none d-lg-block border-end min-vh-100 px-3 py-4 app-sidebar">
      <div className="list-group list-group-flush">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `list-group-item list-group-item-action rounded-3 mb-2 app-sidebar-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}