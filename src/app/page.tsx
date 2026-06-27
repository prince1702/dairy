"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Homepage() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDashboardUrl = () => {
    if (!session?.user) return "/login";
    const role = (session.user as any).role;
    if (role === "ADMIN") return "/admin";
    if (role === "SUB_ADMIN") return "/subadmin";
    if (role === "MANAGER") return "/manager";
    if (role === "DELIVERY_PERSON") return "/delivery";
    return "/customer";
  };

  const dashboardUrl = getDashboardUrl();

  return (
    <>
      {/* NAVBAR */}
      <nav id="navbar" className={scrolled ? "scrolled" : ""}>
        <a href="#hero" className="nav-logo">
          <div className="nav-logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2C11 2 5 7 5 12.5C5 15.538 7.686 18 11 18C14.314 18 17 15.538 17 12.5C17 7 11 2 11 2Z" fill="white" opacity="0.9"/>
              <circle cx="11" cy="12.5" r="2.5" fill="#1A6B3C"/>
              <path d="M8 8C8 8 6 10 6 12" stroke="white" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <div className="nav-logo-text">Bhagwati Enterprise</div>
            <div className="nav-logo-sub">Fresh Dairy Delivered</div>
          </div>
        </a>
        <ul className="nav-links">
          <li><a href="#hero">Home</a></li>
          <li><a href="#products">Products</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#plans">Plans</a></li>
          <li><a href="#cta">Contact</a></li>
          {session ? (
            <li>
              <Link href={dashboardUrl} className="nav-cta">
                Dashboard ({session?.user?.name?.split(" ")[0] || "User"})
              </Link>
            </li>
          ) : (
            <li>
              <Link href="/login" className="nav-cta">
                Get Started
              </Link>
            </li>
          )}
        </ul>
        <button 
          className={`hamburger ${mobileMenuOpen ? "open" : ""}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <a href="#hero" onClick={() => setMobileMenuOpen(false)}>Home</a>
        <a href="#products" onClick={() => setMobileMenuOpen(false)}>Products</a>
        <a href="#how" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
        <a href="#plans" onClick={() => setMobileMenuOpen(false)}>Plans</a>
        <a href="#cta" onClick={() => setMobileMenuOpen(false)}>Contact</a>
        <Link href={dashboardUrl} className="m-cta" onClick={() => setMobileMenuOpen(false)}>
          {session ? "Dashboard" : "Get Started"}
        </Link>
      </div>

      {/* HERO */}
      <section id="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <div className="hero-badge-dot"></div>
              🔔 Silent Delivery — No doorbell needed
            </div>
            <h1 className="hero-title">
              Fresh Dairy,<br />
              Delivered <span className="accent">Silently</span><br />
              Every Morning
            </h1>
            <p className="hero-sub">Subscribe once. We deliver daily. You sleep peacefully — and wake up to fresh milk at your doorstep.</p>
            <div className="hero-actions">
              <Link href={dashboardUrl} className="btn-primary">
                Subscribe Now
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </Link>
              <a href="#how" className="btn-ghost">How It Works</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="phone-status">
                  <div className="phone-status-top">
                    <span>9:41</span>
                    <span>●●● 📶 🔋</span>
                  </div>
                  <div className="phone-greeting">Good Morning,</div>
                  <div className="phone-name">Ramesh bhai 👋</div>
                </div>
                <div className="phone-body">
                  <div className="phone-wallet-card">
                    <div className="phone-wallet-label">WALLET BALANCE</div>
                    <div className="phone-wallet-balance">₹ 840</div>
                    <div className="phone-wallet-row">
                      <span>Last deducted: ₹42</span>
                      <span>Next: Tomorrow</span>
                    </div>
                  </div>
                  <div className="phone-section-title">Today's Delivery</div>
                  <div className="phone-delivery-item">
                    <div className="phone-delivery-icon">🥛</div>
                    <div>
                      <div className="phone-delivery-name">Full Cream Milk</div>
                      <div className="phone-delivery-qty">1 Liter</div>
                    </div>
                    <div className="phone-delivery-status">✓ Delivered</div>
                  </div>
                  <div className="phone-delivery-item">
                    <div className="phone-delivery-icon">🍶</div>
                    <div>
                      <div className="phone-delivery-name">Fresh Curd</div>
                      <div className="phone-delivery-qty">200g</div>
                    </div>
                    <div className="phone-delivery-status">✓ Delivered</div>
                  </div>
                  <div className="phone-notif">
                    <div className="phone-notif-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3 3.5.5-2.5 2.5.6 3.5L7 9l-3.1 1.5.6-3.5L2 4.5l3.5-.5z" fill="white"/></svg>
                    </div>
                    <div className="phone-notif-text">
                      <div className="phone-notif-title">✅ Delivery Complete!</div>
                      <div className="phone-notif-body">Your milk was delivered at 6:12 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-card">
              <div className="floating-card-dot"></div>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>500+ Happy Families</span>
            </div>
            <div className="floating-card-2">
              ⏰ 6 AM Every Day
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div id="stats">
        <div className="stats-inner">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Happy Customers</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">6 AM</div>
            <div className="stat-label">Daily Delivery Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Fresh Products</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">15+</div>
            <div className="stat-label">Delivery Routes</div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="container">
          <div className="section-header centered">
            <div className="section-eyebrow">Simple Process</div>
            <h2 className="section-title">Three Steps to Fresh Dairy Daily</h2>
            <p className="section-sub">Getting started takes minutes. Staying stocked takes no effort at all.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon-wrap">
                <span style={{ fontSize: "26px" }}>💰</span>
                <div className="step-number">1</div>
              </div>
              <h3 className="step-title">Register & Add Wallet</h3>
              <p className="step-desc">Create your account in minutes and recharge your digital wallet. No minimum balance — pay as you need.</p>
            </div>
            <div className="step-card">
              <div className="step-icon-wrap">
                <span style={{ fontSize: "26px" }}>📅</span>
                <div className="step-number">2</div>
              </div>
              <h3 className="step-title">Set Your Daily Schedule</h3>
              <p className="step-desc">Choose your products and set recurring delivery quantities. Modify anytime before the daily cutoff.</p>
            </div>
            <div className="step-card">
              <div className="step-icon-wrap">
                <span style={{ fontSize: "26px" }}>🔔</span>
                <div className="step-number">3</div>
              </div>
              <h3 className="step-title">We Deliver, You're Notified</h3>
              <p className="step-desc">Your milk arrives silently each morning. You get an instant notification the moment it's delivered.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" style={{ background: "var(--cream)" }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-eyebrow">Our Products</div>
            <h2 className="section-title">Farm Fresh, Every Morning</h2>
            <p className="section-sub">All products sourced fresh daily. Subscribe to any or all — we deliver them together.</p>
          </div>
          <div className="products-grid">
            <div className="product-card">
              <span className="product-emoji">🥛</span>
              <div className="product-name">Toned Milk</div>
              <div className="product-size">500 ml</div>
              <div className="product-price">₹28 <span>/ packet</span></div>
              <Link href={dashboardUrl} className="product-btn" style={{ display: "block", textAlign: "center" }}>Subscribe</Link>
            </div>
            <div className="product-card">
              <span className="product-emoji">🍼</span>
              <div className="product-name">Full Cream Milk</div>
              <div className="product-size">1 Liter</div>
              <div className="product-price">₹52 <span>/ packet</span></div>
              <Link href={dashboardUrl} className="product-btn" style={{ display: "block", textAlign: "center" }}>Subscribe</Link>
            </div>
            <div className="product-card">
              <span className="product-emoji">🫙</span>
              <div className="product-name">Fresh Curd</div>
              <div className="product-size">200g</div>
              <div className="product-price">₹32 <span>/ unit</span></div>
              <Link href={dashboardUrl} className="product-btn" style={{ display: "block", textAlign: "center" }}>Subscribe</Link>
            </div>
            <div className="product-card">
              <span className="product-emoji">🧀</span>
              <div className="product-name">Fresh Paneer</div>
              <div className="product-size">200g</div>
              <div className="product-price">₹80 <span>/ unit</span></div>
              <Link href={dashboardUrl} className="product-btn" style={{ display: "block", textAlign: "center" }}>Subscribe</Link>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="plans">
        <div className="container">
          <div className="section-header centered">
            <div className="section-eyebrow">Subscription Plans</div>
            <h2 className="section-title">Choose How You Want to Subscribe</h2>
            <p className="section-sub">All plans use your prepaid wallet — no separate payments after setup.</p>
          </div>
          <div className="plans-grid">
            <div className="plan-card">
              <div className="plan-name">Daily Plan</div>
              <div className="plan-desc">Perfect flexibility — adjust your order each day before the delivery cutoff.</div>
              <ul className="plan-features">
                <li>Pay per delivery, auto-deducted</li>
                <li>Modify quantity anytime</li>
                <li>Pause or skip any day</li>
                <li>Instant delivery notifications</li>
              </ul>
              <Link href={dashboardUrl} className="plan-cta" style={{ display: "block" }}>Choose Daily</Link>
            </div>
            <div className="plan-card featured">
              <div className="plan-badge">⭐ Most Popular</div>
              <div className="plan-name">Monthly Plan</div>
              <div className="plan-desc">Set your monthly schedule once and never think about it again. Best value.</div>
              <ul className="plan-features">
                <li>Full month delivery — set and forget</li>
                <li>One-time schedule setup</li>
                <li>Modify with 24hr notice</li>
                <li>Priority delivery slot</li>
                <li>Monthly wallet statement</li>
              </ul>
              <Link href={dashboardUrl} className="plan-cta" style={{ display: "block" }}>Choose Monthly</Link>
            </div>
            <div className="plan-card">
              <div className="plan-name">Weekly Plan</div>
              <div className="plan-desc">Set your week's schedule every Sunday. Good balance of structure and flexibility.</div>
              <ul className="plan-features">
                <li>Weekly schedule setup</li>
                <li>Modify within the week</li>
                <li>Pause or resume anytime</li>
                <li>Instant delivery notifications</li>
              </ul>
              <Link href={dashboardUrl} className="plan-cta" style={{ display: "block" }}>Choose Weekly</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SILENT DELIVERY */}
      <section id="silent" style={{ background: "var(--green)" }}>
        <div className="silent-inner">
          <div>
            <div className="section-eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>Silent Delivery Feature</div>
            <h2 className="silent-title">We Deliver While You Sleep</h2>
            <p className="silent-sub">No doorbell. No noise. Just a notification on your phone the moment your milk arrives — so you can stay in bed a little longer.</p>
            <ul className="silent-checklist">
              <li>
                <div className="check-icon">✓</div>
                Instant notification when delivered
              </li>
              <li>
                <div className="check-icon">✓</div>
                Exact delivery timestamp recorded
              </li>
              <li>
                <div className="check-icon">✓</div>
                No disturbance during early morning hours
              </li>
              <li>
                <div className="check-icon">✓</div>
                Delivery proof always available
              </li>
            </ul>
          </div>
          <div className="silent-phone">
            <div className="notif-preview">
              <div className="notif-app-bar">
                <div className="notif-app-icon">🥛</div>
                <span>Bhagwati Enterprise</span>
                <span style={{ marginLeft: "auto" }}>Now</span>
              </div>
              <div className="notif-card">
                <div className="notif-card-title">✅ Delivery Complete!</div>
                <div className="notif-card-body">Your 1L Full Cream Milk has been delivered at your doorstep.</div>
                <div className="notif-time">6:12 AM • Today</div>
              </div>
              <div style={{ margin: "16px 0 12px", fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Delivery Timeline</div>
              <div className="notif-timeline">
                <div className="notif-step">
                  <div className="notif-step-dot done"></div>
                  Order confirmed for today
                </div>
                <div className="notif-step">
                  <div className="notif-step-dot done"></div>
                  Delivery person assigned — 5:40 AM
                </div>
                <div className="notif-step">
                  <div className="notif-step-dot done"></div>
                  Out for delivery — 5:58 AM
                </div>
                <div className="notif-step">
                  <div className="notif-step-dot done"></div>
                  Delivered — 6:12 AM ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WALLET */}
      <section id="wallet">
        <div className="wallet-inner">
          <div>
            <div className="section-eyebrow">Wallet System</div>
            <h2 className="section-title">Your Balance, Always in Control</h2>
            <p className="section-sub" style={{ marginBottom: "36px" }}>A simple prepaid wallet means no cash at the door, no monthly invoices — just seamless daily delivery.</p>
            <div className="wallet-flow">
              <div className="wallet-step">
                <div className="wallet-step-num">1</div>
                <div className="wallet-step-content">
                  <div className="wallet-step-title">Recharge Your Wallet</div>
                  <div className="wallet-step-desc">Add balance via UPI or bank transfer. Upload screenshot — manager verifies within hours.</div>
                </div>
              </div>
              <div className="wallet-step">
                <div className="wallet-step-num">2</div>
                <div className="wallet-step-content">
                  <div className="wallet-step-title">Set Your Delivery Schedule</div>
                  <div className="wallet-step-desc">Choose products, quantities, and frequency. Set once, runs automatically.</div>
                </div>
              </div>
              <div className="wallet-step">
                <div className="wallet-step-num">3</div>
                <div className="wallet-step-content">
                  <div className="wallet-step-title">Auto-Deduction After Delivery</div>
                  <div className="wallet-step-desc">After each delivery is confirmed, the amount is automatically deducted. Full transparency always.</div>
                </div>
              </div>
            </div>
            <div className="wallet-cta-wrap">
              <Link href={dashboardUrl} className="btn-primary">Manage Your Wallet</Link>
            </div>
          </div>
          <div>
            <div className="wallet-card-preview">
              <div className="wc-label">WALLET BALANCE</div>
              <div className="wc-balance">₹840</div>
              <div className="wc-row">
                <div>
                  <div className="wc-item-label">Last Deducted</div>
                  <div className="wc-item-value">₹42.00</div>
                </div>
                <div>
                  <div className="wc-item-label">Next Delivery</div>
                  <div className="wc-item-value">Tomorrow, 6 AM</div>
                </div>
              </div>
            </div>
            <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px", marginTop: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Recent Transactions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                  <div><span style={{ fontWeight: 600 }}>Milk 1L + Curd</span><br /><span style={{ color: "var(--muted)", fontSize: "12px" }}>Today, 6:12 AM</span></div>
                  <div style={{ color: "#dc2626", fontWeight: 700 }}>-₹84</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  <div><span style={{ fontWeight: 600 }}>Wallet Recharge</span><br /><span style={{ color: "var(--muted)", fontSize: "12px" }}>Yesterday, 3:20 PM</span></div>
                  <div style={{ color: "#16a34a", fontWeight: 700 }}>+₹500</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  <div><span style={{ fontWeight: 600 }}>Milk 1L</span><br /><span style={{ color: "var(--muted)", fontSize: "12px" }}>Yesterday, 6:08 AM</span></div>
                  <div style={{ color: "#dc2626", fontWeight: 700 }}>-₹52</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "32px", height: "32px", background: "rgba(255,255,255,0.15)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <path d="M11 2C11 2 5 7 5 12.5C5 15.538 7.686 18 11 18C14.314 18 17 15.538 17 12.5C17 7 11 2 11 2Z" fill="white" opacity="0.8" />
                  </svg>
                </div>
                <div className="footer-brand-name">Bhagwati Enterprise</div>
              </div>
              <div className="footer-brand-tagline">Fresh Milk. Every Morning. On Time.<br />Gujarat's most trusted dairy delivery platform.</div>
            </div>
            <div>
              <div className="footer-col-title">Quick Links</div>
              <ul className="footer-links">
                <li><a href="#hero">Home</a></li>
                <li><a href="#products">Products</a></li>
                <li><a href="#how">How It Works</a></li>
                <li><a href="#plans">Plans</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Portals</div>
              <ul className="footer-links">
                <li><Link href="/login">Customer Login</Link></li>
                <li><Link href="/login">Vendor Panel</Link></li>
                <li><Link href="/login">Manager Panel</Link></li>
                <li><Link href="/login">Delivery Login</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Contact</div>
              <ul className="footer-links">
                <li>Email: info@bhagwatidairy.in</li>
                <li>Phone: +91 63540 00000</li>
                <li>Address: Vasna, Ahmedabad</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-built">© 2026 Bhagwati Enterprise. All rights reserved.</div>
            <div>
              <Link href="/login" style={{ color: "#fff", fontWeight: "600" }}>Staff Portal</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* Custom Header Navbar Layout */
        nav#navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 0 5%;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(250,250,247,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(229,231,235,0.6);
          transition: box-shadow 0.3s, background 0.3s;
        }
        nav#navbar.scrolled {
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
          background: var(--white);
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text);
        }
        .nav-logo-icon {
          width: 36px; height: 36px;
          background: var(--green);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nav-logo-text {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
        }
        .nav-logo-sub {
          font-size: 10px;
          color: var(--muted);
          font-weight: 400;
          letter-spacing: 0.03em;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
        }
        .nav-links a {
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--green); }
        .nav-cta {
          background: var(--green);
          color: #fff !important;
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 14px !important;
          font-weight: 500 !important;
          transition: background 0.2s, transform 0.15s !important;
        }
        .nav-cta:hover { background: #145730 !important; transform: translateY(-1px); }

        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
          background: none;
          border: none;
        }
        .hamburger span {
          width: 24px; height: 2px;
          background: var(--text);
          border-radius: 2px;
          transition: 0.3s;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 68px; left: 0; right: 0;
          background: var(--white);
          border-bottom: 1px solid var(--border);
          padding: 20px 5% 24px;
          flex-direction: column;
          gap: 16px;
          z-index: 99;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          color: var(--text);
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }
        .mobile-menu .m-cta {
          background: var(--green);
          color: #fff;
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          margin-top: 4px;
          border: none;
          font-weight: 600;
        }

        /* Sections base */
        section { padding: 100px 5% 80px; }

        /* Hero */
        #hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: 100px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--cream) 55%, #d4eddf 100%);
        }
        .hero-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          width: 100%;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--amber-light);
          border: 1px solid #f5c86b;
          color: #7a4f00;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 40px;
          margin-bottom: 24px;
        }
        .hero-badge-dot { width: 8px; height: 8px; background: var(--amber); border-radius: 50%; }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 54px);
          font-weight: 800;
          line-height: 1.12;
          color: var(--text);
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }
        .hero-title .accent { color: var(--green); }
        .hero-sub {
          font-size: 18px;
          color: var(--muted);
          margin-bottom: 36px;
          line-height: 1.65;
          max-width: 480px;
        }
        .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
        .btn-primary {
          background: var(--green);
          color: #white;
          padding: 14px 28px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 15px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: #145730; transform: translateY(-2px); }
        .btn-ghost {
          background: transparent;
          color: var(--green);
          padding: 14px 28px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 15px;
          border: 2px solid var(--green);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-ghost:hover { background: var(--green-light); transform: translateY(-2px); }
        .hero-visual { display: flex; justify-content: center; align-items: center; position: relative; }

        /* Phone mockup */
        .phone-frame {
          width: 240px;
          background: var(--text);
          border-radius: 36px;
          padding: 12px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
          position: relative;
        }
        .phone-screen {
          background: #f0faf5;
          border-radius: 28px;
          overflow: hidden;
          height: 460px;
          display: flex;
          flex-direction: column;
        }
        .phone-status { background: var(--green); padding: 14px 16px 10px; color: #fff; }
        .phone-status-top { display: flex; justify-content: space-between; font-size: 11px; opacity: 0.85; margin-bottom: 14px; }
        .phone-greeting { font-size: 12px; opacity: 0.85; }
        .phone-name { font-size: 16px; font-weight: 700; font-family: var(--font-display); }
        .phone-body { padding: 14px; flex: 1; display: flex; flex-direction: column; }
        .phone-wallet-card { background: var(--green); border-radius: 14px; padding: 14px; color: #fff; margin-bottom: 12px; }
        .phone-wallet-label { font-size: 10px; opacity: 0.75; margin-bottom: 4px; }
        .phone-wallet-balance { font-size: 24px; font-weight: 700; }
        .phone-wallet-row { display: flex; justify-content: space-between; margin-top: 10px; font-size: 10px; opacity: 0.8; }
        .phone-section-title { font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 8px; text-transform: uppercase; }
        .phone-delivery-item { display: flex; align-items: center; gap: 10px; background: var(--white); border-radius: 10px; padding: 10px; margin-bottom: 8px; border: 1px solid var(--border); }
        .phone-delivery-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--green-light); display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .phone-delivery-name { font-size: 12px; font-weight: 600; }
        .phone-delivery-qty { font-size: 11px; color: var(--muted); }
        .phone-delivery-status { margin-left: auto; font-size: 10px; background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 20px; font-weight: 500; }
        .phone-notif { background: var(--white); border-radius: 14px; padding: 10px 12px; display: flex; gap: 10px; align-items: flex-start; border: 1px solid var(--border); box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-top: auto; }
        .phone-notif-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--green); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .phone-notif-text { font-size: 10px; line-height: 1.4; }
        .phone-notif-title { font-weight: 600; }
        .phone-notif-body { color: var(--muted); }
        .floating-card { position: absolute; right: -20px; top: 40px; background: var(--white); border-radius: 12px; padding: 12px 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); font-size: 12px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); }
        .floating-card-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; }
        .floating-card-2 { position: absolute; left: -30px; bottom: 60px; background: var(--amber); border-radius: 12px; padding: 10px 14px; box-shadow: 0 8px 24px rgba(245,166,35,0.3); font-size: 12px; color: #5a3600; font-weight: 600; }

        /* Stats Bar */
        #stats { background: var(--green); padding: 48px 5%; }
        .stats-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .stat-item { text-align: center; color: #fff; padding: 10px; border-right: 1px solid rgba(255,255,255,0.15); }
        .stat-item:last-child { border-right: none; }
        .stat-number { font-family: var(--font-display); font-size: 36px; font-weight: 800; margin-bottom: 6px; }
        .stat-label { font-size: 13px; opacity: 0.8; }

        /* Section Header */
        .section-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); margin-bottom: 12px; }
        .section-title { font-family: var(--font-display); font-size: 32px; font-weight: 700; color: var(--text); margin-bottom: 14px; }
        .section-sub { font-size: 16px; color: var(--muted); max-width: 560px; line-height: 1.6; }
        .section-header.centered { text-align: center; }
        .section-header.centered .section-sub { margin: 0 auto; }

        /* How it works */
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; position: relative; margin-top: 50px; }
        .step-card { text-align: center; position: relative; }
        .step-icon-wrap { width: 64px; height: 64px; border-radius: 50%; border: 3px solid var(--green); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; background: var(--white); position: relative; }
        .step-number { position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; background: var(--green); color: #fff; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .step-title { font-family: var(--font-display); font-size: 19px; font-weight: 700; margin-bottom: 10px; }
        .step-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }

        /* Products */
        .products-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 50px; }
        .product-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 20px; text-align: center; transition: all 0.2s; }
        .product-card:hover { transform: translateY(-4px); border-color: var(--green); box-shadow: 0 12px 32px rgba(26,107,60,0.08); }
        .product-emoji { font-size: 36px; margin-bottom: 14px; display: block; }
        .product-name { font-family: var(--font-display); font-size: 17px; font-weight: 700; margin-bottom: 4px; }
        .product-size { font-size: 13px; color: var(--muted); margin-bottom: 14px; }
        .product-price { font-size: 22px; font-weight: 700; color: var(--green); margin-bottom: 16px; }
        .product-price span { font-size: 13px; color: var(--muted); font-weight: 400; }
        .product-btn { width: 100%; padding: 10px; background: var(--green-light); color: var(--green); border: 1px solid rgba(26,107,60,0.2); border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .product-btn:hover { background: var(--green); color: #fff; }

        /* Plans */
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 50px; }
        .plan-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px 28px; position: relative; transition: all 0.2s; display: flex; flex-direction: column; }
        .plan-card:hover { transform: translateY(-4px); }
        .plan-card.featured { border-color: var(--green); box-shadow: 0 16px 48px rgba(26,107,60,0.1); }
        .plan-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--amber); color: #5a3600; font-size: 12px; font-weight: 700; padding: 4px 16px; border-radius: 40px; }
        .plan-name { font-family: var(--font-display); font-size: 20px; font-weight: 700; margin-bottom: 6px; }
        .plan-desc { font-size: 13px; color: var(--muted); margin-bottom: 24px; line-height: 1.5; }
        .plan-features { list-style: none; margin-bottom: 28px; flex: 1; }
        .plan-features li { font-size: 14px; padding: 8px 0; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 8px; }
        .plan-features li::before { content: '✓'; color: var(--green); font-weight: 700; }
        .plan-cta { display: block; width: 100%; padding: 12px; text-align: center; border-radius: var(--radius-sm); font-weight: 600; font-size: 14px; border: 2px solid var(--green); color: var(--green); background: transparent; transition: all 0.2s; }
        .plan-card.featured .plan-cta { background: var(--green); color: #fff; }
        .plan-cta:hover { background: var(--green); color: #fff; }

        /* Silent Delivery */
        .silent-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .silent-title { font-family: var(--font-display); font-size: 36px; font-weight: 800; color: #fff; margin-bottom: 16px; }
        .silent-sub { font-size: 16px; color: rgba(255,255,255,0.75); margin-bottom: 32px; }
        .silent-checklist { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .silent-checklist li { display: flex; align-items: center; gap: 10px; font-size: 15px; color: rgba(255,255,255,0.9); }
        .check-icon { width: 24px; height: 24px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #fff; font-weight: 700; }
        .silent-phone { display: flex; justify-content: center; }
        .notif-preview { background: rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; border: 1px solid rgba(255,255,255,0.12); width: 280px; }
        .notif-app-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 11px; color: rgba(255,255,255,0.6); }
        .notif-app-icon { width: 20px; height: 20px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; }
        .notif-card { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 12px; }
        .notif-card-title { font-weight: 700; color: #fff; font-size: 13px; margin-bottom: 2px; }
        .notif-card-body { font-size: 11px; color: rgba(255,255,255,0.8); line-height: 1.4; }
        .notif-time { font-size: 10px; color: rgba(255,255,255,0.5); text-align: right; margin-top: 6px; }
        .notif-timeline { display: flex; flex-direction: column; gap: 6px; }
        .notif-step { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); font-size: 12px; }
        .notif-step-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--amber); }
        .notif-step-dot.done { background: var(--success); }

        /* Wallet */
        .wallet-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .wallet-flow { display: flex; flex-direction: column; gap: 20px; }
        .wallet-step { display: flex; align-items: flex-start; gap: 16px; }
        .wallet-step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--green); color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .wallet-step-title { font-weight: 700; font-size: 16px; margin-bottom: 2px; }
        .wallet-step-desc { font-size: 13px; color: var(--muted); }
        .wallet-card-preview { background: linear-gradient(135deg, #1A6B3C 0%, #2d8a52 100%); border-radius: 20px; padding: 28px; color: #fff; position: relative; overflow: hidden; }
        .wc-label { font-size: 11px; opacity: 0.7; letter-spacing: 0.05em; margin-bottom: 4px; }
        .wc-balance { font-size: 36px; font-weight: 700; margin-bottom: 20px; }
        .wc-row { display: flex; justify-content: space-between; }
        .wc-item-label { font-size: 10px; opacity: 0.65; margin-bottom: 2px; }
        .wc-item-value { font-size: 14px; font-weight: 600; }
        .wallet-cta-wrap { margin-top: 28px; }

        /* Footer */
        footer { background: #0f3d22; color: rgba(255,255,255,0.7); padding: 56px 5% 32px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; }
        .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 28px; }
        .footer-brand-name { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: #fff; }
        .footer-brand-tagline { font-size: 13px; opacity: 0.7; line-height: 1.5; }
        .footer-col-title { font-size: 12px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-links a { text-decoration: none; font-size: 13px; color: rgba(255,255,255,0.6); transition: color 0.2s; }
        .footer-links a:hover { color: #fff; }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .footer-built { color: rgba(255,255,255,0.4); }

        /* Responsive Layouts */
        @media (max-width: 1024px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
        }

        @media (max-width: 768px) {
          nav#navbar { padding: 0 4%; }
          .nav-links { display: none; }
          .hamburger { display: flex; }
          .hero-inner { grid-template-columns: 1fr; text-align: center; gap: 40px; }
          .hero-sub { margin: 0 auto 36px; }
          .hero-actions { justify-content: center; }
          .hero-visual { order: -1; }
          .floating-card { display: none; }
          .floating-card-2 { display: none; }
          .phone-frame { width: 200px; }
          .phone-screen { height: 380px; }

          .stats-inner { grid-template-columns: repeat(2, 1fr); }
          .stat-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.15); }
          .stat-item:nth-child(3), .stat-item:last-child { border-bottom: none; }

          .steps-grid { grid-template-columns: 1fr; gap: 32px; }
          .products-grid { grid-template-columns: repeat(2, 1fr); }
          .plans-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
          .silent-inner { grid-template-columns: 1fr; gap: 40px; }
          .wallet-inner { grid-template-columns: 1fr; gap: 40px; }
          .footer-top { grid-template-columns: 1fr 1fr; gap: 24px; }
          .footer-bottom { flex-direction: column; text-align: center; gap: 10px; }
        }

        @media (max-width: 480px) {
          .products-grid { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr; }
          .stat-number { font-size: 28px; }
        }
      `}</style>
    </>
  );
}
