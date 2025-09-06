'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { NAV_LINKS, type NavLink } from '@/lib/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { MoreHorizontal, ChevronsLeft, ChevronDown, Store } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';

function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
      <Store
        className="h-6 w-6 text-primary"
      />
      <span className="text-primary">Market</span>
      <span className="text-primary">Place</span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(
    NAV_LINKS.find(link => link.children?.some(child => pathname.startsWith(child.href)))?.label || null
  );

  const isActive = (link: NavLink) => {
    if (link.href === '/') return pathname === '/';
    // For parent links, check if the current path starts with the link's href.
    if (link.children) {
      return pathname.startsWith(link.href);
    }
    return pathname === link.href;
  };

  const handleSubmenuToggle = (label: string) => {
    setOpenSubmenu(prev => prev === label ? null : label);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex w-full items-center justify-between p-2">
            <div className="group-data-[collapsible=icon]:hidden">
              <AppLogo />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <ChevronsLeft className="duration-200 group-data-[state=expanded]:rotate-0 group-data-[state=collapsed]:rotate-180" />
            </Button>
        </div>
      </SidebarHeader>
      <SidebarMenu className="p-4">
        {NAV_LINKS.map((link) => (
          <SidebarMenuItem key={link.href}>
            {link.children ? (
              <Collapsible open={openSubmenu === link.label} onOpenChange={() => handleSubmenuToggle(link.label)}>
                <CollapsibleTrigger asChild>
                   <SidebarMenuButton
                    isActive={isActive(link)}
                    tooltip={{
                      children: link.label,
                      side: 'right',
                      align: 'center',
                    }}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {link.children.map(child => (
                      <SidebarMenuItem key={child.href}>
                        <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                          <Link href={child.href}>{child.label}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={isActive(link)}
                tooltip={{
                  children: link.label,
                  side: 'right',
                  align: 'center',
                }}
              >
                <Link href={link.href}>
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter className="mt-auto p-4">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3">
          <div className="h-10 w-10 rounded-full bg-primary" />
          <div className="flex-1 space-y-1 text-sm group-data-[collapsible=icon]:hidden">
            <p className="font-semibold">Admin User</p>
            <p className="text-muted-foreground">admin@market.place</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 group-data-[collapsible=icon]:hidden">
            <MoreHorizontal className="h-4 w-4"/>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
