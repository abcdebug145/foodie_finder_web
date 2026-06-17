import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, adminOnly = false, ownerOnly = false }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !currentUser.is_admin) {
    return <Navigate to="/" replace />;
  }

  if (ownerOnly && !currentUser.is_owner && !currentUser.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
