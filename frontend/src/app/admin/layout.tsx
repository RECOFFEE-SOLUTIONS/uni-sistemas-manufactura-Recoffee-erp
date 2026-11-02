import React from "react";
import ModuleTabs from "@/components/ModuleTabs";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <ModuleTabs module="admin" />
      <main className="w-full">{children}</main>
    </div>
  );
}
