"use client";

import React from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface DashboardHeaderProps {
  role: string;
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="dashboard-header">
      <div className="header-brand">
        <Link href="/" className="logo">
          <span className="logo-icon">🥛</span>
          <span className="logo-text">Bhagwati <span className="logo-accent">Enterprise</span></span>
        </Link>
        <span className="badge role-badge">{role} Portal</span>
      </div>

      <div className="header-user">
        <span className="user-name">Welcome, {session?.user?.name || "User"}</span>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="btn btn-outline logout-btn">
          Sign Out
        </button>
      </div>

      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--white);
          border-bottom: 1px solid var(--border);
          padding: 16px 5%;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-icon {
          font-size: 20px;
        }
        .logo-text {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 18px;
          color: var(--text);
        }
        .logo-accent {
          color: var(--green);
        }
        .role-badge {
          background: var(--green-light);
          color: var(--green);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .header-user {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }
        .logout-btn {
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 6px;
        }

        @media (max-width: 600px) {
          .dashboard-header {
            flex-direction: column;
            gap: 12px;
            padding: 12px 16px;
            align-items: center;
          }
          .header-brand {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header-user {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid var(--border-light);
            padding-top: 10px;
          }
        }
      `}</style>
    </header>
  );
}
