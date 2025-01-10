"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  CalendarRange,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      active: pathname === "/admin",
    },
    {
      label: "Venues",
      icon: Store,
      href: "/admin/venues",
      active: pathname === "/admin/venues",
    },
    {
      label: "Menu",
      icon: UtensilsCrossed,
      href: "/admin/menu",
      active: pathname === "/admin/menu",
    },
    {
      label: "Owner Management",
      icon: User,
      href: "/admin/accountmanagement",
      active: pathname === "/admin/accountmanagement",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white border-r fixed top-16 w-72">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold">Admin Panel</h2>
            <div className="space-y-1">
              {routes.map((route) => (
                <Link key={route.href} href={route.href}>
                  <Button
                    variant={route.active ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <route.icon className="h-5 w-5 mr-3" />
                    {route.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
