import React from 'react';
import { Outlet } from 'react-router-dom';
import { PortalHeader } from '../components/PortalHeader.js';

/**
 * StudentPortalLayout
 * Exclusively owns the Student Portal Unified Header (<PortalHeader />)
 * for authenticated student workspaces, CBT practice simulator, and academic tools.
 * Public Landing Navbar (<Navbar />) and marketing <Footer /> must NEVER be rendered here.
 */
export const StudentPortalLayout: React.FC = () => {
  return (
    <div className="student-portal-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper, #eceee6)' }}>
      <PortalHeader />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default StudentPortalLayout;

