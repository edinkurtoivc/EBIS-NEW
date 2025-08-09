
import { useState } from "react";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/dashboard/Dashboard";

export default function Index() {
  return (
    <div className="flex h-full flex-col">
      <Header title="Dashboard" />
      <div className="page-container">
        <Dashboard />
      </div>
    </div>
  );
}
