import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => { document.title = 'Sign in — hkquantum-tools'; }, []);

  return (
    <div className="login-layout">
      <div className="login-card">
        <h1 className="login-title">
          <span className="home-title-accent">hk</span>quantum-tools
        </h1>
        <p className="login-sub">Sign in to access your personal workspace.</p>
        <a href="/auth/google" className="btn btn--google">
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
