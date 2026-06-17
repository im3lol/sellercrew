'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Route } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAppStore } from '@/lib/store';
import { useDashboardStore } from '@/lib/dashboard-store';

// Brand styling for the driver.js popover. It's appended to document.body (outside
// the React tree), so these rules must be global — a plain <style> tag is fine.
const TOUR_STYLES = `
  .sc-tour.driver-popover {
    --sc-grad: linear-gradient(90deg, #035EF9, #7E44E6);
    border-radius: 16px;
    padding: 16px 18px 14px;
    max-width: 344px;
    box-shadow: 0 24px 60px rgba(2, 6, 23, 0.28);
  }
  .sc-tour .sc-tour-brand { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
  .sc-tour .sc-tour-brand img { width: 22px; height: 22px; border-radius: 6px; object-fit: cover; }
  .sc-tour .sc-tour-brand span { font-weight: 800; font-size: 13px; letter-spacing: -0.02em; color: #0f172a; }
  .sc-tour .driver-popover-title { font-size: 16px; font-weight: 700; color: #0f172a; }
  .sc-tour .driver-popover-description { font-size: 13.5px; line-height: 1.5; color: #64748b; }
  .sc-tour .driver-popover-progress-text { font-size: 12px; color: #94a3b8; }
  .sc-tour .driver-popover-footer button { text-shadow: none; box-shadow: none; }
  .sc-tour .driver-popover-prev-btn {
    background: #fff; border: 1px solid #e2e8f0; color: #475569;
    border-radius: 8px; padding: 5px 12px; font-size: 13px; font-weight: 500;
  }
  .sc-tour .driver-popover-next-btn {
    background: var(--sc-grad); border: none; color: #fff;
    border-radius: 8px; padding: 5px 14px; font-size: 13px; font-weight: 600;
  }
  .sc-tour .driver-popover-next-btn:hover { opacity: 0.92; }
  .sc-tour .driver-popover-close-btn { color: #94a3b8; }
`;

export function OnboardingJourney() {
  const user = useAppStore((s) => s.user);
  const dismissOnboarding = useDashboardStore((s) => s.dismissOnboarding);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const startTour = useCallback(() => {
    // Expand the sidebar so its group labels & items are visible, then measure.
    useAppStore.getState().setSidebarOpen(true);

    window.setTimeout(() => {
      const firstName = user?.name ? user.name.split(' ')[0] : null;
      type Side = 'top' | 'right' | 'bottom' | 'left';
      type Align = 'start' | 'center' | 'end';

      // Include a step only when its anchor exists (pages/items are role-gated).
      const at = (sel: string, title: string, description: string, side: Side, align: Align = 'start') =>
        document.querySelector(sel) ? [{ element: sel, popover: { title, description, side, align } }] : [];

      const steps = [
        {
          popover: {
            title: 'Meet SellerCrew',
            description: `${firstName ? `Hi ${firstName}! ` : ''}Let’s take a quick tour of your AI listing workspace — about a minute.`,
          },
        },
        ...at('[data-tour="home-welcome"]', 'Your command center', 'A snapshot of your workspace — credits, quick actions, and your AI crew at a glance.', 'bottom', 'center'),
        ...at('[data-tour="home-stats"]', 'Key metrics', 'Active projects, saved keywords, listings created, and your average compliance score.', 'bottom', 'center'),
        ...at('[data-tour="home-activity"]', 'Recent activity', 'See what your agents have been working on most recently.', 'top'),
        ...at('[data-tour="header-search"]', 'Quick search', 'Jump to any page — type a name and press Enter.', 'bottom', 'end'),
        ...at('[data-tour="header-credits"]', 'Your credits', 'Your remaining credits. Click to view plans and top up.', 'bottom', 'end'),
        ...at('[data-tour="header-notifications"]', 'Notifications', 'Activity and run updates show up here.', 'bottom', 'end'),
        ...at('[data-tour="header-user-menu"]', 'Your account', 'Account settings, billing, usage, and sign out.', 'bottom', 'end'),
        ...at('[data-tour="workspace-switcher"]', 'Workspaces', 'Switch between workspaces or create a new one for a different brand or account.', 'right'),
        ...at('[data-tour="nav-projects"]', 'Projects', 'Organize each product in its own project — assets, listing, and history together.', 'right'),
        ...at('[data-tour="nav-listing-builder"]', 'Full Listing Workflow', 'The heart of SellerCrew: run the 11-agent crew to produce a complete, compliant listing end to end.', 'right'),
        ...at('[data-tour="nav-listings"]', 'Listings', 'Review and edit every generated listing — title, bullets, description and keywords.', 'right'),
        ...at('[data-tour="nav-assets"]', 'Assets', 'Source images and generated visuals, backed up to your Google Drive.', 'right'),
        ...at('[data-tour="nav-group-tools"]', 'Standalone tools', 'Need just one thing? Keyword research, competitor analysis, listing review, and policy checks — each on its own.', 'right'),
        ...at('[data-tour="nav-group-team"]', 'Your AI crew', 'Meet the 11 specialist agents and review their performance and history.', 'right'),
        {
          popover: {
            title: 'You’re all set 🚀',
            description: 'Create your first project and run the workflow — your first listing is minutes away. Replay this tour anytime from the “Take a tour” button.',
          },
        },
      ];

      driverRef.current?.destroy();
      const d = driver({
        showProgress: true,
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Get started',
        popoverClass: 'sc-tour',
        overlayColor: '#0f172a',
        overlayOpacity: 0.6,
        stagePadding: 6,
        stageRadius: 10,
        onPopoverRender: (popover) => {
          if (popover.wrapper.querySelector('.sc-tour-brand')) return;
          const brand = document.createElement('div');
          brand.className = 'sc-tour-brand';
          brand.innerHTML = '<img src="/logo2.png" alt="" /><span>sellercrew</span>';
          popover.wrapper.prepend(brand);
        },
        onDestroyed: () => dismissOnboarding(),
        steps,
      });
      driverRef.current = d;
      d.drive();
    }, 220);
  }, [user?.name, dismissOnboarding]);

  // Auto-start once for a brand-new user (after the sidebar has rendered).
  useEffect(() => {
    const t = setTimeout(() => {
      if (useDashboardStore.getState().onboardingDismissed) return;
      startTour();
    }, 650);
    return () => clearTimeout(t);
  }, [startTour]);

  // Tear the tour down if the page unmounts mid-tour.
  useEffect(() => () => driverRef.current?.destroy(), []);

  return (
    <>
      <style>{TOUR_STYLES}</style>
      <button
        type="button"
        onClick={startTour}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#035EF9] to-[#7E44E6] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#7E44E6]/30 transition hover:opacity-90"
      >
        <Route className="h-4 w-4" />
        Take a tour
      </button>
    </>
  );
}
