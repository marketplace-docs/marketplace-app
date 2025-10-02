

import { LayoutDashboard, ListTodo, Store, FileText, Settings, type LucideIcon, Briefcase, Users, Archive, BarChart3, AppWindow, BookText, Database, History, FilePlus, Eye, File, PieChart, Users2, Shield, Menu, Monitor, Undo2, Route, Package, PackagePlus, PackageMinus, Boxes, CalendarClock, Warehouse, Calculator, PackageX, ClipboardList, ScanLine, PackageCheck, ShoppingCart, Send, Handshake, ArrowRightSquare, ArrowLeftRight, Server, Printer, RefreshCw } from 'lucide-react';

export type NavLink = {
    href: string;
    label: string;
    icon: LucideIcon;
    children?: NavLink[];
};

export const NAV_LINKS: NavLink[] = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        href: '#',
        label: 'Admin Task',
        icon: Briefcase,
        children: [
            {
                href: '/admin-task/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/admin-task/monitoring-manpower',
                label: 'Monitoring Manpower',
                icon: Eye,
            },
             {
                href: '/admin-task/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
     {
        href: '/inbound',
        label: 'Inbound',
        icon: PackagePlus,
        children: [
             {
                href: '/inbound/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/inbound/monitoring',
                label: 'Monitoring',
                icon: Eye,
            },
             {
                href: '/inbound/task',
                label: 'Task',
                icon: ListTodo,
            },
             {
                href: '/internal-transfer/from-vendor',
                label: 'Transfer From Vendor',
                icon: Store,
            },
        ]
    },
    {
        href: '/putaway',
        label: 'Putaway',
        icon: Archive,
         children: [
            {
                href: '/putaway/go-putaway',
                label: 'Go-Putaway',
                icon: Route,
            },
            {
                href: '/putaway/monitoring-document',
                label: 'Monitoring',
                icon: Eye,
            },
             {
                href: '/putaway/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
    {
        href: '#',
        label: 'Return',
        icon: Undo2,
         children: [
            {
                href: '/return/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/return/monitoring-document',
                label: 'Monitoring',
                icon: Eye,
            },
             {
                href: '/return/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
    {
        href: '#',
        label: 'Cycle Count',
        icon: Calculator,
         children: [
            {
                href: '/cycle-count/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/cycle-count/cc-location',
                label: 'CC Location',
                icon: Warehouse,
            },
            {
                href: '/cycle-count/monitoring',
                label: 'Monitoring Cycle Count',
                icon: Eye,
            },
             {
                href: '/cycle-count/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
     {
        href: '/ecommerce',
        label: 'e-Commerce',
        icon: ShoppingCart,
        children: [
            {
                href: '/ecommerce/my-orders',
                label: 'My Orders',
                icon: ClipboardList,
            },
            {
                href: '/ecommerce/monitoring-orders',
                label: 'Monitoring Orders',
                icon: Monitor,
            },
             {
                href: '/ecommerce/reprint-label',
                label: 'Reprint-Label',
                icon: Printer,
            },
            {
                href: '/ecommerce/go-picker',
                label: 'Go-Picker',
                icon: ScanLine,
            },
            {
                href: '/ecommerce/out-of-stock',
                label: 'Out of Stock',
                icon: PackageX,
            },
            {
                href: '/ecommerce/outbound',
                label: 'Outbound',
                icon: PackageCheck,
            },
             {
                href: '/ecommerce/outbound-monitoring',
                label: 'Outbound Monitoring',
                icon: Eye,
            },
            {
                href: '/ecommerce/dispatcher',
                label: 'Dispatcher',
                icon: Send,
            },
             {
                href: '/ecommerce/shipment-monitoring',
                label: 'Shipment Monitoring',
                icon: Eye,
            },
             {
                href: '/ecommerce/handover-3pl',
                label: 'Handover 3PL',
                icon: Handshake,
            },
        ]
    },
    {
        href: '/master-product',
        label: 'Batch Product',
        icon: Boxes,
        children: [
             {
                href: '/master-product/batch-product',
                label: 'Product Stock',
                icon: Package,
            },
            {
                href: '/master-product/stock-log',
                label: 'Stock Log',
                icon: History,
            },
             {
                href: '/master-product/location',
                label: 'Location',
                icon: Warehouse,
            },
        ]
    },
    {
        href: '#',
        label: 'Internal Transfer',
        icon: ArrowLeftRight,
        children: [
            {
                href: '/internal-transfer/from-warehouse',
                label: 'Transfer From Warehouse',
                icon: Warehouse,
            },
            {
                href: '/internal-transfer/from-b2b',
                label: 'Transfer From B2B',
                icon: Briefcase,
            },
            {
                href: '/internal-transfer/from-b2c',
                label: 'Transfer From B2C',
                icon: Users,
            },
            {
                href: '/internal-transfer/monitoring',
                label: 'Monitoring',
                icon: Eye,
            },
        ]
    },
    {
        href: '/marketplace',
        label: 'Marketplace',
        icon: Store,
        children: [
            {
                href: '/marketplace/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/marketplace/monitoring-store',
                label: 'Monitoring Store',
                icon: Eye,
            },
             {
                href: '/tasks',
                label: 'Task',
                icon: ListTodo,
            },
            {
                href: '/marketplace/sync',
                label: 'Sync',
                icon: RefreshCw,
            },
        ]
    },
    {
        href: '/reports',
        label: 'Reports',
        icon: FileText,
         children: [
            {
                href: '/backlog',
                label: 'Backlog',
                icon: Archive,
            },
            {
                href: '/reports/daily-performance',
                label: 'Daily Performance',
                icon: BarChart3,
            },
            {
                href: '/reports/kpi-performance',
                label: 'KPI Performance',
                icon: PieChart,
            },
        ]
    },
    {
        href: '/database',
        label: 'Database',
        icon: Database,
        children: [
            {
                href: '/database/master-product',
                label: 'Master Product',
                icon: Package,
            },
            {
                href: '/database/user-management',
                label: 'User Management',
                icon: Users2,
            },
            {
                href: '/database/role',
                label: 'Role',
                icon: Shield,
            },
             {
                href: '/master/menu',
                label: 'Menu Permission',
                icon: Menu,
            },
             {
                href: '/database/log-activity',
                label: 'Log Activity',
                icon: History,
            },
        ]
    },
    {
        href: '/app-documentation',
        label: 'Dokumentasi Aplikasi',
        icon: BookText,
    },
    {
        href: '/settings/app',
        label: 'Settings',
        icon: Settings,
    }
];
