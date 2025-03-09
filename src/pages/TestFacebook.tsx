
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useChromeExtension } from "@/hooks/use-chrome-extension";
import StatusCard from "@/components/facebook/StatusCard";
import GroupsList from "@/components/facebook/GroupsList";
import PostCreationForm from "@/components/facebook/PostCreationForm";
import InstructionsCard from "@/components/facebook/InstructionsCard";

const TestFacebook = () => {
  const [activeTab, setActiveTab] = useState("post");
  const [recentError, setRecentError] = useState<string | null>(null);
  const {
    isExtension,
    facebookStatus,
    availableGroups,
    sendTestPost,
    checkFacebookConnection,
    fetchUserGroups,
    isLoading,
    addLogEntry,
  } = useChromeExtension();

  useEffect(() => {
    // Check Facebook connection when component mounts
    checkFacebookConnection();
  }, []);

  // Handle test post submission
  const handlePostSubmit = async (formData: {
    content: string;
    mode: string;
    targetGroupId?: string;
  }) => {
    setRecentError(null);

    try {
      // Try to open Facebook first in a new tab if not already open
      if (!facebookStatus.inFacebookGroup) {
        await openFacebookTab();
      }

      // Create post
      const result = await sendTestPost({
        content: formData.content,
        mode: formData.mode,
        targetGroupId: formData.targetGroupId,
        closeTabAfterPost: true,
      });

      if (!result.success) {
        setRecentError(result.message || "פעולת הפרסום נכשלה");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setRecentError(errorMessage);
      addLogEntry("שגיאת פרסום", "error", errorMessage);
    }
  };

  // Function to open Facebook in a new tab
  const openFacebookTab = () => {
    if (!isExtension) {
      throw new Error("התוסף אינו פעיל");
    }

    return new Promise<void>((resolve, reject) => {
      try {
        if (chrome && chrome.tabs && 'create' in chrome.tabs) {
          chrome.tabs.create(
            {
              url: "https://www.facebook.com/groups/feed/",
              active: true,
            },
            () => {
              // Give Facebook a moment to load
              setTimeout(() => {
                addLogEntry(
                  "פתיחת פייסבוק",
                  "info",
                  "דף הקבוצות של פייסבוק נפתח בהצלחה"
                );
                resolve();
              }, 3000);
            }
          );
        } else {
          throw new Error("לא ניתן לפתוח חלון פייסבוק חדש - תכונת chrome.tabs.create לא זמינה");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addLogEntry("שגיאת פתיחת דפדפן", "error", errorMessage);
        reject(error);
      }
    });
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
        {/* Status and Instructions */}
        <div className="space-y-6 animate-fade-in animate-delay-200">
          <StatusCard facebookStatus={facebookStatus} isExtension={isExtension} />
          
          <InstructionsCard
            isExtension={isExtension}
            onCheckConnection={checkFacebookConnection}
            onFetchGroups={fetchUserGroups}
            isLoading={isLoading}
          />
        </div>

        {/* Tabs and Post Creation */}
        <div className="space-y-6 animate-fade-in animate-delay-300">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>יצירת בדיקת פרסום</CardTitle>
              <CardDescription>
                צור פוסט לבדיקה והפעל אותו בקבוצות פייסבוק
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    onSubmit={handlePostSubmit}
                    isLoading={isLoading} 
                    groups={availableGroups}
                    isExtension={isExtension}
                    facebookStatus={facebookStatus}
                  />
                </TabsContent>

                <TabsContent value="groups" className="mt-4">
                  <GroupsList
                    groups={availableGroups}
                    isLoading={isLoading}
                    onRefresh={fetchUserGroups}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestFacebook;
