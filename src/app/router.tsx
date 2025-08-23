import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLoaderData,
} from "react-router-dom";
import type { Org } from "./org";
import { OrgProvider, fetchOrg } from "./org";

/* ---------------- Marketing (root) ---------------- */
import MarketingLayout from "../sections/marketing/Layout/Layout";
import Landing from "../sections/marketing/Landing/Landing";

/* ---------------- SuperAdmin (global) ---------------- */
import SuperAdminLayout from "../sections/superadmin/Layout/Layout";
import SADashboard from "../sections/superadmin/Dashboard/Dashboard";
import Organizations from "../sections/superadmin/Organizations/Organizations";
import OrgDetail from "../sections/superadmin/OrgDetail/OrgDetail";
import Users from "../sections/superadmin/Users/Users";
import Plans from "../sections/superadmin/Plans/Plans";
import SASettings from "../sections/superadmin/Settings/Settings";
import SAAnalytics from "../sections/superadmin/Analytics/Analytics";

/* ---------------- Agent Console (org-scoped; was “desk”) ---------------- */
import HelpdeskLayout from "../sections/helpdesk/Layout/Layout";
import HKDashboard from "../sections/helpdesk/Dashboard/Dashboard";
import MyTickets from "../sections/helpdesk/Tickets/MyTickets/MyTickets";
import TicketDetails from "../sections/helpdesk/Tickets/MyTickets/TicketDetails/TicketDetails";

/* ---------------- Customer Portal (org-scoped) ---------------- */
import PortalLayout from "../sections/portal/Layout/Layout";
import Home from "../sections/portal/Home/Home";
import NewRequest from "../sections/portal/NewRequest/NewRequest";
import MyRequests from "../sections/portal/Requests/Requests";
import TicketDetail from "../sections/portal/Requests/TicketDetail";
import UsersPage from "../sections/helpdesk/Users/Users";
import NewUserPage from "../sections/helpdesk/Users/NewUser/NewUser";
import UserDetailPage from "../sections/helpdesk/Users/UserDetail/UserDetail";
import WorkflowsHome from "../sections/helpdesk/Workflows/pages/WorkflowsHome/WorkflowsHome";
import WorkflowDetailPage from "../sections/helpdesk/Workflows/pages/WorkflowDetail/WorkflowDetail";

/* ------------ Loader: validate/fetch org (Fix B: inline type) ------------ */
async function orgLoader({ params }: { params: { orgSlug?: string } }) {
  const slug = (params.orgSlug || "").toLowerCase();
  const org = await fetchOrg(slug);
  if (!org) {
    throw new Response("Organization not found", { status: 404 });
  }
  try {
    localStorage.setItem("qd_last_org", org.slug);
  } catch {}
  return { org };
}

/* ------------ Frame to provide org via context to children ------------ */
function OrgFrame() {
  const { org } = useLoaderData() as { org: Org };
  return (
    <OrgProvider value={org}>
      <Outlet />
    </OrgProvider>
  );
}

/* ------------ Error UI for unknown orgs ------------ */
function OrgNotFound() {
  return (
    <div className="panel" style={{ margin: 16 }}>
      <h2>Organization not found</h2>
      <p className="text-muted">Check the URL or contact your administrator.</p>
      <a className="btn" href="/">
        Go to homepage
      </a>
    </div>
  );
}

/* ------------ Legacy redirects (optional during migration) ------------ */
function LegacyDeskRedirect() {
  const last =
    (typeof window !== "undefined" && localStorage.getItem("qd_last_org")) ||
    "";
  return <Navigate to={last ? `/${last}/console` : "/"} replace />;
}
function LegacyPortalRedirect() {
  const last =
    (typeof window !== "undefined" && localStorage.getItem("qd_last_org")) ||
    "";
  return <Navigate to={last ? `/${last}/portal` : "/"} replace />;
}

export const router = createBrowserRouter([
  /* ---------------- Marketing (quickdesk.com/) ---------------- */
  {
    path: "/",
    element: <MarketingLayout />,
    children: [{ index: true, element: <Landing /> }],
  },

  /* ---------------- SuperAdmin (global; not org-scoped) ---------------- */
  {
    path: "/admin",
    element: <SuperAdminLayout />,
    children: [
      { index: true, element: <SADashboard /> },
      { path: "organizations", element: <Organizations /> },
      { path: "organizations/:slug", element: <OrgDetail /> },
      { path: "users", element: <Users /> },
      { path: "plans", element: <Plans /> },
      { path: "settings", element: <SASettings /> },
      { path: "analytics", element: <SAAnalytics /> },
    ],
  },

  /* ---------------- ORG-SCOPED APPS ----------------
     quickdesk.com/:orgSlug/console/...  (Agent Console)
     quickdesk.com/:orgSlug/portal/...   (Customer Portal)
  ---------------------------------------------------------------- */
  {
    path: "/:orgSlug",
    element: <OrgFrame />,
    errorElement: <OrgNotFound />,
    loader: orgLoader,
    children: [
      {
        path: "console",
        element: <HelpdeskLayout />,
        children: [
          { index: true, element: <HKDashboard /> },
          {
            path: "notifications",
            element: (
              <div className="panel" style={{ margin: 16 }}>
                <h3>Notifications (coming soon)</h3>
              </div>
            ),
          },

          { path: "tickets", element: <MyTickets /> },
          { path: "tickets/:id", element: <TicketDetails /> },

          { path: "users", element: <UsersPage /> },
          { path: "users/new", element: <NewUserPage /> },
          { path: "users/:id", element: <UserDetailPage /> },

          { path: "workflows", element: <WorkflowsHome /> },
          { path: "workflows/:id", element: <WorkflowDetailPage /> },

          // Lightweight placeholders to satisfy sidebar links (swap later)
          {
            path: "kb",
            element: (
              <div className="panel" style={{ margin: 16 }}>
                <h3>Knowledge Base (coming soon)</h3>
              </div>
            ),
          },
          {
            path: "sla",
            element: (
              <div className="panel" style={{ margin: 16 }}>
                <h3>SLA Monitor (coming soon)</h3>
              </div>
            ),
          },
          {
            path: "reports",
            element: (
              <div className="panel" style={{ margin: 16 }}>
                <h3>Reports (coming soon)</h3>
              </div>
            ),
          },
          {
            path: "settings",
            element: (
              <div className="panel" style={{ margin: 16 }}>
                <h3>Settings (coming soon)</h3>
              </div>
            ),
          },
        ],
      },
      {
        path: "portal",
        element: <PortalLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "new-request", element: <NewRequest /> },
          { path: "requests", element: <MyRequests /> },
          { path: "requests/:id", element: <TicketDetail /> },
        ],
      },
    ],
  },

  /* ---------------- Legacy paths → redirect ---------------- */
  { path: "/desk/*", element: <LegacyDeskRedirect /> },
  { path: "/portal/*", element: <LegacyPortalRedirect /> },
]);
