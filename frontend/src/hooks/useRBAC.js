import { useMemo } from 'react';
import useAuth from './useAuth';

export const ROLES = {
  USER: 'ROLE_USER',
  MANAGER: 'ROLE_MANAGER',
  ADMIN: 'ROLE_ADMIN'
};

export const PERMISSIONS = {
  'article:create': [ROLES.USER, ROLES.MANAGER, ROLES.ADMIN],
  'article:publish': [ROLES.MANAGER, ROLES.ADMIN],
  'article:delete_any': [ROLES.ADMIN],
  'page:manage': [ROLES.MANAGER, ROLES.ADMIN],
  'page:delete': [ROLES.ADMIN],
  'media:upload': [ROLES.USER, ROLES.MANAGER, ROLES.ADMIN],
  'media:delete_any': [ROLES.ADMIN],
  'category:manage': [ROLES.MANAGER, ROLES.ADMIN],
  'category:delete': [ROLES.ADMIN],
  'user:manage': [ROLES.ADMIN],
  'analytics:view': [ROLES.MANAGER, ROLES.ADMIN]
};

export const useRBAC = () => {
  const { user } = useAuth();
  const roles = user?.roles || [];

  return useMemo(() => ({
    can(permission) {
      return (PERMISSIONS[permission] || []).some((role) => roles.includes(role));
    },
    canPublishArticle(article) {
      return (PERMISSIONS['article:publish'] || []).some((role) => roles.includes(role)) || article?.authorId === user?.id;
    },
    canEditArticle(article) {
      return (PERMISSIONS['article:publish'] || []).some((role) => roles.includes(role)) || article?.authorId === user?.id;
    },
    canDeleteArticle(article) {
      return (PERMISSIONS['article:delete_any'] || []).some((role) => roles.includes(role)) || article?.authorId === user?.id;
    },
    canDeleteMedia(media) {
      return (PERMISSIONS['media:delete_any'] || []).some((role) => roles.includes(role)) || media?.uploadedById === user?.id;
    }
  }), [roles, user]);
};

export default useRBAC;