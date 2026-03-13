
import RoleGuard from './RoleGuard';

const withRole = (Component, permission, fallback = null) => {
  return function WrappedComponent(props) {
    return (
      <RoleGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };
};

export default withRole;