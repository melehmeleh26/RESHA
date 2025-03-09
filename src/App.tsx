
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import Groups from "./pages/Groups";
import Settings from "./pages/Settings";
import Scheduler from "./pages/Scheduler";
import TestFacebook from "./pages/TestFacebook";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => {
  // Set up action click handler to open in new tab
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.action) {
      chrome.action.onClicked.addListener(() => {
        chrome.tabs.create({ url: 'index.html' });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect from extension page and root to dashboard */}
            <Route path="/index.html" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/newtab" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/" element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="templates" element={<Templates />} />
              <Route path="groups" element={<Groups />} />
              <Route path="scheduler" element={<Scheduler />} />
              <Route path="settings" element={<Settings />} />
              <Route path="test-facebook" element={<TestFacebook />} />
              <Route path="logs" element={<Logs />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
