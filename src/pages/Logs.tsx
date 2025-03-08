
import { useState } from "react";
import { useChromeExtension } from "@/hooks/use-chrome-extension";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

const Logs = () => {
  const { logs, clearLogs, isExtension } = useChromeExtension();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return "bg-green-500";
      case 'error':
        return "bg-red-500";
      case 'warning':
        return "bg-amber-500";
      case 'info':
      default:
        return "bg-blue-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">הצלחה</Badge>;
      case 'error':
        return <Badge className="bg-red-500">שגיאה</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500">אזהרה</Badge>;
      case 'info':
      default:
        return <Badge className="bg-blue-500">מידע</Badge>;
    }
  };

  // Filter logs by status and search term
  const filteredLogs = logs.filter(log => {
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Format ISO date to readable format
  const formatDate = (isoDate: string) => {
    try {
      return format(new Date(isoDate), "dd/MM/yyyy HH:mm:ss");
    } catch (e) {
      return isoDate;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">יומן פעילות</h1>
        <p className="mt-2 text-muted-foreground">יומן פעילות מערכת GroupsFlow</p>
      </div>

      {/* Filters and actions */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">סינון וחיפוש</CardTitle>
          <CardDescription>סננו את יומן הפעילות לפי סטטוס או חיפוש טקסט חופשי</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="חיפוש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הסטטוסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="success">הצלחה</SelectItem>
                  <SelectItem value="error">שגיאה</SelectItem>
                  <SelectItem value="warning">אזהרה</SelectItem>
                  <SelectItem value="info">מידע</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={clearLogs}
              disabled={!isExtension || logs.length === 0}
            >
              נקה יומן
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log entries */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">רשומות יומן ({filteredLogs.length})</CardTitle>
          <CardDescription>האירועים האחרונים במערכת</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>לא נמצאו רשומות ביומן</p>
              {!isExtension && <p className="mt-2 text-sm">התוסף אינו פעיל. היומן יעבוד כאשר התוסף מותקן ומופעל.</p>}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(log.status)}`}></div>
                    <span>{log.action}</span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(log.timestamp)}
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="mt-2 whitespace-pre-wrap text-sm">{log.details}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Help card */}
      {!isExtension && (
        <Card className="border border-amber-100 bg-amber-50 shadow-sm dark:border-amber-900 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <p className="text-amber-800 dark:text-amber-400">
              <strong>התוסף אינו פעיל.</strong> היומן מציג רשומות רק כאשר התוסף מותקן ומופעל.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Logs;
