/**
 * Layout components barrel export.
 *
 * Usage:
 * ```ts
 * import { Navbar, Sidebar, Footer, DashboardLayout, AdminSidebar } from '@/components/layout';
 * ```
 */

export { Navbar } from './Navbar';
export type { NavbarProps, NavbarUser } from './Navbar';

export { Sidebar } from './Sidebar';
export type { SidebarProps, SidebarItem, SidebarSection, SidebarUser } from './Sidebar';

export { Footer } from './Footer';
export type { FooterProps } from './Footer';

export { DashboardLayout } from './DashboardLayout';
export type { DashboardLayoutProps, Breadcrumb } from './DashboardLayout';

export { AdminSidebar } from './AdminSidebar';
export type { AdminSidebarProps, AdminSidebarItem, AdminSidebarSection } from './AdminSidebar';
