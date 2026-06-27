"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const errorParam = searchParams.get("error");
  const registeredParam = searchParams.get("registered");

  useEffect(() => {
    if (errorParam === "CredentialsSignin") {
      setErrorMsg("Invalid email or password.");
    } else if (errorParam === "Unauthorized") {
      setErrorMsg("Access Denied: You do not have permissions for that area.");
    } else if (errorParam) {
      setErrorMsg("An error occurred during authentication.");
    }
    if (registeredParam === "true") {
      setSuccessMsg("Account created! Please sign in with your new credentials.");
    }
  }, [errorParam, registeredParam]);

  // Redirect if session is already active
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "SUB_ADMIN") router.push("/subadmin");
      else if (role === "MANAGER") router.push("/manager");
      else if (role === "DELIVERY_PERSON") router.push("/delivery");
      else if (role === "CUSTOMER") router.push("/customer");
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg("Invalid email or password.");
        setLoading(false);
      } else {
        // Successful login, router will redirect based on the useEffect above
        router.refresh();
      }
    } catch (err) {
      setErrorMsg("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="login-loading">
        <div className="spinner"></div>
        <p>Checking authentication status...</p>
        <style jsx>{`
          .login-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: var(--cream);
          }
          .spinner {
            border: 4px solid var(--border);
            border-top: 4px solid var(--green);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <Link href="/" className="logo">
            <span className="logo-icon">🥛</span>
            <span className="logo-text">Bhagwati <span className="logo-accent">Enterprise</span></span>
          </Link>
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to manage your dairy dashboard</p>
        </div>

        {successMsg && <div className="success-alert">{successMsg}</div>}
        {errorMsg && <div className="error-alert">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="e.g. customer@bhagwati.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>


        <div className="login-register-link">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="link">Register</Link>
          </p>
        </div>

      </div>

      <style jsx>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--cream) 60%, var(--green-light) 100%);
          padding: 20px;
        }
        .login-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 40px;
          max-width: 450px;
          width: 100%;
          box-shadow: var(--shadow-premium);
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .logo-icon {
          font-size: 24px;
        }
        .logo-text {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 20px;
        }
        .logo-accent {
          color: var(--green);
        }
        h2 {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .subtitle {
          font-size: 14px;
          color: var(--muted);
        }
        .error-alert {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          margin-bottom: 24px;
          font-weight: 500;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          margin-top: 10px;
        }
        .success-alert {
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #166534;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          margin-bottom: 24px;
          font-weight: 500;
        }
        .login-register-link {
          text-align: center;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-light);
          font-size: 14px;
          color: var(--muted);
        }
        .link {
          color: var(--green);
          font-weight: 600;
          text-decoration: none;
        }
        .link:hover { text-decoration: underline; }

      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
