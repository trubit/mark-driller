import React from 'react';
import { Outlet } from 'react-router-dom';
import { PortalHeader } from '../components/PortalHeader.js';

/**
 * AdminLayout
 * Dedicated administration shell with admin-mode header.
 * Neither Public Navbar nor standard Student Navbar can leak into this layout.
 */
export const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper, #eceee6)' }}>
      <PortalHeader badge="ADMIN" badgeColor="ink" activePath="/admin" />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

