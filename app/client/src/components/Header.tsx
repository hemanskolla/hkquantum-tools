import { NavLink } from 'react-router-dom';

export default function Header() {
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
    </header>
  );
}
