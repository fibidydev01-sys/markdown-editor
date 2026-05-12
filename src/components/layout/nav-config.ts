/**
 * Sidebar navigation configuration.
 *
 * UPDATED in Phase B: added Notebooks entry.
 */

import {
  LayoutDashboard,
  BarChart3,
  User,
  Settings,
  ShieldCheck,
  CreditCard,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    title: "Notebooks",
    href: ROUTES.NOTEBOOKS,
    icon: BookOpen,
  },
  {
    title: "Overview",
    href: ROUTES.OVERVIEW,
    icon: BarChart3,
  },
  {
    title: "Subscription",
    href: ROUTES.PAY,
    icon: CreditCard,
  },
  {
    title: "Profile",
    href: ROUTES.PROFILE,
    icon: User,
  },
  {
    title: "Settings",
    href: ROUTES.SETTINGS,
    icon: Settings,
  },
];

export const adminNavItems: NavItem[] = [
  {
    title: "Admin",
    href: ROUTES.ADMIN,
    icon: ShieldCheck,
    adminOnly: true,
  },
];

export function getNavItems(isAdmin: boolean): NavSection[] {
  if (isAdmin) {
    return [
      {
        title: "Menu",
        items: mainNavItems,
      },
      {
        title: "Administration",
        items: adminNavItems,
      },
    ];
  }

  return [
    {
      items: mainNavItems,
    },
  ];
}

export function getAllNavItems(isAdmin: boolean): NavItem[] {
  if (isAdmin) {
    return [...mainNavItems, ...adminNavItems];
  }
  return mainNavItems;
}
