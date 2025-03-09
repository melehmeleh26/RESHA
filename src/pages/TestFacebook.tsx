
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useChromeExtension } from "@/hooks/use-chrome-extension";
import StatusCard from "@/components/facebook/StatusCard";
import GroupsList from "@/components/facebook/GroupsList";
import PostCreationForm from "@/components/facebook/PostCreationForm";
import InstructionsCard from "@/components/facebook/InstructionsCard";
import { toast } from "@/hooks/use-toast";

const TestFacebook = () => {
  const [activeTab, setActiveTab] = useState("post");
  const [recentError, setRecentError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  
  const {
    isExtension,
    facebookStatus,
    availableGroups,
    checkFacebookConnection,
    fetchUserGroups,
    isLoading,
    addLogEntry,
  } = useChromeExtension();

  useEffect(() => {
    // Check Facebook connection when component mounts
    checkFacebookConnection();
    
    // Load groups when component mounts
    handleRefreshGroups();
    
    // Set up interval to check for groups every 5 seconds if none are found
    // and we're running as an extension
    const intervalId = setInterval(() => {
      if (availableGroups.length === 0 && isExtension) {
        console.log("No groups found, attempting to fetch again...");
        fetchUserGroups();
      } else if (availableGroups.length > 0) {
        // Clear the interval once we have groups
        clearInterval(intervalId);
        console.log(`Found ${availableGroups.length} groups, stopping auto-refresh`);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [isExtension, availableGroups.length]);

  // If we have groups and no group is selected, select the first one
  useEffect(() => {
    if (availableGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(availableGroups[0].id);
    }
  }, [availableGroups, selectedGroupId]);

  const handleRefreshGroups = () => {
    setIsFetching(true);
    addLogEntry('מרענן קבוצות', 'info', 'מנסה לטעון קבוצות פייסבוק');
    
    // If we're not running as an extension, we can't fetch groups
    if (!isExtension) {
      toast({
        title: "תוסף דפדפן לא פעיל",
        description: "התוסף אינו פעיל, לא ניתן לטעון קבוצות",
        variant: "destructive",
      });
      setIsFetching(false);
      return;
    }
    
    // Fetch groups from Facebook
    fetchUserGroups();
    
    // Set a timeout to hide the loading indicator after 5 seconds
    // but don't affect the actual loading state from the hook
    setTimeout(() => {
      setIsFetching(false);
      
      // Show success or warning toast based on results
      if (availableGroups.length > 0) {
        toast({
          title: "קבוצות נטענו בהצלחה",
          description: `נמצאו ${availableGroups.length} קבוצות פייסבוק`,
        });
      } else {
        toast({
          title: "מנסה למשוך קבוצות",
          description: "פותח דף קבוצות ומנסה למשוך נתונים",
        });
      }
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold animate-fade-in">בדיקת פרסום בפייסבוק</h1>
        <p className="mt-2 text-muted-foreground animate-fade-in animate-delay-100">
          בדוק את יכולת הפרסום בקבוצות פייסבוק
        </p>
      </div>

      {/* Error Alert */}
      {recentError && (
        <Alert variant="destructive" className="animate-scale-in">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>שגיאה בפרסום</AlertTitle>
          <AlertDescription>{recentError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6 animate-fade-in animate-delay-200">
          <StatusCard 
            facebookStatus={facebookStatus} 
            isExtension={isExtension} 
            availableGroups={availableGroups}
            handleRefreshGroups={handleRefreshGroups}
            isFetching={isFetching}
            isLoading={isLoading}
          />
          
          <InstructionsCard
            isExtension={isExtension}
            onCheckConnection={checkFacebookConnection}
            onFetchGroups={handleRefreshGroups}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6 animate-fade-in animate-delay-300">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="post">
                פרסום ידני
              </TabsTrigger>
              <TabsTrigger value="groups">
                קבוצות פייסבוק
              </TabsTrigger>
            </TabsList>

            <TabsContent value="post" className="mt-4">
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

            <TabsContent value="groups" className="mt-4">
              <GroupsList
                availableGroups={availableGroups}
                selectedGroupId={selectedGroupId}
                setSelectedGroupId={setSelectedGroupId}
                handleRefreshGroups={handleRefreshGroups}
                isFetching={isFetching}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TestFacebook;
