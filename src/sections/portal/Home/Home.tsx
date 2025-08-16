import "./Home.css";
import { Link } from "react-router-dom";
import { useOrg } from "../../../app/org";
import {
  FiSend, FiFolderPlus, FiClock, FiChevronRight,
  FiKey, FiDollarSign, FiCpu, FiDatabase, FiBox
} from "react-icons/fi";

type Cat = { label: string; icon: React.ReactNode; to?: string };

export default function Home() {
  const org = useOrg();

  const cats: Cat[] = [
    { label: "Account & Access", icon: <FiKey /> },
    { label: "Billing & Plans", icon: <FiDollarSign /> },
    { label: "Technical Issues", icon: <FiCpu /> },
    { label: "Data & Privacy", icon: <FiDatabase /> },
    { label: "Integrations", icon: <FiBox /> },
    { label: "Other", icon: <FiFolderPlus /> },
  ];

  const recents = [
    { id: "t1", status: "Open", title: "Can’t reset my password", age: "2d" },
    { id: "t2", status: "Solved", title: "Invoice for March", age: "1w" },
    { id: "t3", status: "Pending", title: "Integration webhook failing", age: "3h" },
  ];

  return (
    <div className="pt-home">
      {/* ============== HERO ============== */}
      <section className="pt-hero panel">
        <div className="pt-hero__copy">
          <h1 className="pt-hero__title">Welcome to {org.name} Support</h1>
          <p className="pt-hero__sub">
            Create a new request, track your tickets, or browse helpful articles.
          </p>

          <div className="pt-actions">
            {/* RELATIVE: stays under /:org/portal */}
            <Link className="pt-btn pt-btn--primary" to="new-request">
              <FiSend /> New Request
            </Link>
            <Link className="pt-btn" to="requests">
              My Requests
            </Link>
          </div>

          <div className="pt-hero__badges">
            <span className="pt-chip">Fast replies</span>
            <span className="pt-chip">Clear status</span>
            <span className="pt-chip">Email updates</span>
          </div>
        </div>

        <div className="pt-hero__art" aria-hidden>
          <div className="pt-hero__card">
            <div className="pt-hero__cardTitle">Average first response</div>
            <div className="pt-hero__metric">23m</div>
            <div className="pt-hero__spark"><FiClock /> within business hours</div>
          </div>
          <div className="pt-hero__card">
            <div className="pt-hero__cardTitle">Tickets solved last 7d</div>
            <div className="pt-hero__metric">312</div>
            <div className="pt-hero__spark">Great job team ✨</div>
          </div>
        </div>
      </section>

      {/* ============== RECENTS ============== */}
      <section className="pt-recent panel">
        <div className="pt-recent__head">
          <h3>Recent requests</h3>
          {/* RELATIVE: stays under /:org/portal */}
          <Link to="requests" className="pt-link">View all</Link>
        </div>

        <ul className="pt-recent__list">
          {recents.map((r) => (
            <li key={r.id} className="pt-recent__item">
              <span className={`pt-pill ${pillClass(r.status)}`}>{r.status}</span>
              <span className="pt-recent__title">{r.title}</span>
              <time className="pt-recent__age">· {r.age}</time>
              <FiChevronRight className="pt-recent__chev" aria-hidden />
            </li>
          ))}
        </ul>
      </section>

      {/* ============== CATEGORIES ============== */}
      <section className="pt-cats">
        <header className="pt-sectionHead">
          <h3>Popular categories</h3>
          <Link className="pt-link" to=".">Browse all</Link>
        </header>

        <div className="pt-cats__grid">
          {cats.map((c) => (
            <button key={c.label} className="pt-cat" type="button">
              <span className="pt-cat__icon">{c.icon}</span>
              <span className="pt-cat__label">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="pt-steps panel">
        <div className="pt-steps__row">
          <div className="pt-step">
            <span className="pt-step__num">1</span>
            <h4>Tell us what’s wrong</h4>
            <p>Use a clear subject and include screenshots if possible.</p>
          </div>
          <div className="pt-step">
            <span className="pt-step__num">2</span>
            <h4>We triage & assign</h4>
            <p>Your request is routed to the right team automatically.</p>
          </div>
          <div className="pt-step">
            <span className="pt-step__num">3</span>
            <h4>Track every update</h4>
            <p>Get status emails and view progress here anytime.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function pillClass(status: string) {
  switch (status.toLowerCase()) {
    case "open": return "pt-pill--open";
    case "pending": return "pt-pill--pending";
    case "solved": return "pt-pill--solved";
    default: return "";
  }
}
