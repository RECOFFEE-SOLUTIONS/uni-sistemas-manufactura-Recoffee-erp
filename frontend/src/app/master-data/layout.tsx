import React from "react";
import ModuleTabs from "@/components/ModuleTabs";

export default function MasterDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <ModuleTabs module="master-data" />
      {children}
    </div>
  );
}
