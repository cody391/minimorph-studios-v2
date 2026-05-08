import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Target,
  Building2,
  FileText,
  DollarSign,
  Heart,
  BarChart3,
  TrendingUp,
  RefreshCw,
  MessageSquare,
  ArrowLeft,
  Activity,
  ShoppingCart,
  ClipboardList,
  Brain,
  Share2,
  Calendar,
  Palette,
  Sparkles,
  Rocket,
  Shield,
  Globe,
  Radio,
  Headphones,
  Package,
  Tag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
};

type Section = {
  label: string;
  items: MenuItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-electric/20 px-1 text-[10px] font-semibold text-electric leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (user && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
              <span className="text-red-400 font-serif text-lg font-bold">!</span>
            </div>
            <h1 className="text-2xl font-serif text-off-white text-center">Access Denied</h1>
            <p className="text-sm text-soft-gray text-center max-w-sm font-sans">
              You do not have admin privileges. Contact the site owner if you believe this is an error.
            </p>
          </div>
          <Button onClick={() => { window.location.href = "/"; }} size="lg" className="w-full bg-electric hover:bg-electric-light text-midnight shadow-lg hover:shadow-xl transition-all font-sans">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 bg-electric/20 border border-electric/30 rounded-xl flex items-center justify-center">
              <span className="text-electric font-serif text-lg font-bold">M</span>
            </div>
            <h1 className="text-2xl font-serif text-off-white text-center">Admin Access Required</h1>
            <p className="text-sm text-soft-gray text-center max-w-sm font-sans">
              Sign in with your admin account to access the MiniMorph Studios platform.
            </p>
          </div>
          <Button onClick={() => { window.location.href = "/login?next=/admin"; }} size="lg" className="w-full bg-electric hover:bg-electric-light text-midnight shadow-lg hover:shadow-xl transition-all font-sans">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <AdminLayoutContent setSidebarWidth={setSidebarWidth}>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}

function AdminLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Notification counts — poll every 60s
  const { data: counts } = trpc.notifCounts.admin.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const sections: Section[] = [
    {
      label: "OVERVIEW",
      items: [
        { icon: LayoutDashboard, label: "Overview", path: "/admin" },
      ],
    },
    {
      label: "SALES",
      items: [
        { icon: Target, label: "Leads", path: "/admin/leads" },
        { icon: MessageSquare, label: "Submissions", path: "/admin/submissions", badge: 0 },
        { icon: Users, label: "Reps", path: "/admin/reps", badge: counts?.unreadRepMessages },
        { icon: Shield, label: "Governance", path: "/admin/governance" },
        { icon: DollarSign, label: "Commissions", path: "/admin/commissions" },
      ],
    },
    {
      label: "CUSTOMERS",
      items: [
        { icon: Building2, label: "Customers", path: "/admin/customers" },
        { icon: FileText, label: "Contracts", path: "/admin/contracts" },
        { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
        { icon: RefreshCw, label: "Renewals", path: "/admin/renewals" },
        { icon: Headphones, label: "Support", path: "/admin/support", badge: counts?.openTickets },
        { icon: MessageSquare, label: "Rep Messages", path: "/admin/messages", badge: counts?.unreadRepMessages },
      ],
    },
    {
      label: "DELIVERY",
      items: [
        { icon: ClipboardList, label: "Onboarding", path: "/admin/onboarding" },
        { icon: Globe, label: "Sites", path: "/admin/sites" },
      ],
    },
    {
      label: "RETENTION",
      items: [
        { icon: Heart, label: "Nurture", path: "/admin/nurture" },
        { icon: TrendingUp, label: "Upsells", path: "/admin/upsells" },
        { icon: BarChart3, label: "Reports", path: "/admin/reports" },
        { icon: Radio, label: "Broadcasts", path: "/admin/broadcasts" },
      ],
    },
    {
      label: "PRODUCTS & SETTINGS",
      items: [
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: Tag, label: "Coupons", path: "/admin/coupons" },
        { icon: Brain, label: "Lead Gen Engine", path: "/admin/lead-gen" },
        { icon: Activity, label: "Analytics", path: "/admin/analytics" },
      ],
    },
  ];

  const marketingItems: MenuItem[] = [
    { icon: Share2, label: "Social Media", path: "/admin/social" },
    { icon: Calendar, label: "Content Calendar", path: "/admin/social/calendar" },
    { icon: Palette, label: "Brand Kit", path: "/admin/social/brand" },
    { icon: Sparkles, label: "AI Content Studio", path: "/admin/social/ai" },
    { icon: Rocket, label: "X Growth Engine", path: "/admin/x-growth" },
  ];

  const activeLabel = sections.flatMap(s => s.items).find(i => i.path === location)?.label
    ?? marketingItems.find(i => i.path === location)?.label
    ?? "Admin";

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const renderItem = (item: MenuItem) => {
    const isActive = location === item.path;
    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setLocation(item.path)}
          tooltip={item.label}
          className={`h-9 transition-all font-sans text-sm ${
            isActive
              ? "bg-electric/15 text-electric font-medium"
              : "text-soft-gray hover:bg-graphite hover:text-off-white"
          }`}
        >
          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-electric" : "text-soft-gray"}`} />
          <span className="truncate">{item.label}</span>
          {item.badge ? <Badge count={item.badge} /> : null}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0 bg-charcoal" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-border/30">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-graphite rounded-lg transition-colors focus:outline-none shrink-0"
              >
                <PanelLeft className="h-4 w-4 text-soft-gray" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-electric rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-midnight font-serif text-xs font-bold">M</span>
                  </div>
                  <span className="font-serif text-off-white font-semibold tracking-tight truncate text-sm">
                    MiniMorph Admin
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-1 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.label} className="px-2 pt-2">
                {!isCollapsed && (
                  <div className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground/50 tracking-widest uppercase">
                    {section.label}
                  </div>
                )}
                <SidebarMenu className="gap-0">
                  {section.items.map(renderItem)}
                </SidebarMenu>
              </div>
            ))}

            {/* MINIMORPH MARKETING — collapsible */}
            <div className="px-2 pt-2">
              {!isCollapsed ? (
                <button
                  onClick={() => setMarketingOpen(!marketingOpen)}
                  className="flex items-center justify-between w-full px-2 pb-1 text-[10px] font-semibold text-muted-foreground/50 tracking-widest uppercase hover:text-muted-foreground/70 transition-colors"
                >
                  <span>MINIMORPH MARKETING</span>
                  {marketingOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              ) : null}
              {(marketingOpen || isCollapsed) && (
                <SidebarMenu className="gap-0">
                  {marketingItems.map(renderItem)}
                </SidebarMenu>
              )}
            </div>

            {/* Back to website */}
            <div className="px-3 mt-4 pt-4 border-t border-border/30 pb-2">
              <button
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 text-xs text-soft-gray hover:text-electric transition-colors font-sans w-full group-data-[collapsible=icon]:justify-center"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Back to website</span>
              </button>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-graphite transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-8 w-8 border border-electric/20 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-electric/10 text-electric">
                      {user?.name?.charAt(0).toUpperCase() ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-off-white font-sans">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-soft-gray truncate mt-1 font-sans">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-electric/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-midnight">
        {isMobile && (
          <div className="flex border-b border-border/30 h-14 items-center justify-between bg-charcoal/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-11 w-11 rounded-lg" aria-label="Toggle sidebar" />
              <span className="font-serif text-off-white text-sm">{activeLabel}</span>
            </div>
          </div>
        )}
        <main id="main-content" className="flex-1 p-3 sm:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
