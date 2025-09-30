
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
import { useState, useMemo } from 'react';
import { SheetHeader, SheetTitle } from '../ui/sheet';
import { useAuth } from '@/hooks/use-auth';

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
  const { permissions } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(
    NAV_LINKS.find(link => link.children?.some(child => pathname.startsWith(child.href)))?.label || null
  );

  const filteredNavLinks = useMemo(() => {
    // If permissions are not yet loaded, return an empty array to prevent rendering.
    if (!permissions) return [];

    const filterLinks = (links: NavLink[]): NavLink[] => {
      return links.reduce((acc, link) => {
        const effectiveHref = link.children ? `group-${link.label}` : link.href;

        // Check if the permission for this link/group is true
        if (permissions[effectiveHref]) {
          const newLink = { ...link };
          if (link.children) {
            // Recursively filter children
            newLink.children = filterLinks(link.children);
            // Only include parent menu if it has any visible children
            if (newLink.children.length > 0) {
              acc.push(newLink);
            }
          } else {
            // It's a single link, add it if it has permission
            acc.push(newLink);
          }
        }
        return acc;
      }, [] as NavLink[]);
    };

    return filterLinks(NAV_LINKS);
  }, [permissions]);

  const isActive = (link: NavLink) => {
    if (link.href === '/') return pathname === '/';
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
       <SheetHeader className="p-2 border-b md:hidden">
          <div className="flex items-center justify-between">
            <AppLogo />
             <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <ChevronsLeft />
            </Button>
          </div>
        </SheetHeader>
      <SidebarHeader className="border-b hidden md:flex">
        <div className="flex w-full items-center justify-between p-2">
            <div className="group-data-[collapsible=icon]:hidden">
              <AppLogo />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <ChevronsLeft className="duration-200 group-data-[state=expanded]:rotate-0 group-data-[state=collapsed]:rotate-180" />
            </Button>
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1 p-4">
        {filteredNavLinks.map((link) => (
          <SidebarMenuItem key={`${link.href}-${link.label}`}>
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
    </Sidebar>
  );
}
