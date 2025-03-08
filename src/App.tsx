
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
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

export default App;
