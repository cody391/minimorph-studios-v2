import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";

// Lazy-load admin pages for code splitting
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminReps = lazy(() => import("./pages/admin/Reps"));
const AdminLeads = lazy(() => import("./pages/admin/Leads"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminContracts = lazy(() => import("./pages/admin/Contracts"));
const AdminCommissions = lazy(() => import("./pages/admin/Commissions"));
const AdminNurture = lazy(() => import("./pages/admin/Nurture"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminUpsells = lazy(() => import("./pages/admin/Upsells"));
const AdminRenewals = lazy(() => import("./pages/admin/Renewals"));
const AdminSubmissions = lazy(() => import("./pages/admin/Submissions"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminOnboarding = lazy(() => import("./pages/admin/OnboardingProjects"));
const AdminWidgetCatalog = lazy(() => import("./pages/admin/WidgetCatalog"));

// Lazy-load portals
const RepDashboard = lazy(() => import("./pages/RepDashboard"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const BecomeRep = lazy(() => import("./pages/BecomeRep"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

// Admin layout wrapper
const AdminLayout = lazy(() => import("./components/AdminLayout"));

function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>}>
      {children}
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path={"/"} component={Home} />
      <Route path="/get-started">
        <LazyPage><GetStarted /></LazyPage>
      </Route>

      {/* Become a rep */}
      <Route path="/become-rep">
        <LazyPage><BecomeRep /></LazyPage>
      </Route>

      {/* Rep portal */}
      <Route path="/rep">
        <LazyPage><RepDashboard /></LazyPage>
      </Route>

      {/* Customer portal */}
      <Route path="/portal">
        <LazyPage><CustomerPortal /></LazyPage>
      </Route>

      {/* Checkout success */}
      <Route path="/checkout/success">
        <LazyPage><CheckoutSuccess /></LazyPage>
      </Route>

      {/* Customer onboarding */}
      <Route path="/onboarding">
        <LazyPage><Onboarding /></LazyPage>
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin">
        <AdminPage><AdminOverview /></AdminPage>
      </Route>
      <Route path="/admin/reps">
        <AdminPage><AdminReps /></AdminPage>
      </Route>
      <Route path="/admin/leads">
        <AdminPage><AdminLeads /></AdminPage>
      </Route>
      <Route path="/admin/customers">
        <AdminPage><AdminCustomers /></AdminPage>
      </Route>
      <Route path="/admin/contracts">
        <AdminPage><AdminContracts /></AdminPage>
      </Route>
      <Route path="/admin/commissions">
        <AdminPage><AdminCommissions /></AdminPage>
      </Route>
      <Route path="/admin/nurture">
        <AdminPage><AdminNurture /></AdminPage>
      </Route>
      <Route path="/admin/reports">
        <AdminPage><AdminReports /></AdminPage>
      </Route>
      <Route path="/admin/upsells">
        <AdminPage><AdminUpsells /></AdminPage>
      </Route>
      <Route path="/admin/renewals">
        <AdminPage><AdminRenewals /></AdminPage>
      </Route>
      <Route path="/admin/submissions">
        <AdminPage><AdminSubmissions /></AdminPage>
      </Route>
      <Route path="/admin/analytics">
        <AdminPage><AdminAnalytics /></AdminPage>
      </Route>
      <Route path="/admin/orders">
        <AdminPage><AdminOrders /></AdminPage>
      </Route>
      <Route path="/admin/onboarding">
        <AdminPage><AdminOnboarding /></AdminPage>
      </Route>
      <Route path="/admin/widgets">
        <AdminPage><AdminWidgetCatalog /></AdminPage>
      </Route>

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
