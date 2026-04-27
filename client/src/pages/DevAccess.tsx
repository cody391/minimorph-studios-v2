/**
 * Dev Access Page — Admin-only utility for testing all platform roles.
 * 
 * Provides:
 * - Status overview of linked rep/customer/project records
 * - One-click seed test data (creates rep + customer + contract + project)
 * - Quick navigation to all major platform areas
 * - Unlink all (restore admin-only state)
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Database, User, Briefcase, Building2, FileText,
  ArrowRight, RefreshCw, Trash2, CheckCircle, AlertCircle,
  ExternalLink, LayoutDashboard, Users, Target, Rocket
} from "lucide-react";
import { toast } from "sonner";

export default function DevAccess() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: status, isLoading: statusLoading } = trpc.devAccess.getDevStatus.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const seedMutation = trpc.devAccess.seedTestData.useMutation({
    onSuccess: (data) => {
      toast.success("Test data seeded successfully!", {
        description: `Rep: ${data.rep?.fullName}, Customer: ${data.customer?.businessName}`,
      });
      utils.devAccess.getDevStatus.invalidate();
    },
    onError: (err) => toast.error("Seed failed: " + err.message),
  });

  const unlinkMutation = trpc.devAccess.unlinkAll.useMutation({
    onSuccess: () => {
      toast.success("All links removed. You're back to admin-only state.");
      utils.devAccess.getDevStatus.invalidate();
    },
    onError: (err) => toast.error("Unlink failed: " + err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-electric animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-electric/50 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-off-white mb-2">Authentication Required</h2>
            <p className="text-sm text-soft-gray font-sans mb-6">
              Sign in with your admin account to access dev tools.
            </p>
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400/50 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-off-white mb-2">Access Denied</h2>
            <p className="text-sm text-soft-gray font-sans mb-6">
              This page is only accessible to admin users.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const routes = [
    { label: "Admin Dashboard", path: "/admin", icon: LayoutDashboard, requiresAdmin: true },
    { label: "Admin Reps", path: "/admin/reps", icon: Users, requiresAdmin: true },
    { label: "Admin Leads", path: "/admin/leads", icon: Target, requiresAdmin: true },
    { label: "Admin Customers", path: "/admin/customers", icon: Building2, requiresAdmin: true },
    { label: "Admin Contracts", path: "/admin/contracts", icon: FileText, requiresAdmin: true },
    { label: "Admin Onboarding", path: "/admin/onboarding", icon: Rocket, requiresAdmin: true },
    { label: "Admin Governance", path: "/admin/governance", icon: Shield, requiresAdmin: true },
    { label: "Rep Dashboard", path: "/rep", icon: Briefcase, requiresRep: true },
    { label: "Customer Portal", path: "/portal", icon: Building2, requiresCustomer: true },
    { label: "Onboarding Flow", path: "/onboarding", icon: Rocket, requiresCustomer: true },
    { label: "Get Started", path: "/get-started", icon: ArrowRight },
    { label: "Free Audit", path: "/free-audit", icon: Target },
    { label: "Become a Rep", path: "/become-rep/values", icon: Users },
    { label: "Login Page", path: "/login", icon: User },
    { label: "Showroom (Demo)", path: "/showroom/bloom-botanicals", icon: ExternalLink },
  ];

  return (
    <div className="min-h-screen bg-midnight p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-off-white flex items-center gap-3">
              <Shield className="h-6 w-6 text-electric" />
              Dev Access Panel
            </h1>
            <p className="text-sm text-soft-gray font-sans mt-1">
              Admin-only utilities for testing all platform roles and pages.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/admin")}
            className="text-off-white border-border/50"
          >
            <ArrowRight className="h-4 w-4 mr-1" /> Admin
          </Button>
        </div>

        {/* Status Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-off-white flex items-center gap-2">
              <Database className="h-5 w-5 text-electric" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusLoading ? (
              <div className="flex items-center gap-2 text-soft-gray text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading status...
              </div>
            ) : status ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* User */}
                <div className="p-4 rounded-lg bg-charcoal border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-electric" />
                    <span className="text-xs font-sans text-soft-gray uppercase tracking-wider">User</span>
                  </div>
                  <p className="text-sm font-sans text-off-white truncate">{status.userName}</p>
                  <Badge variant="outline" className="mt-1 text-xs border-electric/30 text-electric">
                    {status.userRole}
                  </Badge>
                </div>

                {/* Rep */}
                <div className="p-4 rounded-lg bg-charcoal border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-electric" />
                    <span className="text-xs font-sans text-soft-gray uppercase tracking-wider">Rep</span>
                  </div>
                  {status.linkedRep ? (
                    <>
                      <p className="text-sm font-sans text-off-white truncate">{status.linkedRep.fullName}</p>
                      <Badge variant="outline" className="mt-1 text-xs border-green-500/30 text-green-400">
                        {status.linkedRep.status}
                      </Badge>
                    </>
                  ) : (
                    <p className="text-sm font-sans text-soft-gray/60 italic">Not linked</p>
                  )}
                </div>

                {/* Customer */}
                <div className="p-4 rounded-lg bg-charcoal border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-electric" />
                    <span className="text-xs font-sans text-soft-gray uppercase tracking-wider">Customer</span>
                  </div>
                  {status.linkedCustomer ? (
                    <>
                      <p className="text-sm font-sans text-off-white truncate">{status.linkedCustomer.businessName}</p>
                      <Badge variant="outline" className="mt-1 text-xs border-green-500/30 text-green-400">
                        {status.linkedCustomer.status}
                      </Badge>
                    </>
                  ) : (
                    <p className="text-sm font-sans text-soft-gray/60 italic">Not linked</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="bg-electric hover:bg-electric-light text-midnight font-sans"
              >
                {seedMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Seed Test Data
              </Button>
              <Button
                variant="outline"
                onClick={() => unlinkMutation.mutate()}
                disabled={unlinkMutation.isPending}
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                {unlinkMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Unlink All
              </Button>
              <Button
                variant="outline"
                onClick={() => utils.devAccess.getDevStatus.invalidate()}
                className="text-off-white border-border/50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-off-white flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-electric" />
              Quick Navigation
            </CardTitle>
            <p className="text-xs text-soft-gray font-sans">
              Jump to any page. Pages marked with requirements need linked records (use "Seed Test Data" first).
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {routes.map((route) => {
                const Icon = route.icon;
                const hasAccess =
                  (!route.requiresRep || status?.linkedRep) &&
                  (!route.requiresCustomer || status?.linkedCustomer);
                return (
                  <button
                    key={route.path}
                    onClick={() => setLocation(route.path)}
                    className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      hasAccess
                        ? "bg-charcoal hover:bg-graphite border border-border/30 hover:border-electric/30"
                        : "bg-charcoal/50 border border-border/20 opacity-60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${hasAccess ? "text-electric" : "text-soft-gray/50"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-sans text-off-white truncate block">{route.label}</span>
                      <span className="text-xs font-sans text-soft-gray/60 truncate block">{route.path}</span>
                    </div>
                    {hasAccess ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-400/60 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400/60 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-off-white">How to Test Each Role</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-sans text-soft-gray space-y-3">
            <div>
              <strong className="text-off-white">1. Admin pages:</strong> Already accessible — you're signed in as admin.
              Navigate to any /admin/* route.
            </div>
            <div>
              <strong className="text-off-white">2. Rep Dashboard:</strong> Click "Seed Test Data" to create a rep record
              linked to your account, then navigate to /rep. The dashboard will show your test rep profile.
            </div>
            <div>
              <strong className="text-off-white">3. Customer Portal:</strong> Click "Seed Test Data" to create a customer
              record linked to your account, then navigate to /portal. You'll see the full customer experience.
            </div>
            <div>
              <strong className="text-off-white">4. Onboarding Flow:</strong> After seeding, navigate to /onboarding.
              The onboarding project is linked to your test customer record.
            </div>
            <div>
              <strong className="text-off-white">5. Reset:</strong> Click "Unlink All" to remove your rep/customer links
              and return to admin-only state. The records remain in the database but are no longer linked to your user.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
