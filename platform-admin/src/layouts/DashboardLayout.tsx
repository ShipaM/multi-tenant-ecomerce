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

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </header>

        <div className="flex flex-1 flex-col">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
