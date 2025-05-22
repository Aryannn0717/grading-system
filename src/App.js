import "./App.css";
import { useState, useEffect } from "react";
import { supabase } from "./supabase/supabaseClient";
import Auth from "./components/Auth";
import Dashboard from "./components/dashboard";
import StudentView from "./components/StudentView";

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await checkUserRole(session.user.id);
      }
      setLoading(false);
    };
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await checkUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
  
    fetchSession(); // Initial fetch
  
    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
  
      if (error) throw error;
      setUserRole(data?.role || 'student'); // Default to student if null
    } catch (error) {
      console.error('Role check failed:', error);
      setUserRole('student'); // Fallback role
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container">
      {!session ? (
        <Auth />
      ) : (
        <StudentView key={session.user.id} session={session} />
      )}
    </div>
  );
}

export default App;