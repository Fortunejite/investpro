'use client';

import { useAppSelector } from "@/hooks/redux.hook";
import { notFound } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppSelector(state => state.user)

  if (user?.role !== 'admin') {
    return notFound();
  }
  
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminNavbar />
      <main className="lg:ml-64">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
