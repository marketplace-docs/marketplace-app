"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "../ui/button"
import {
  CircleUser,
  Home,
  LogOut,
  Search,
  Settings,
  User,
} from "lucide-react"
import { SidebarTrigger } from "../ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "../ui/avatar"

export function AppHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  }
  
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index < segments.length - 1 ? (
                  <BreadcrumbLink asChild>
                    <Link href={`/${segments.slice(0, index + 1).join("/")}`}>
                      <span className="capitalize">{segment}</span>
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>
                    <span className="capitalize">{segment}</span>
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-auto px-2 gap-2">
              <div className="flex flex-col items-end">
                  <span className="font-semibold text-sm">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <Avatar className="h-8 w-8">
                   <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user?.name)}
                  </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/app">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
               <Link href="/settings/app">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
