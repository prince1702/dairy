"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface CustomerLayoutClientProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  walletBalance: number;
  unreadNotifications: number;
  children: React.ReactNode;
}

export function CustomerLayoutClient({
  customer,
  walletBalance,
  unreadNotifications,
  children,
}: CustomerLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Collapsed state for desktop sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Mobile drawer open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load layout configurations from storage
  useEffect(() => {
    const savedCollapse = localStorage.getItem("customer_sidebar_collapsed");
    if (savedCollapse === "true") {
      setIsCollapsed(true);
    }
    const savedTheme = localStorage.getItem("customer_theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  // Close mobile sidebar on route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("customer_sidebar_collapsed", String(nextState));
  };

  const toggleTheme = () => {
    const nextState = !isDarkMode;
    setIsDarkMode(nextState);
    localStorage.setItem("customer_theme", nextState ? "dark" : "light");
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const navigationItems = [
    {
      name: "Dashboard",
      path: "/customer/dashboard",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "My Subscription",
      path: "/customer/subscription",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: "Tomorrow Changes",
      path: "/customer/tomorrow",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "Vacation Mode",
      path: "/customer/vacation",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
    },
    {
      name: "Daily Pause",
      path: "/customer/pause",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: "Wallet",
      path: "/customer/wallet",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: "Recharge Wallet",
      path: "/customer/recharge",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      name: "Order History",
      path: "/customer/orders",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: "Delivery History",
      path: "/customer/delivery",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16h6m0 0v-5m0 0l-4-4M19 11h-3V8m-9 8h8M3 14H2a1 1 0 01-1-1v-3a1 1 0 011-1h1" />
        </svg>
      ),
    },
    {
      name: "Notifications",
      path: "/customer/notifications",
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      name: "My Profile",
      path: "/customer/profile",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: "Support",
      path: "/customer/support",
      icon: (
        <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  // Helper to get Page Title from path
  const getPageTitle = () => {
    const matched = navigationItems.find(item => pathname.startsWith(item.path));
    return matched ? matched.name : "Customer Portal";
  };

  return (
    <div className={`app-layout-container ${isDarkMode ? "dark-theme" : ""}`}>
      {/* 1. Backdrop for mobile sidebar */}
      {isMobileOpen && (
        <div className="mobile-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* 2. Left Sidebar */}
      <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Link href="/customer/dashboard" className="sidebar-logo">
            <span className="logo-icon">🥛</span>
            {!isCollapsed && (
              <span className="logo-text">
                Bhagwati <span className="logo-accent">Enterprise</span>
              </span>
            )}
          </Link>
          <button className="collapse-btn desktop-only" onClick={toggleCollapse} title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Quick Wallet Summary in Sidebar */}
        <div className="sidebar-wallet-card">
          <span className="wallet-card-label">Wallet Balance</span>
          <span className="wallet-card-amount">₹{walletBalance.toFixed(2)}</span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                title={item.name}
              >
                {item.icon}
                <span className="nav-label">{item.name}</span>
                {item.badge !== undefined && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}

          <button
            onClick={() => setShowLogoutModal(true)}
            className="nav-item logout-nav-btn"
            title="Logout"
          >
            <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="nav-label">Logout</span>
          </button>
        </nav>
      </aside>

      {/* 3. Main Dashboard Wrapper */}
      <div className="app-main-wrapper">
        {/* Top Header */}
        <header className="app-header">
          <div className="header-left">
            <button className="mobile-hamburger-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="header-title">{getPageTitle()}</h2>
          </div>

          <div className="header-right">
            {/* Theme Toggle Button */}
            <button className="theme-toggle-btn" onClick={toggleTheme} title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {isDarkMode ? (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notifications Shortcut */}
            <Link href="/customer/notifications" className="header-notifications-btn" title="View Notifications">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadNotifications > 0 && <span className="header-badge">{unreadNotifications}</span>}
            </Link>

            {/* Profile Dropdown Trigger */}
            <Link href="/customer/profile" className="header-profile-link">
              <div className="profile-avatar">
                {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="profile-name desktop-only">{customer.name}</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="app-content-body">
          {children}
        </main>
      </div>

      {/* 4. Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of Bhagwati Enterprise?</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled JSX Stylesheets */}
      <style jsx global>{`
        /* Dynamic Themed Properties */
        .app-layout-container {
          --bg-app: #FAFAF7;
          --bg-sidebar: #FFFFFF;
          --bg-card: #FFFFFF;
          --text-main: #1A1A1A;
          --text-muted: #6B7280;
          --border-color: #E5E7EB;
          --border-light: #F3F4F6;
          --primary-color: #1A6B3C;
          --primary-light: #e8f5ee;
          --accent-color: #F5A623;
          --accent-light: #fef3dc;
          --shadow-color: rgba(0, 0, 0, 0.05);
          --danger-color: #EF4444;
          --danger-light: #FEE2E2;
          
          display: flex;
          min-height: 100vh;
          background: var(--bg-app);
          color: var(--text-main);
          font-family: 'Inter', system-ui, sans-serif;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .app-layout-container.dark-theme {
          --bg-app: #0B0F19;
          --bg-sidebar: #111827;
          --bg-card: #1F2937;
          --text-main: #F9FAFB;
          --text-muted: #9CA3AF;
          --border-color: #1F2937;
          --border-light: #374151;
          --primary-color: #10B981;
          --primary-light: rgba(16, 185, 129, 0.15);
          --accent-color: #FBBF24;
          --accent-light: rgba(251, 191, 36, 0.15);
          --shadow-color: rgba(0, 0, 0, 0.3);
          --danger-color: #EF4444;
          --danger-light: rgba(239, 68, 68, 0.15);
        }

        /* Sidebar Styling */
        .app-sidebar {
          width: 260px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 100;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .app-sidebar.collapsed {
          width: 78px;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          height: 70px;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          overflow: hidden;
          white-space: nowrap;
        }

        .logo-icon {
          font-size: 24px;
        }

        .logo-text {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--text-main);
        }

        .logo-accent {
          color: var(--primary-color);
        }

        .collapse-btn {
          background: var(--border-light);
          border: none;
          color: var(--text-main);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }

        .collapse-btn:hover {
          background: var(--primary-light);
          color: var(--primary-color);
        }

        /* Sidebar Wallet Card */
        .sidebar-wallet-card {
          margin: 16px;
          padding: 16px;
          background: linear-gradient(135deg, var(--primary-color) 0%, rgba(16, 185, 129, 0.8) 100%);
          border-radius: 12px;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 4px 12px var(--shadow-color);
          overflow: hidden;
          transition: opacity 0.2s, max-height 0.2s, padding 0.2s;
        }

        .collapsed .sidebar-wallet-card {
          opacity: 0;
          max-height: 0;
          padding: 0;
          margin: 0;
          pointer-events: none;
        }

        .wallet-card-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.9;
        }

        .wallet-card-amount {
          font-size: 22px;
          font-weight: 700;
        }

        /* Sidebar Nav List */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 8px;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background: var(--border-light);
          color: var(--text-main);
        }

        .nav-item.active {
          background: var(--primary-light);
          color: var(--primary-color);
          font-weight: 600;
        }

        .menu-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .nav-label {
          transition: opacity 0.3s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .collapsed .nav-label {
          opacity: 0;
          width: 0;
          pointer-events: none;
        }

        .nav-badge {
          background: var(--danger-color);
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: auto;
        }

        .collapsed .nav-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          margin-left: 0;
        }

        .logout-nav-btn {
          color: var(--danger-color);
          margin-top: 12px;
          border-top: 1px solid var(--border-color);
          padding-top: 14px;
          border-radius: 0;
        }

        .logout-nav-btn:hover {
          background: var(--danger-light);
          color: var(--danger-color);
        }

        /* Main Area Layout */
        .app-main-wrapper {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 100vh;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .collapsed + .app-main-wrapper {
          margin-left: 78px;
        }

        /* Header Styling */
        .app-header {
          height: 70px;
          background: var(--bg-sidebar);
          border-bottom: 1px solid var(--border-color);
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 90;
          backdrop-filter: blur(8px);
          background: rgba(var(--bg-sidebar), 0.8);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mobile-hamburger-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-main);
          cursor: pointer;
        }

        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-main);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .theme-toggle-btn, .header-notifications-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s;
        }

        .theme-toggle-btn:hover, .header-notifications-btn:hover {
          background: var(--border-light);
          color: var(--text-main);
        }

        .header-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: var(--danger-color);
          color: white;
          font-size: 8px;
          font-weight: bold;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-profile-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }

        .profile-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-main);
        }

        .app-content-body {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .modal-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 25px var(--shadow-color);
          animation: scaleUp 0.2s ease;
        }

        .modal-card h3 {
          margin-bottom: 8px;
          font-size: 18px;
        }

        .modal-card p {
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 24px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-danger {
          background: var(--danger-color);
          color: white;
        }
        .btn-danger:hover {
          background: #dc2626;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Screen Size Adaptations */
        .desktop-only {
          display: flex;
        }

        @media (max-width: 1024px) {
          /* Tablet View */
          .app-sidebar {
            width: 78px;
          }
          .app-sidebar .nav-label, 
          .app-sidebar .sidebar-wallet-card, 
          .app-sidebar .collapse-btn {
            display: none !important;
          }
          .app-main-wrapper {
            margin-left: 78px !important;
          }
        }

        @media (max-width: 768px) {
          /* Mobile View */
          .desktop-only {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: block;
          }
          .app-sidebar {
            transform: translateX(-100%);
            width: 260px !important;
          }
          .app-sidebar.mobile-open {
            transform: translateX(0);
          }
          .app-sidebar .nav-label {
            display: block !important;
          }
          .app-sidebar .sidebar-wallet-card {
            display: flex !important;
            opacity: 1 !important;
            max-height: 200px !important;
            padding: 16px !important;
            margin: 16px !important;
          }
          .app-main-wrapper {
            margin-left: 0 !important;
          }
          .mobile-sidebar-backdrop {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            z-index: 95;
          }
          .app-header {
            padding: 0 16px;
          }
          .app-content-body {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
