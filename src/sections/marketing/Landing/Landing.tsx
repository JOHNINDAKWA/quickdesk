import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiCpu,
  FiShield,
  FiSmile,
  FiZap,
  FiBarChart2,
} from "react-icons/fi";
import "./Landing.css";
import Analytics_Two from "../../../assets/images/analytics-more.jpg"
import Analytics from "../../../assets/images/analytics-light.jpg"
import Analytics_Three from "../../../assets/images/analytics-dark.jpg"
import MarketingPricing from "../Pricing/Pricing";

export default function Landing() {
  const [org, setOrg] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const last = localStorage.getItem("qd_last_org") || "";
    setOrg(last || "acme");
  }, []);

  function goto(path: "portal" | "console") {
    if (!org) return;
    nav(`/${org}/${path}`);
  }

  return (
    <div className="mk-landing">
      {/* ============= HERO ============= */}
      <section className="mk-section mk-hero">
        <div className="mk-hero__copy">
          <h1 className="mk-hero__title">
            The modern, multi-tenant <span>Helpdesk</span>
          </h1>
          <p className="mk-hero__sub">
            QuickDesk unifies admins, agents, and requesters in a single, fast
            interface — with tenant-aware URLs, beautiful themes, and analytics
            built in.
          </p>

          {/* CTA with org slug */}
          <div className="mk-hero__cta">
            <div className="mk-slug">
              <label htmlFor="mk-hero-org">Your org</label>
              <div className="mk-slug__input">
                <span>@</span>
                <input
                  id="mk-hero-org"
                  value={org}
                  onChange={(e) =>
                    setOrg(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9-]+/g, "-")
                    )
                  }
                  placeholder="your-org"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="mk-hero__buttons">
              <button className="mk-btn mk-btn--primary" onClick={() => goto("portal")}>
                Try Portal <FiArrowRight />
              </button>
              <button className="mk-btn" onClick={() => goto("console")}>
                Open Console
              </button>
              <Link className="mk-btn" to="/admin">
                SuperAdmin
              </Link>
            </div>
            <small className="mk-hero__hint">
              We’ll open <code>/{org || "your-org"}/portal</code> or{" "}
              <code>/{org || "your-org"}/console</code>.
            </small>
          </div>

          {/* Trusted logos (swap as you like) */}
          <div className="mk-logos">
            <img
              src="https://bcassetcdn.com/public/blog/wp-content/uploads/2019/10/18094202/tech-trends.png"
              alt=""
            />
            <img
              src="https://macromate-blush.vercel.app/assets/cloves-fxdVByd6.png"
              alt=""
            />
            <img
              src="https://cdn.theorg.com/fbda2622-94f9-4102-bd6f-6a1c91796026_medium.jpg"
              alt=""
            />
          </div>
        </div>

        <div className="mk-hero__media">
          <div className="mk-device">
            <img
              src="/marketing/hero.jpg"
              onError={(e) =>
                (e.currentTarget.src =
                  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop")
              }
              alt="QuickDesk overview"
            />
          </div>
        </div>
      </section>

      {/* ============= VALUE PROPS ============= */}
      <section className="mk-section mk-values">
        <div className="mk-values__grid">
          <ValueCard
            icon={<FiZap />}
            title="Lightning-fast UI"
            desc="Vite + React with clean, accessible components and crisp themes."
          />
          <ValueCard
            icon={<FiShield />}
            title="Tenant & RBAC ready"
            desc="Org-scoped routing, roles, and an audit trail from day one."
          />
          <ValueCard
            icon={<FiCpu />}
            title="Prisma + Postgres"
            desc="A schema-first backend you can trust. Row-level security ready."
          />
          <ValueCard
            icon={<FiBarChart2 />}
            title="Analytics that matter"
            desc="SLA, CSAT, FRT, categories, channels — export or share live."
          />
          <ValueCard
            icon={<FiSmile />}
            title="Loved by teams"
            desc="Keyboard-first workflows for agents, and a calm portal for users."
          />
          <ValueCard
            icon={<FiCheck />}
            title="Built to extend"
            desc="Integrations, webhooks, macros, and custom themes per tenant."
          />
        </div>
      </section>

      {/* ============= SHOWCASE 1 ============= */}
      <section className="mk-section mk-split">
        <div className="mk-split__media">
          <div className="mk-device">
            <img
              src={Analytics}
              onError={(e) =>
                (e.currentTarget.src =
                  "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1600&auto=format&fit=crop")
              }
              alt="Agent Console"
            />
          </div>
        </div>
        <div className="mk-split__copy">
          <h2 className="mk-h2">Agent Console</h2>
          <p className="mk-lead">
            Queues, macros, collision detection, and fast triage — built for
            teams that live in the inbox.
          </p>
          <ul className="mk-bullets">
            <li>Smart queues & assignment</li>
            <li>Macros & canned replies</li>
            <li>Internal notes and mentions</li>
            <li>Keyboard-first navigation</li>
          </ul>
          <div className="mk-inlinecta">
            <button className="mk-btn mk-btn--primary" onClick={() => goto("console")}>
              Open Console <FiArrowRight />
            </button>
          </div>
        </div>
      </section>

      <section className="mk-section">
  <MarketingPricing />
</section>

      {/* ============= SHOWCASE 2 ============= */}
      <section className="mk-section mk-split mk-split--alt">
        <div className="mk-split__copy">
          <h2 className="mk-h2">Customer Portal</h2>
          <p className="mk-lead">
            A calm place to request help, track progress, and find answers — on
            any device.
          </p>
          <ul className="mk-bullets">
            <li>Authenticated or public forms</li>
            <li>Attachments & rich fields</li>
            <li>Knowledge base ready</li>
            <li>Status updates & email sync</li>
          </ul>
          <div className="mk-inlinecta">
            <button className="mk-btn" onClick={() => goto("portal")}>
              Try Portal
            </button>
          </div>
        </div>
        <div className="mk-split__media">
          <div className="mk-device">
            <img
              src={Analytics_Two}
              onError={(e) =>
                (e.currentTarget.src =
                  "https://images.unsplash.com/photo-1551281044-8f3534a35f6c?q=80&w=1600&auto=format&fit=crop")
              }
              alt="Customer Portal"
            />
          </div>
        </div>
      </section>

      {/* ============= SHOWCASE 3 ============= */}
      <section className="mk-section mk-split">
        <div className="mk-split__media">
          <div className="mk-device">
            <img
              src={Analytics_Three}
              onError={(e) =>
                (e.currentTarget.src =
                  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1600&auto=format&fit=crop")
              }
              alt="Analytics"
            />
          </div>
        </div>
        <div className="mk-split__copy">
          <h2 className="mk-h2">Analytics, not noise</h2>
          <p className="mk-lead">
            See volumes, SLA, CSAT, categories, channels and agent performance.
            Export CSV or share live views with stakeholders.
          </p>
          <ul className="mk-bullets">
            <li>Tickets over time with compare</li>
            <li>First response & resolution trends</li>
            <li>Channel & category breakdowns</li>
            <li>Agent leaderboard</li>
          </ul>
        </div>
      </section>

      {/* ============= QUOTE ============= */}
      <section className="mk-section mk-quote">
        <blockquote>
          “We switched to QuickDesk and cut our first response time by 43% in a
          month. Agents love it.”
        </blockquote>
        <div className="mk-quote__meta">
          <img
            src="https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?q=80&w=200&auto=format&fit=crop"
            alt=""
          />
          <div>
            <div className="mk-quote__name">Amina Odhiambo</div>
            <div className="mk-quote__role">Support Lead, Jua Kali Innovations</div>
          </div>
        </div>
      </section>

      {/* ============= FINAL CTA ============= */}
      <section className="mk-section mk-final panel">
        <h3>Ready to try it with your org?</h3>
        <div className="mk-final__ctas">
          <button className="mk-btn mk-btn--primary" onClick={() => goto("portal")}>
            Open Portal
          </button>
          <button className="mk-btn" onClick={() => goto("console")}>
            Open Console
          </button>
          <Link className="mk-btn" to="/admin">
            SuperAdmin
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ---- tiny helper card ---- */
function ValueCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <article className="mk-value">
      <div className="mk-value__icon">{icon}</div>
      <h3 className="mk-value__title">{title}</h3>
      <p className="mk-value__desc">{desc}</p>
    </article>
  );
}
