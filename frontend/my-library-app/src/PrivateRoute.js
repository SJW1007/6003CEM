// PrivateRoute.js
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const isLoggedIn = !!localStorage.getItem('userId');
  return isLoggedIn ? children : <Navigate to="/" />;
}
