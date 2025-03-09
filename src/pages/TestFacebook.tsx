
import { useState, useEffect } from "react";
import { useChromeExtension } from "@/hooks/use-chrome-extension";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ListFilter, RefreshCw, UserCheck, ImagePlus, Clock, Calendar, Timer, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PostCreationForm from "@/components/facebook/PostCreationForm";
import StatusCard from "@/components/facebook/StatusCard";
import GroupsList from "@/components/facebook/GroupsList";
import InstructionsCard from "@/components/facebook/InstructionsCard";

const TestFacebook = () => {
  const { 
    isExtension, 
    facebookStatus, 
    availableGroups, 
    fetchUserGroups,
    isLoading,
    checkFacebookConnection
  } = useChromeExtension();
  
  const [selectedTab, setSelectedTab] = useState("post");
  const [isFetching, setIsFetching] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Check connection on mount
  useEffect(() => {
    if (isExtension) {
      checkFacebookConnection();
    }
  }, [isExtension]);

  // Set a default group if we have groups and none is selected
  useEffect(() => {
    if (availableGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(availableGroups[0].id);
    }
  }, [availableGroups, selectedGroupId]);

  const handleRefreshGroups = () => {
    setIsFetching(true);
    setRefreshAttempted(true);
    
    // Force a refresh of the connection status and groups
    console.log("Manual refresh requested");
    
    // First check if we're in a Facebook tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, url: "*://*.facebook.com/*" }, (tabs) => {
        if (tabs.length > 0) {
          console.log("Found active Facebook tab:", tabs[0].url);
          // We have an active Facebook tab, let's try to get data from it
          if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              type: 'FORCE_GROUP_SCAN',
              urgent: true
            });
          }
        } else {
          console.log("No active Facebook tab, asking background script to find or create one");
          // No active Facebook tab, ask the background script to find or create one
          chrome.runtime.sendMessage({ 
            type: 'FORCE_FETCH_GROUPS',
            createTabIfNeeded: true
          });
        }
      });
    }
    
    toast({
      title: "רענון קבוצות",
      description: "מנסה לטעון את רשימת הקבוצות..."
    });
    
    // Set a timeout to wait for group data to be returned
    setTimeout(() => {
      fetchUserGroups();
      checkFacebookConnection();
      
      setTimeout(() => {
        setIsFetching(false);
        
        // Check if we have groups after the refresh
        if (availableGroups.length === 0) {
          toast({
            title: "לא נמצאו קבוצות",
            description: "נסה לפתוח את פייסבוק בטאב אחר ולגשת לאחת הקבוצות שלך",
            variant: "destructive"
          });
        } else {
          toast({
            title: "קבוצות נטענו בהצלחה",
            description: `נמצאו ${availableGroups.length} קבוצות זמינות`
          });
        }
      }, 2000);
    }, 3000);
  };

  const openFacebookGroups = () => {
    if (isExtension && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: "https://www.facebook.com/groups/feed/" });
      toast({
        title: "נפתח עמוד קבוצות",
        description: "עמוד הקבוצות של פייסבוק נפתח בלשונית חדשה"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">בדיקות פרסום</h1>
        <p className="mt-2 text-muted-foreground">בדיקת פרסום אוטומטי בקבוצות פייסבוק</p>
      </div>

      {refreshAttempted && availableGroups.length === 0 && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>לא ניתן לטעון קבוצות</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>וודא כי:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>אתה מחובר לחשבון הפייסבוק שלך</li>
                <li>יש לך הרשאות גישה לקבוצות</li>
                <li>יש לך לשונית פייסבוק פתוחה</li>
                <li>אתה בדף של אחת מהקבוצות שלך</li>
              </ol>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={openFacebookGroups}
              >
                פתח קבוצות פייסבוק
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full animate-fade-in animate-delay-100">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="post">יצירת פוסט</TabsTrigger>
          <TabsTrigger value="status">סטטוס וקבוצות</TabsTrigger>
        </TabsList>

        {/* Post Creation Tab */}
        <TabsContent value="post" className="space-y-6">
          <PostCreationForm 
            availableGroups={availableGroups} 
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            handleRefreshGroups={handleRefreshGroups}
            isFetching={isFetching}
            isLoading={isLoading}
            isExtension={isExtension}
          />
        </TabsContent>

        {/* Status & Groups Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Extension Status */}
            <StatusCard 
              isExtension={isExtension}
              facebookStatus={facebookStatus}
              availableGroups={availableGroups}
              handleRefreshGroups={handleRefreshGroups}
              isFetching={isFetching}
              isLoading={isLoading}
            />

            {/* Group Selection */}
            <GroupsList 
              availableGroups={availableGroups}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              handleRefreshGroups={handleRefreshGroups}
              isFetching={isFetching}
              isLoading={isLoading}
            />

            <Button variant="outline" className="md:col-span-2" asChild>
              <Link to="/groups">
                צפייה וניהול כל הקבוצות
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <InstructionsCard />
    </div>
  );
};

export default TestFacebook;
