import {
  BarChartIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LifeBuoyIcon,
  LogOut,
  type LucideIcon,
  MegaphoneIcon,
  Settings,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Store,
  Truck,
  Users,
  WalletIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import PlatformLogo from "@/assets/platform-logo.png";
import { PrefetchLink } from "./PrefetchLink";
import { useLocation } from "react-router";
import { cn } from "cn";
import type { RouteModuleKey } from "@/routes/route-modules";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { UserAvatar } from "./UserAvatar";
import { fetchLogout } from "@/store/auth/authSlice";

type SidebarNavItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  routemodule: RouteModuleKey;
};

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    Icon: LayoutDashboardIcon,
    routemodule: "dashboard",
  },
  {
    label: "Sellers",
    href: "/dashboard/sellers",
    Icon: Store,
    routemodule: "sellers",
  },
  {
    label: "Commision & Payouts",
    href: "/dashboard/commision-payouts",
    Icon: WalletIcon,
    routemodule: "commisionPayouts",
  },
  {
    label: "Global Catalog",
    href: "/dashboard/global-catalog",
    Icon: LayoutGridIcon,
    routemodule: "globalCatalog",
  },
  {
    label: "Delivery Network",
    href: "/dashboard/delivery-network",
    Icon: Truck,
    routemodule: "deliveryNetwork",
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    Icon: Users,
    routemodule: "customers",
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    Icon: ShoppingBagIcon,
    routemodule: "orders",
  },
  {
    label: "Supports",
    href: "/dashboard/support",
    Icon: LifeBuoyIcon,
    routemodule: "support",
  },
  {
    label: "Marketing",
    href: "/dashboard/marketing",
    Icon: MegaphoneIcon,
    routemodule: "marketing",
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    Icon: BarChartIcon,
    routemodule: "reports",
  },
  {
    label: "Users & Permissions",
    href: "/dashboard/users-permissions",
    Icon: ShieldCheckIcon,
    routemodule: "usersPermissions",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    Icon: Settings,
    routemodule: "settings",
  },
];

export const AppSidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const logoutLoading =
    useAppSelector((state) => state.auth.status) === "loading";

  const handleLogout = () => {
    dispatch(fetchLogout());
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-4">
          <img
            src={PlatformLogo}
            alt="Platform Admin Logo"
            className="size-10 rounded-xl"
          />
          <span className="text-base font-bold text-white">Platform</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {SIDEBAR_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "text-white hover:bg-white/10 hover:text-white px-2 py-3 h-10",
                      isActive && "bg-[#9fe870]/15 text-[#9fe870]",
                    )}
                  >
                    <PrefetchLink
                      to={item.href}
                      prefetchModule={item.routemodule}
                      className="flex gap-2 font-inherit"
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.Icon className="size-5" />
                      {item.label}
                    </PrefetchLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-1 rounded-md bg-white/[0.06] p-2">
          <div className="flex flex-1 items-center gap-2">
            <div>
              <UserAvatar user={user} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {user?.fullName}
              </div>
              <div className="truncate text-xs text-accent">{user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            disabled={logoutLoading}
            onClick={handleLogout}
            aria-label="Log out"
            className="shrink-0 cursor-pointer p-2 rounded-md text-accent hover:bg-white/10"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
