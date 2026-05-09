import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import SidebarNav from "@/components/console/sidebar/nav";

export default async function ConsoleLayout({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar?: Sidebar;
}) {
  return (
    <div className="container md:max-w-7xl mx-auto min-h-[calc(100vh-16rem)] py-12">
      <div className="w-full p-4 md:p-6 pb-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16 lg:items-start">
          {sidebar?.nav?.items && (
            <aside className="lg:min-w-44 lg:pt-1 flex-shrink-0">
              <SidebarNav items={sidebar.nav?.items} />
            </aside>
          )}
          <div className="flex-1 lg:max-w-full min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
