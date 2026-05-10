import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <header className="site-header">
      <NavLink to="/" className="site-brand">hkquantum-tools</NavLink>
      <nav className="site-nav">
        <NavLink
          to="/myledger"
          className={({ isActive }) => `site-nav-link${isActive ? ' site-nav-link--active' : ''}`}
        >
          myLEDGER
        </NavLink>
        <NavLink
          to="/mytodo"
          className={({ isActive }) => `site-nav-link${isActive ? ' site-nav-link--active' : ''}`}
        >
          myTODO
        </NavLink>
      </nav>
      {user && (
        <div className="site-user">
          <span className="site-user-name">{user.name}</span>
          <button className="btn btn--ghost btn--sm" onClick={handleSignOut}>Sign out</button>
        </div>
      )}
    </header>
  );
}
