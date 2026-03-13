import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { activateUser, deactivateUser, fetchUsers, updateUserRole } from './usersSlice';
import { useToast } from '../../hooks/useToast';

const ASSIGNABLE_ROLES = ['ROLE_USER', 'ROLE_MANAGER'];

export default function UserManagementPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { items, loading } = useSelector((state) => state.users);
  const visibleUsers = items.filter((user) => !user.roles.includes('ROLE_ADMIN'));
  const { currentPage, setCurrentPage, paginate, totalPages } = usePagination(1, 5);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [visibleUsers.length, setCurrentPage]);

  const pagedUsers = paginate(visibleUsers);

  const onRoleChange = async (id, role) => {
    if (!ASSIGNABLE_ROLES.includes(role)) {
      toast.error('Admin role cannot be assigned from the dashboard');
      return;
    }

    const result = await dispatch(updateUserRole({ id, role }));
    if (!result.error) {
      toast.success('Role updated successfully');
      dispatch(fetchUsers());
    } else {
      toast.error(result.payload);
    }
  };

  const onDeactivate = async (id) => {
    const result = await dispatch(deactivateUser(id));
    if (!result.error) {
      toast.success('User deactivated successfully');
    } else {
      toast.error(result.payload);
    }
  };

  const onActivate = async (id) => {
    const result = await dispatch(activateUser(id));
    if (!result.error) {
      toast.success('User reactivated successfully');
    } else {
      toast.error(result.payload);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h1 className="h3 fw-bold mb-4">User Management</h1>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Username</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length ? (
                pagedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.roles.join(', ')}</td>
                    <td>{user.active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <select
                        className="form-select form-select-sm mb-2 role-select"
                        value={ASSIGNABLE_ROLES.find((role) => user.roles.includes(role)) || 'ROLE_USER'}
                        onChange={(event) => onRoleChange(user.id, event.target.value)}
                        aria-label={`Role for ${user.username}`}
                      >
                        <option value="ROLE_USER">ROLE_USER</option>
                        <option value="ROLE_MANAGER">ROLE_MANAGER</option>
                      </select>
                      {user.active ? (
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDeactivate(user.id)} disabled={loading}>
                          Deactivate
                        </button>
                      ) : (
                        <button type="button" className="btn btn-outline-success btn-sm" onClick={() => onActivate(user.id)} disabled={loading}>
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-secondary py-4">No records available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages(visibleUsers.length)} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}