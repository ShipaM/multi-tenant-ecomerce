import { Suspense } from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { RouteFallback } from "@/components/route-fallback";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet } from "react-router";
import { Input } from "@/components/ui/input";
import { SearchIcon, User2Icon } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useAppSelector } from "@/hooks/use-store";
import {
  PopoverTrigger,
  Popover,
  PopoverContent,
} from "@/components/ui/popover";
import { PrefetchLink } from "@/components/PrefetchLink";

const DashboardLayout = () => {
  const user = useAppSelector((state) => state.auth.user);
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4 my-auto"
          />
          <div className="max-w-sm lg:max-w-sm h-10 w-full">
            <SearchIcon className="size-4 absolute ml-3 mt-3 text-primary" />
            <Input
              placeholder="search store, order, agent..."
              className="w-full h-full pl-8"
            />
          </div>
          <div className="ml-auto">
            <Popover>
              <PopoverTrigger>
                <UserAvatar user={user} className="cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent>
                <PrefetchLink
                  prefetchModule="profile"
                  to="/dashboard/my-account"
                  className="flex items-center gap-3"
                >
                  <User2Icon className="size-4" />
                  My Account
                </PrefetchLink>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
