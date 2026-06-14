'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, type DashboardPage } from '@/lib/store';
import { agents } from '@/lib/agents';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useDashboardStore } from '@/lib/dashboard-store';
import {
  Home,
  FolderKanban,
  FileText,
  Image,
  Sparkles,
  Search,
  Target,
  Eye,
  Shield,
  BarChart3,
  Bot,
  TrendingUp,
  Clock,
  CreditCard,
  Activity,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Bell,
  Settings,
  User,
  Plus,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Receipt,
  PieChart,
  Database,
  ShieldCheck,
  FileSearch,
  LayoutDashboard,
  Layers,
  FolderOpen,
  DollarSign,
  BarChart2,
  UserCog,
  Globe,
  CalendarDays,
  Loader2,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Module Imports ─────────────────────────────────────────────────────────
// Only the default Home page is eager. Every other page is code-split with
// next/dynamic so navigating to it loads its chunk on demand — this keeps the
// initial dashboard bundle small instead of shipping all ~20 pages up front.
import { DashboardHome } from './modules/dashboard-home';
import { ClerkLogoutMenuItem } from '@/components/auth/clerk-logout-menu-item';

function PageSpinner() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const ListingAnalyzer = dynamic(() => import('./modules/listing-analyzer').then((m) => m.ListingAnalyzer), { loading: PageSpinner });
const CompetitorAnalyzer = dynamic(() => import('./modules/competitor-analyzer').then((m) => m.CompetitorAnalyzer), { loading: PageSpinner });
const KeywordCenter = dynamic(() => import('./modules/keyword-center').then((m) => m.KeywordCenter), { loading: PageSpinner });
const ImageBriefGenerator = dynamic(() => import('./modules/image-brief-generator').then((m) => m.ImageBriefGenerator), { loading: PageSpinner });
const AgentsView = dynamic(() => import('./modules/agents-view').then((m) => m.AgentsView), { loading: PageSpinner });
const ProjectsView = dynamic(() => import('./modules/projects-view').then((m) => m.ProjectsView), { loading: PageSpinner });
const ProjectDetail = dynamic(() => import('./modules/project-detail').then((m) => m.ProjectDetail), { loading: PageSpinner });
const FullWorkflow = dynamic(() => import('./modules/full-workflow').then((m) => m.FullWorkflow), { loading: PageSpinner });
const ProductAssets = dynamic(() => import('./modules/product-assets').then((m) => m.ProductAssets), { loading: PageSpinner });
const AccountSettingsPage = dynamic(() => import('./modules/account-settings').then((m) => m.AccountSettingsPage), { loading: PageSpinner });
const FunctionalAgentHistoryPage = dynamic(() => import('./modules/workspace-pages').then((m) => m.AgentHistoryPage), { loading: PageSpinner });
const FunctionalAgentPerformancePage = dynamic(() => import('./modules/workspace-pages').then((m) => m.AgentPerformancePage), { loading: PageSpinner });
const FunctionalBillingPage = dynamic(() => import('./modules/workspace-pages').then((m) => m.BillingPage), { loading: PageSpinner });
const FunctionalCreditsPage = dynamic(() => import('./modules/workspace-pages').then((m) => m.CreditsPage), { loading: PageSpinner });
const FunctionalInvoicesPage = dynamic(() => import('./modules/workspace-pages').then((m) => m.InvoicesPage), { loading: PageSpinner });
const FunctionalListingsPage = dynamic(() => import('./modules/workspace-pages').then((m) => m.ListingsPage), { loading: PageSpinner });
const FunctionalPlansPage = dynamic(() => import('./modules/workspace-pages').then((m) => m.PlansPage), { loading: PageSpinner });
const FunctionalResearchReportPage = dynamic(() => import('./modules/workspace-pages').then((m) => m.ResearchReportPage), { loading: PageSpinner });
const FunctionalComplianceCheckPage = dynamic(() => import('./modules/workspace-pages').then((m) => m.ComplianceCheckPage), { loading: PageSpinner });
const FunctionalListingScorePage = dynamic(() => import('./modules/workspace-pages').then((m) => m.ListingScorePage), { loading: PageSpinner });
const FunctionalUsagePage = dynamic(() => import('./modules/workspace-pages').then((m) => m.UsagePage), { loading: PageSpinner });

// ─── Navigation Configuration ───────────────────────────────────────────────

interface NavItem {
  page: DashboardPage;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  adminOnly?: boolean;
  collapsible?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { page: 'home', label: 'Home', icon: Home },
      { page: 'projects', label: 'Projects', icon: FolderKanban },
      { page: 'listing-builder', label: 'Full Listing Workflow', icon: Sparkles },
      { page: 'listings', label: 'Listings', icon: FileText },
      { page: 'assets', label: 'Assets', icon: Image },
    ],
  },
  {
    label: 'Standalone Tools',
    collapsible: true,
    items: [
      { page: 'listing-analyzer', label: 'Listing Review', icon: FileSearch },
      { page: 'research-report', label: 'Product Research', icon: Search },
      { page: 'competitor-analyzer', label: 'Market & Competitors', icon: Target },
      { page: 'keyword-center', label: 'Keywords & SEO', icon: TrendingUp },
      { page: 'image-brief', label: 'Images & A+ Content', icon: Eye },
      { page: 'compliance-check', label: 'Policy Check', icon: Shield },
      { page: 'listing-score', label: 'Listing Score', icon: BarChart3 },
    ],
  },
  {
    label: 'Team',
    items: [
      { page: 'agents', label: 'AI Agents', icon: Bot },
      { page: 'agent-performance', label: 'Performance', icon: TrendingUp },
      { page: 'agent-history', label: 'History', icon: Clock },
    ],
  },
];

// ─── Page Title Map ─────────────────────────────────────────────────────────

const pageTitleMap: Record<DashboardPage, string> = {
  home: 'Home',
  projects: 'Projects',
  'project-detail': 'Project Workspace',
  listings: 'Listings',
  assets: 'Assets',
  'listing-builder': 'Generate Listing',
  'listing-analyzer': 'Listing Analyzer',
  'competitor-analyzer': 'Competitor Analyzer',
  'keyword-center': 'Keyword Research',
  'image-brief': 'Image Analysis',
  'research-report': 'Research Report',
  'compliance-check': 'Compliance Check',
  'listing-score': 'Listing Score',
  agents: 'AI Agents',
  'agent-performance': 'Agent Performance',
  'agent-history': 'Agent History',
  'account-settings': 'Account Settings',
  billing: 'Billing',
  plans: 'Plans & Credits',
  invoices: 'Invoices',
  credits: 'Credits',
  usage: 'Usage',
  'admin-overview': 'System Status',
  'admin-policies': 'Policy Bank',
  'admin-settings': 'Settings & API',
  'admin-users': 'Users',
  'admin-orgs': 'Organizations',
  'admin-subscriptions': 'Subscriptions',
  'admin-analytics': 'Analytics',
};

// ─── Placeholder Page Component ─────────────────────────────────────────────

function PlaceholderPage({
  title,
  description,
  icon: Icon,
  accentColor = '#035EF9',
  mockItems,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor?: string;
  mockItems?: { label: string; value: string; status?: 'active' | 'pending' | 'completed' }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentColor + '15' }}
        >
          <Icon className="h-6 w-6" style={{ color: accentColor }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0B0F1A]">{title}</h1>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-dashed border-2" style={{ borderColor: accentColor + '30' }}>
        <CardContent className="p-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: accentColor + '10' }}
          >
            <Icon className="h-8 w-8" style={{ color: accentColor }} />
          </div>
          <h3 className="text-lg font-semibold text-[#0B0F1A] mb-2">Coming Soon</h3>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            We&apos;re building something amazing. This feature will be available in an upcoming release.
          </p>
          <Badge variant="secondary" className="mt-4">
            In Development
          </Badge>
        </CardContent>
      </Card>

      {/* Mock Data Preview */}
      {mockItems && mockItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>Sample data for this section</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50/80"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          item.status === 'active'
                            ? '#36B46F'
                            : item.status === 'pending'
                            ? '#FC7403'
                            : item.status === 'completed'
                            ? '#035EF9'
                            : '#9CA3AF',
                      }}
                    />
                    <span className="text-sm text-[#0B0F1A]">{item.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Individual Placeholder Pages ───────────────────────────────────────────

function ListingsPage() {
  return (
    <PlaceholderPage
      title="Listings"
      description="Manage and organize all your product listings in one place."
      icon={FileText}
      mockItems={[
        { label: 'Wireless Earbuds Pro', value: 'Active', status: 'active' },
        { label: 'Smart Watch Series 5', value: 'Draft', status: 'pending' },
        { label: 'Coffee Maker X200', value: 'Active', status: 'active' },
        { label: 'Yoga Mat Premium', value: 'Completed', status: 'completed' },
        { label: 'USB-C Hub Adapter', value: 'Draft', status: 'pending' },
        { label: 'LED Desk Lamp', value: 'Active', status: 'active' },
      ]}
    />
  );
}

function AssetsPage() {
  return (
    <PlaceholderPage
      title="Assets"
      description="Your media library — images, infographics, and creative assets."
      icon={Image}
      accentColor="#7E44E6"
      mockItems={[
        { label: 'Product Photography', value: '24 files' },
        { label: 'Infographics', value: '12 files' },
        { label: 'Lifestyle Images', value: '18 files' },
        { label: 'Brand Assets', value: '6 files' },
        { label: 'A+ Content Graphics', value: '9 files' },
      ]}
    />
  );
}

function ResearchReportPage() {
  return (
    <PlaceholderPage
      title="Research Report"
      description="AI-powered market research and product analysis reports."
      icon={Search}
      accentColor="#36B46F"
      mockItems={[
        { label: 'Wireless Earbuds Market Analysis', value: '2 days ago', status: 'completed' },
        { label: 'Smart Watch Competitive Landscape', value: '5 days ago', status: 'completed' },
        { label: 'Coffee Maker Trends Q4', value: 'In progress', status: 'pending' },
        { label: 'Yoga Mat Niche Report', value: '1 week ago', status: 'completed' },
      ]}
    />
  );
}

function ComplianceCheckPage() {
  return (
    <PlaceholderPage
      title="Compliance Check"
      description="Validate your listings against Amazon policies and detect risks."
      icon={Shield}
      accentColor="#E82E33"
      mockItems={[
        { label: 'Wireless Earbuds Pro', value: 'Passed', status: 'completed' },
        { label: 'Smart Watch Series 5', value: '2 Warnings', status: 'pending' },
        { label: 'Coffee Maker X200', value: 'Passed', status: 'completed' },
        { label: 'Yoga Mat Premium', value: '1 Issue', status: 'pending' },
      ]}
    />
  );
}

function ListingScorePage() {
  return (
    <PlaceholderPage
      title="Listing Score"
      description="Score and benchmark your listings against best practices."
      icon={BarChart3}
      accentColor="#FC7403"
      mockItems={[
        { label: 'Wireless Earbuds Pro', value: '92/100', status: 'completed' },
        { label: 'Smart Watch Series 5', value: '78/100', status: 'pending' },
        { label: 'Coffee Maker X200', value: '85/100', status: 'completed' },
        { label: 'Yoga Mat Premium', value: '88/100', status: 'completed' },
      ]}
    />
  );
}

function AgentPerformancePage() {
  return (
    <PlaceholderPage
      title="Agent Performance"
      description="Track AI agent efficiency, accuracy, and output quality."
      icon={TrendingUp}
      accentColor="#3EC9D1"
      mockItems={[
        { label: 'Bayan — Copywriter', value: '98% accuracy', status: 'active' },
        { label: 'Nadeem — SEO', value: '95% accuracy', status: 'active' },
        { label: 'Saleem — Compliance', value: '99% accuracy', status: 'active' },
        { label: 'Hakim — Strategy', value: '94% accuracy', status: 'active' },
        { label: 'Fares — Market Intel', value: '96% accuracy', status: 'active' },
      ]}
    />
  );
}

function AgentHistoryPage() {
  return (
    <PlaceholderPage
      title="Agent History"
      description="Review past agent runs, outputs, and conversation logs."
      icon={Clock}
      accentColor="#60697A"
      mockItems={[
        { label: 'Listing generation — Earbuds', value: '2 min ago', status: 'completed' },
        { label: 'Keyword research — Coffee Maker', value: '15 min ago', status: 'completed' },
        { label: 'Compliance check — Yoga Mat', value: '1 hour ago', status: 'completed' },
        { label: 'Competitor analysis — Watch', value: '2 hours ago', status: 'completed' },
        { label: 'Image brief — USB Hub', value: '3 hours ago', status: 'completed' },
      ]}
    />
  );
}

function BillingPage() {
  return (
    <PlaceholderPage
      title="Billing"
      description="Manage your subscription, credits, and payment methods."
      icon={CreditCard}
      accentColor="#035EF9"
      mockItems={[
        { label: 'Professional Plan', value: '$49/mo', status: 'active' },
        { label: 'Credits Balance', value: '4,505', status: 'active' },
        { label: 'Next Billing Date', value: 'Mar 15, 2026', status: 'pending' },
        { label: 'Payment Method', value: 'Visa •••• 4242', status: 'active' },
      ]}
    />
  );
}

function PlansPage() {
  return (
    <PlaceholderPage
      title="Plans & Credits"
      description="View available plans, upgrade, and manage your credit balance."
      icon={CreditCard}
      accentColor="#035EF9"
      mockItems={[
        { label: 'Starter', value: '1,000 credits/mo' },
        { label: 'Professional', value: '5,000 credits/mo', status: 'active' },
        { label: 'Enterprise', value: 'Unlimited' },
        { label: 'Current Credits', value: '4,505 remaining', status: 'active' },
      ]}
    />
  );
}

function InvoicesPage() {
  return (
    <PlaceholderPage
      title="Invoices"
      description="View and download your billing invoices and receipts."
      icon={Receipt}
      accentColor="#640324"
      mockItems={[
        { label: 'Invoice #INV-2026-003', value: '$49.00', status: 'completed' },
        { label: 'Invoice #INV-2026-002', value: '$49.00', status: 'completed' },
        { label: 'Invoice #INV-2026-001', value: '$49.00', status: 'completed' },
        { label: 'Invoice #INV-2025-012', value: '$49.00', status: 'completed' },
      ]}
    />
  );
}

function CreditsPage() {
  return (
    <PlaceholderPage
      title="Credits"
      description="Monitor credit usage, purchase additional credits, and view transaction history."
      icon={Zap}
      accentColor="#FEBD05"
      mockItems={[
        { label: 'Current Balance', value: '4,505 credits', status: 'active' },
        { label: 'Used This Month', value: '495 credits' },
        { label: 'Purchased Add-on', value: '+1,000 credits', status: 'completed' },
        { label: 'Referral Bonus', value: '+500 credits', status: 'completed' },
      ]}
    />
  );
}

function UsagePage() {
  return (
    <PlaceholderPage
      title="Usage"
      description="Detailed breakdown of feature usage and credit consumption."
      icon={Activity}
      accentColor="#36B46F"
      mockItems={[
        { label: 'Listing Generation', value: '180 credits', status: 'active' },
        { label: 'Keyword Research', value: '120 credits', status: 'active' },
        { label: 'Competitor Analysis', value: '95 credits', status: 'active' },
        { label: 'Compliance Checks', value: '60 credits', status: 'active' },
        { label: 'Image Analysis', value: '40 credits', status: 'active' },
      ]}
    />
  );
}

// ─── Page Renderer ──────────────────────────────────────────────────────────

function renderPage(page: DashboardPage) {
  switch (page) {
    case 'home':
      return <DashboardHome />;
    case 'projects':
      return <ProjectsView />;
    case 'project-detail':
      return <ProjectDetail />;
    case 'listings':
      return <FunctionalListingsPage />;
    case 'assets':
      return <ProductAssets />;
    case 'listing-builder':
      return <FullWorkflow />;
    case 'listing-analyzer':
      return <ListingAnalyzer />;
    case 'competitor-analyzer':
      return <CompetitorAnalyzer />;
    case 'keyword-center':
      return <KeywordCenter />;
    case 'image-brief':
      return <ImageBriefGenerator />;
    case 'research-report':
      return <FunctionalResearchReportPage />;
    case 'compliance-check':
      return <FunctionalComplianceCheckPage />;
    case 'listing-score':
      return <FunctionalListingScorePage />;
    case 'agents':
      return <AgentsView />;
    case 'agent-performance':
      return <FunctionalAgentPerformancePage />;
    case 'agent-history':
      return <FunctionalAgentHistoryPage />;
    case 'account-settings':
      return <AccountSettingsPage />;
    case 'billing':
      return <FunctionalBillingPage />;
    case 'plans':
      return <FunctionalPlansPage />;
    case 'invoices':
      return <FunctionalInvoicesPage />;
    case 'credits':
      return <FunctionalCreditsPage />;
    case 'usage':
      return <FunctionalUsagePage />;
    default:
      return <DashboardHome />;
  }
}

// ─── Breadcrumb Helper ──────────────────────────────────────────────────────

function getBreadcrumb(page: DashboardPage): { group: string; page: string } {
  if (page === 'account-settings') {
    return { group: 'Account', page: 'Settings' };
  }
  for (const group of navGroups) {
    const found = group.items.find((item) => item.page === page);
    if (found) {
      return { group: group.label, page: found.label };
    }
  }
  return { group: 'Dashboard', page: pageTitleMap[page] || 'Home' };
}

// ─── Main Dashboard Component ───────────────────────────────────────────────

export function DashboardV2() {
  const {
    dashboardPage,
    setDashboardPage,
    sidebarOpen,
    setSidebarOpen,
    user,
    logout,
    workspaces,
    activeWorkspace,
    setWorkspaces,
    setActiveWorkspace,
    createWorkspace,
    setView,
  } = useAppStore(
    useShallow((s) => ({
      dashboardPage: s.dashboardPage,
      setDashboardPage: s.setDashboardPage,
      sidebarOpen: s.sidebarOpen,
      setSidebarOpen: s.setSidebarOpen,
      user: s.user,
      logout: s.logout,
      workspaces: s.workspaces,
      activeWorkspace: s.activeWorkspace,
      setWorkspaces: s.setWorkspaces,
      setActiveWorkspace: s.setActiveWorkspace,
      createWorkspace: s.createWorkspace,
      setView: s.setView,
    }))
  );
  const switchDashboardWorkspace = useDashboardStore((state) => state.switchWorkspace);
  const creditsBalance = useDashboardStore((state) => state.creditsBalance);
  const currentPlan = useDashboardStore((state) => state.plan);
  const setSelectedProject = useDashboardStore((state) => state.setSelectedProject);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspacePurpose, setWorkspacePurpose] = useState<'account' | 'category'>('account');
  const [workspaceLabel, setWorkspaceLabel] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeWorkspace) return;
    const workspace = workspaces[0] ?? {
      id: 'sellercrew-main',
      name: 'SellerCrew Workspace',
      logo: null,
      role: 'owner' as const,
      purpose: 'account' as const,
      label: 'Primary Amazon account',
    };
    if (!workspaces.length) setWorkspaces([workspace]);
    setActiveWorkspace(workspace);
  }, [activeWorkspace, setActiveWorkspace, setWorkspaces, workspaces]);

  useEffect(() => {
    if (activeWorkspace?.id) switchDashboardWorkspace(activeWorkspace.id);
  }, [activeWorkspace?.id, switchDashboardWorkspace]);

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) {
      toast.error('Enter a workspace name.');
      return;
    }
    const workspace = createWorkspace({
      name: workspaceName,
      purpose: workspacePurpose,
      label: workspaceLabel,
    });
    switchDashboardWorkspace(workspace.id);
    setWorkspaceName('');
    setWorkspaceLabel('');
    setWorkspacePurpose('account');
    setWorkspaceDialogOpen(false);
    setDashboardPage('home');
    toast.success(`${workspace.name} workspace created.`);
  };

  // Admin pages live only in the separate /admin dashboard; if one is somehow
  // selected here (e.g. persisted state), fall back to Home.
  const adminPages = new Set<DashboardPage>([
    'admin-overview', 'admin-settings', 'admin-policies',
    'admin-users', 'admin-orgs', 'admin-subscriptions', 'admin-analytics',
  ]);
  const effectivePage: DashboardPage = adminPages.has(dashboardPage) ? 'home' : dashboardPage;

  const sidebarWidth = sidebarOpen ? 260 : 64;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative h-dvh w-full max-w-full overflow-clip bg-[#F8F9FB]">
        {mobileSidebarOpen && (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-10 bg-black/35 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarWidth }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className={`fixed inset-y-0 left-0 z-20 flex h-full flex-col overflow-hidden border-r border-gray-200/80 bg-white shadow-xl transition-transform md:translate-x-0 md:shadow-none ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: sidebarWidth }}
        >
          {/* Logo */}
          <div className="relative flex h-16 shrink-0 items-center border-b border-gray-100 px-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#035EF9] via-[#7E44E6] to-[#FC7403] p-1 shadow-sm shadow-[#7E44E6]/20">
                <div className="size-full overflow-hidden rounded-[9px] bg-white">
                  <img src="/agents/ali.png" alt="SellerCrew" className="size-full object-cover" />
                </div>
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    className="text-xl font-extrabold tracking-[-0.055em] text-[#07101f]"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    sellercrew
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                >
                  {sidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Workspace Switcher */}
          <div className="px-2 py-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-[#0B0F1A] flex items-center justify-center shrink-0">
                    {activeWorkspace?.logo ? (
                      <img
                        src={activeWorkspace.logo}
                        alt={activeWorkspace.name}
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {activeWorkspace?.name?.charAt(0) || 'S'}
                      </span>
                    )}
                  </div>
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div
                        className="flex-1 min-w-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <p className="text-sm font-medium text-[#0B0F1A] truncate">
                          {activeWorkspace?.name || 'Select Workspace'}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {activeWorkspace?.label ||
                            (activeWorkspace?.purpose === 'category' ? 'Category workspace' : 'Account workspace')}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {sidebarOpen && (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setDashboardPage('home');
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#0B0F1A] flex items-center justify-center shrink-0">
                      {ws.logo ? (
                        <img src={ws.logo} alt={ws.name} className="w-4 h-4 object-contain" />
                      ) : (
                        <span className="text-white text-[10px] font-bold">
                          {ws.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 truncate">{ws.name}</span>
                    {activeWorkspace?.id === ws.id && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#035EF9]" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-[#035EF9]"
                  onSelect={() => setWorkspaceDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator className="shrink-0" />

          {/* Navigation */}
          <ScrollArea className="min-h-0 flex-1 py-2">
            <nav className="px-2 space-y-1">
              {navGroups.map((group) => {
                const groupCollapsed = Boolean(group.collapsible && collapsedGroups[group.label]);
                return (
                  <div key={group.label} className="mb-3">
                    {/* Group Label */}
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {group.collapsible ? (
                            <button
                              type="button"
                              aria-expanded={!groupCollapsed}
                              onClick={() =>
                                setCollapsedGroups((current) => ({
                                  ...current,
                                  [group.label]: !groupCollapsed,
                                }))
                              }
                              className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                            >
                              <span>{group.label}</span>
                              <ChevronDown
                                className={`h-3 w-3 transition-transform duration-200 ${groupCollapsed ? '-rotate-90' : ''}`}
                              />
                            </button>
                          ) : (
                            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              {group.label}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Nav Items */}
                    <AnimatePresence initial={false}>
                      {(!sidebarOpen || !groupCollapsed) && (
                        <motion.div
                          initial={sidebarOpen ? { height: 0, opacity: 0 } : false}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                    {group.items.map((item) => {
                      const isActive = dashboardPage === item.page;
                      const navBtn = (
                        <button
                          key={item.page}
                          onClick={() => {
                            if (item.page === 'listing-builder' || item.page === 'assets') setSelectedProject(null);
                            setDashboardPage(item.page);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                            isActive
                              ? 'bg-[#035EF9]/10 text-[#035EF9] font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                        >
                          <item.icon
                            className={`h-[18px] w-[18px] shrink-0 ${
                              isActive ? 'text-[#035EF9]' : ''
                            }`}
                          />
                          <AnimatePresence>
                            {sidebarOpen && (
                              <motion.span
                                className="truncate"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {isActive && sidebarOpen && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="ml-auto w-1.5 h-1.5 rounded-full bg-[#035EF9]"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                        </button>
                      );

                      // Show tooltip when sidebar is collapsed
                      if (!sidebarOpen) {
                        return (
                          <Tooltip key={item.page}>
                            <TooltipTrigger asChild>{navBtn}</TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return navBtn;
                    })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
          </ScrollArea>

        </motion.aside>

        {/* ── Main Area ────────────────────────────────────────────────── */}
        <div
          className="flex h-full min-w-0 flex-col overflow-hidden transition-[margin,width] duration-200 md:ml-[var(--sidebar-width)] md:w-[calc(100%-var(--sidebar-width))]"
          style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}
        >
          {/* ── Top Bar ──────────────────────────────────────────────── */}
          <header className="h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 md:px-6 shrink-0">
            <button
              type="button"
              aria-label="Open navigation"
              className="mr-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            {/* Breadcrumb */}
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setDashboardPage('home')}
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setDashboardPage('home')}
                  >
                    {getBreadcrumb(dashboardPage).group}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[#0B0F1A] font-medium">
                    {getBreadcrumb(dashboardPage).page}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Mobile page title */}
            <h1 className="sm:hidden text-sm font-semibold text-[#0B0F1A] truncate">
              {pageTitleMap[dashboardPage]}
            </h1>

            {/* Search + Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search (decorative) */}
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-8 w-48 lg:w-56 text-sm bg-gray-50/80 border-gray-200/60 focus:bg-white"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    const match = Object.entries(pageTitleMap).find(([, title]) =>
                      title.toLowerCase().includes(searchQuery.trim().toLowerCase())
                    );
                    if (match) {
                      setDashboardPage(match[0] as DashboardPage);
                      setSearchQuery('');
                    }
                  }}
                />
              </div>

              {/* Credits */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDashboardPage('plans')}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#035EF9]/5 hover:bg-[#035EF9]/10 transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-[#035EF9]" />
                    <span className="text-xs font-medium text-[#035EF9]">{creditsBalance.toLocaleString()}</span>
                    <span className="text-[10px] text-[#035EF9]/60">credits</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Your remaining credits</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              {/* Notifications */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDashboardPage('agent-history')}
                    className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="h-[18px] w-[18px] text-gray-500" />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="h-8 w-8">
                      {user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={user?.name || 'User'} />
                      ) : null}
                      <AvatarFallback className="bg-[#0B0F1A] text-white text-xs font-medium">
                        {user?.name?.split(' ').map((n) => n[0]).join('') || 'SC'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden max-w-36 min-w-0 lg:block text-left">
                      <p className="truncate text-sm font-medium text-[#0B0F1A] leading-tight">
                        {user?.name || 'SellerCrew User'}
                      </p>
                      <p className="truncate text-[10px] text-gray-400 leading-tight">
                        {activeWorkspace?.name || 'Professional Plan'}
                      </p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden lg:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-72 rounded-xl p-2 shadow-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 p-1">
                      <Avatar className="h-10 w-10">
                        {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name || 'User'} /> : null}
                        <AvatarFallback className="bg-[#0B0F1A] text-xs font-semibold text-white">
                          {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'SC'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{user?.name || 'SellerCrew User'}</p>
                        <p className="truncate text-xs text-gray-500">{user?.email || 'demo@sellercrew.ai'}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => setDashboardPage('account-settings')}>
                    <UserCog className="mr-1 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Account settings</span>
                      <span className="text-[10px] text-gray-400">Profile, workspace, and security</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => setDashboardPage('plans')}>
                    <CreditCard className="mr-1 h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex flex-col">
                        <span>Plan and billing</span>
                        <span className="text-[10px] text-gray-400">{creditsBalance.toLocaleString()} credits remaining</span>
                      </div>
                      <Badge variant="secondary" className="border-0 bg-[#035EF9]/10 text-[10px] capitalize text-[#035EF9]">
                        {currentPlan}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => setDashboardPage('usage')}>
                    <Activity className="mr-1 h-4 w-4" />
                    Usage and credits
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => setDashboardPage('invoices')}>
                    <Receipt className="mr-1 h-4 w-4" />
                    Invoices
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                    <ClerkLogoutMenuItem onLocalLogout={() => {
                      logout();
                      setView('landing');
                    }} />
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
                      onClick={() => {
                        logout();
                        setView('landing');
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* ── Page Content ─────────────────────────────────────────── */}
          <main className="min-w-0 flex-1 overscroll-contain overflow-x-hidden overflow-y-auto p-4 md:p-6">
            <div key={effectivePage} className="min-w-0">
              {renderPage(effectivePage)}
            </div>
          </main>
        </div>

        <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a separate workspace</DialogTitle>
              <DialogDescription>
                Keep projects, listings, assets, and activity separate for another seller account or product category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace name</Label>
                <Input
                  id="workspace-name"
                  autoFocus
                  placeholder="Example: US Brand Account"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-purpose">Separate by</Label>
                <select
                  id="workspace-purpose"
                  value={workspacePurpose}
                  onChange={(event) => setWorkspacePurpose(event.target.value as 'account' | 'category')}
                  className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#035EF9]/25"
                >
                  <option value="account">Seller account / brand</option>
                  <option value="category">Product category</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-label">
                  {workspacePurpose === 'account' ? 'Account or marketplace label' : 'Category label'}
                </Label>
                <Input
                  id="workspace-label"
                  placeholder={workspacePurpose === 'account' ? 'Amazon US · Brand name' : 'Home & Kitchen'}
                  value={workspaceLabel}
                  onChange={(event) => setWorkspaceLabel(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleCreateWorkspace()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWorkspaceDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkspace}>Create workspace</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
