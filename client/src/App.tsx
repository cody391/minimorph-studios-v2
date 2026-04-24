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
const AdminLeadGenEngine = lazy(() => import("./pages/admin/LeadGenEngine"));
const AdminSocialMedia = lazy(() => import("./pages/admin/SocialMedia"));
const AdminContentCalendar = lazy(() => import("./pages/admin/ContentCalendar"));
const AdminBrandKit = lazy(() => import("./pages/admin/BrandKit"));
const AdminAIContentStudio = lazy(() => import("./pages/admin/AIContentStudio"));
const AdminXGrowthEngine = lazy(() => import("./pages/admin/XGrowthEngine"));

// Lazy-load portals
const RepDashboard = lazy(() => import("./pages/RepDashboard"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const BecomeRep = lazy(() => import("./pages/BecomeRep"));
const Login = lazy(() => import("./pages/Login"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Careers = lazy(() => import("./pages/Careers"));
const FreeAudit = lazy(() => import("./pages/FreeAudit"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const RepAssessment = lazy(() => import("./pages/RepAssessment"));

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

      {/* Login */}
      <Route path="/login">
        <LazyPage><Login /></LazyPage>
      </Route>

      {/* Become a rep */}
      <Route path="/become-rep">
        <LazyPage><BecomeRep /></LazyPage>
      </Route>

      {/* Rep assessment gate */}
      <Route path="/rep-assessment">
        <LazyPage><RepAssessment /></LazyPage>
      </Route>

      {/* Careers / recruitment */}
      <Route path="/careers">
        <LazyPage><Careers /></LazyPage>
      </Route>

      {/* Free website audit (lead magnet) */}
      <Route path="/free-audit">
        <LazyPage><FreeAudit /></LazyPage>
      </Route>

      {/* Legal pages */}
      <Route path="/privacy">
        <LazyPage><Privacy /></LazyPage>
      </Route>
      <Route path="/terms">
        <LazyPage><Terms /></LazyPage>
      </Route>
      <Route path="/unsubscribe">
        <LazyPage><Unsubscribe /></LazyPage>
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
      <Route path="/admin/lead-gen">
        <AdminPage><AdminLeadGenEngine /></AdminPage>
      </Route>
      <Route path="/admin/widgets">
        <AdminPage><AdminWidgetCatalog /></AdminPage>
      </Route>
      <Route path="/admin/social/calendar">
        <AdminPage><AdminContentCalendar /></AdminPage>
      </Route>
      <Route path="/admin/social/brand">
        <AdminPage><AdminBrandKit /></AdminPage>
      </Route>
      <Route path="/admin/social/ai">
        <AdminPage><AdminAIContentStudio /></AdminPage>
      </Route>
      <Route path="/admin/x-growth">
        <AdminPage><AdminXGrowthEngine /></AdminPage>
      </Route>
      <Route path="/admin/social">
        <AdminPage><AdminSocialMedia /></AdminPage>
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
