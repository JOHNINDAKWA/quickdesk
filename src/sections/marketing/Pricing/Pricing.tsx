import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiArrowRight, FiInfo } from "react-icons/fi";
import "./Pricing.css";

type Billing = "monthly" | "yearly";

type Tier = {
  id: string;
  name: string;
  blurb: string;
  priceMonthly: number; // per agent / month, USD (edit as needed)
  priceYearly?: number; // will default to monthly * 10 if undefined
  limits?: string[];
  features: string[];
  highlight?: boolean;
  badge?: string;
  ctaLabel?: string;
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    blurb: "Get started fast for small teams.",
    priceMonthly: 0,
    limits: ["Up to 2 agents", "Community support"],
    features: ["Basic ticketing", "Email channel", "Simple SLA", "Portal forms"],
    ctaLabel: "Start Free",
  },
  {
    id: "standard",
    name: "Standard",
    blurb: "Everything you need to run support.",
    priceMonthly: 29,
    highlight: true,
    badge: "Most popular",
    limits: ["Unlimited agents", "Standard email support"],
    features: [
      "Queues & assignment",
      "Macros & canned replies",
      "Internal notes & mentions",
      "Basic analytics dashboard",
      "Portal customization",
      "Integrations API",
    ],
    ctaLabel: "Choose Standard",
  },
  {
    id: "premium",
    name: "Premium",
    blurb: "Advanced automation & reporting.",
    priceMonthly: 59,
    limits: ["Unlimited agents", "Priority support"],
    features: [
      "SLA policies + breaches",
      "Collision detection",
      "Advanced analytics & exports",
      "Custom fields & forms",
      "Webhooks & automations",
      "SSO / SAML (optional)",
    ],
    ctaLabel: "Choose Premium",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "Security, scale, and success.",
    priceMonthly: 0, // shown as Custom
    priceYearly: 0,
    limits: ["Unlimited agents", "24/7 support & SLO"],
    features: [
      "Dedicated environment",
      "Custom data retention",
      "Advanced RBAC",
      "Onboarding & migration",
      "Enterprise SSO",
      "Security review & DPA",
    ],
    ctaLabel: "Contact Sales",
  },
];

export default function MarketingPricing() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [org, setOrg] = useState("acme");
  const nav = useNavigate();

  useEffect(() => {
    const last = localStorage.getItem("qd_last_org") || "";
    if (last) setOrg(last);
  }, []);

  function priceFor(tier: Tier) {
    if (tier.id === "enterprise") return null; // custom
    const m = tier.priceMonthly;
    const y = tier.priceYearly ?? m * 10; // 2 months free
    return billing === "monthly" ? m : y;
  }

  const prettyBilling = billing === "monthly" ? "/agent/mo" : "/agent/yr";

  const tiers = useMemo(() => TIERS, []);

  function handleChoose(tierId: string) {
    if (tierId === "enterprise") {
      window.location.href = "mailto:sales@quickdesk.com?subject=QuickDesk%20Enterprise";
      return;
    }
    // For now, take them to their portal (you can wire to checkout later)
    nav(`/${org || "acme"}/portal`);
  }

  return (
    <section className="mk-pricing" id="pricing">
      <header className="mk-pricing__head">
        <h2 className="mk-pricing__title">Simple, transparent pricing</h2>
        <p className="mk-pricing__sub">
          Seat-based plans with everything you need to support your customers. Switch anytime.
        </p>

        <div className="mk-billing" role="group" aria-label="Billing period">
          <button
            className={`mk-billing__btn ${billing === "monthly" ? "is-active" : ""}`}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            className={`mk-billing__btn ${billing === "yearly" ? "is-active" : ""}`}
            onClick={() => setBilling("yearly")}
            aria-label="Yearly (2 months free)"
            title="2 months free"
          >
            Yearly <span className="mk-badge mk-badge--deal">2 months free</span>
          </button>
        </div>
      </header>

      <div className="mk-pricing__grid">
        {tiers.map((t) => {
          const price = priceFor(t);
          return (
            <article
              key={t.id}
              className={`mk-tier panel ${t.highlight ? "is-popular" : ""}`}
              aria-label={`${t.name} plan`}
            >
              {t.badge && <div className="mk-tier__badge">{t.badge}</div>}

              <header className="mk-tier__head">
                <h3 className="mk-tier__name">{t.name}</h3>
                <p className="mk-tier__blurb">{t.blurb}</p>
              </header>

              <div className="mk-tier__price">
                {t.id === "enterprise" ? (
                  <span className="mk-tier__custom">Custom</span>
                ) : (
                  <>
                    <span className="mk-tier__currency">$</span>
                    <span className="mk-tier__amount">{price}</span>
                    <span className="mk-tier__unit">{prettyBilling}</span>
                  </>
                )}
              </div>

              {!!t.limits?.length && (
                <ul className="mk-tier__limits">
                  {t.limits.map((l) => (
                    <li key={l}>
                      <FiInfo /> {l}
                    </li>
                  ))}
                </ul>
              )}

              <ul className="mk-tier__features">
                {t.features.map((f) => (
                  <li key={f}>
                    <FiCheck /> {f}
                  </li>
                ))}
              </ul>

              <div className="mk-tier__cta">
                <button
                  className={`mk-btn ${t.highlight ? "mk-btn--primary" : ""}`}
                  onClick={() => handleChoose(t.id)}
                >
                  {t.ctaLabel || "Choose plan"} <FiArrowRight />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="mk-pricing__foot">
        <div className="mk-note">
          Prices shown in USD (per agent). Taxes may apply. You can change plans or cancel anytime.
        </div>
        <div className="mk-faqhint">
          Need procurement docs, a quote, or MSA?{" "}
          <a href="mailto:sales@quickdesk.com">Contact sales</a>.
        </div>
      </footer>
    </section>
  );
}
