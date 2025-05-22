import { useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Menu, X } from "lucide-react";
import RecordAttendance from "./RecordAttendance";
import ManageSubjects from "./ManageSubjects";
import ManageStudents from "./ManageStudent"; // Add this import
import ViewReports from "./ViewReports";
import GradeManagement from "./GradeManagement";

export default function Dashboard() {
  const [active, setActive] = useState("attendance");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { key: "attendance", label: "📌 Record Attendance" },
    { key: "subjects", label: "📘 Manage Subjects & Grades" },
    { key: "students", label: "👥 Manage Students" }, // Make sure this matches
    { key: "reports", label: "📊 View Reports" },
    { key: "grades", label: "📝 Grade Management" },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error signing out:", error.message);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 shadow">
        <h2 className="text-xl font-semibold text-blue-600">Dashboard</h2>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-white shadow-md p-6 md:min-h-screen`}
      >
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Menu</h2>
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`text-left px-4 py-2 rounded-lg transition ${
                active === item.key
                  ? "bg-blue-500 text-white"
                  : "hover:bg-blue-100 text-gray-700"
              }`}
              onClick={() => {
                setActive(item.key);
                setSidebarOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-8">
          <button
            className="w-full px-4 py-2 text-left bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {active === "attendance" && <RecordAttendance />}
        {active === "subjects" && <ManageSubjects />}
        {active === "students" && <ManageStudents />} {/* Now properly defined */}
        {active === "reports" && <ViewReports />}
        {active === "grades" && <GradeManagement />}
      </main>
    </div>
  );
}