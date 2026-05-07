import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function HomePage() {
  useEffect(() => { document.title = 'hkquantum-tools'; }, []);
  return (
    <div className="home-layout">
      <Header />
      <section className="home-hero">
        <h1 className="home-title">
          <span className="home-title-accent">hk</span>quantum-tools
        </h1>
        <p className="home-sub">A personal suite of productivity and data tools.</p>
      </section>
      <section className="home-apps-section">
        <p className="home-apps-label">Tools</p>
        <div className="home-apps">
          <Link to="/myledger" className="app-card">
            <h2 className="app-card-name">myLEDGER</h2>
            <p className="app-card-desc">
              Linked Entity Data &amp; Governance Engine for Relationships — a personal CRM for tracking contacts, categories, and notes.
            </p>
          </Link>
          <Link to="/mytodo" className="app-card">
            <h2 className="app-card-name">myTODO</h2>
            <p className="app-card-desc">
              Tracker for Outstanding Duties Obsessively — manage tasks by category, flag urgent items, and track completion.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
