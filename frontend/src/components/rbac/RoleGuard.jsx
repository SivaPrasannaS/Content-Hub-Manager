
import { useRBAC } from '../../hooks/useRBAC';

export default function RoleGuard({ permission, children, fallback = null }) {
  const { can } = useRBAC();
  return can(permission) ? children : fallback;
}