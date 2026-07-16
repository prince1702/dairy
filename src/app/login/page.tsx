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
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
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
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-input-wrapper .form-input {
          padding-right: 48px;
        }
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: color 0.2s, background-color 0.2s;
        }
        .password-toggle-btn:hover {
          color: var(--green);
          background-color: var(--green-light);
        }
        .password-toggle-btn:focus {
          outline: 2px solid var(--green);
          outline-offset: -2px;
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
