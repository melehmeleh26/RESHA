
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
import { ListFilter, RefreshCw, UserCheck, ImagePlus, Clock, Calendar, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TestFacebook = () => {
  const { 
    isExtension, 
    facebookStatus, 
    sendTestPost, 
    addLogEntry, 
    checkFacebookConnection, 
    availableGroups, 
    fetchUserGroups,
    isLoading
  } = useChromeExtension();
  const [testPostContent, setTestPostContent] = useState("");
  const [testMode, setTestMode] = useState("post"); // Changed default to "post" instead of "fill"
  const [isFetching, setIsFetching] = useState(false);
  const [closeTabAfterPost, setCloseTabAfterPost] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState("post");
  const [imageUpload, setImageUpload] = useState<boolean>(false);
  const [scheduledPost, setScheduledPost] = useState<boolean>(false);
  const [postSchedule, setPostSchedule] = useState<string>("now");

  // Check connection on mount
  useEffect(() => {
    if (isExtension) {
      checkFacebookConnection();
    }
  }, [isExtension]);

  const handleTestPost = async () => {
    if (!testPostContent) {
      toast({
        title: "שגיאה",
        description: "נא להזין תוכן לפוסט",
        variant: "destructive"
      });
      addLogEntry('שגיאת פרסום', 'error', 'ניסיון פרסום עם תוכן ריק');
      return;
    }

    if (!selectedGroupId) {
      toast({
        title: "שגיאה",
        description: "נא לבחור קבוצת פייסבוק",
        variant: "destructive"
      });
      addLogEntry('שגיאת פרסום', 'error', 'ניסיון פרסום ללא בחירת קבוצה');
      return;
    }

    setIsFetching(true);
    
    try {
      const result = await sendTestPost({
        content: testPostContent,
        mode: testMode,
        closeTabAfterPost,
        targetGroupId: selectedGroupId
      });
      
      if (result.success) {
        toast({
          title: "פרסום בוצע בהצלחה",
          description: result.message || "הפעולה בוצעה בהצלחה"
        });
      } else {
        toast({
          title: "שגיאה בפרסום",
          description: result.message || "אירעה שגיאה במהלך הפרסום",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בפרסום",
        description: "אירעה שגיאה לא צפויה",
        variant: "destructive"
      });
      console.error("Error running test post:", error);
      addLogEntry('שגיאת פרסום חריגה', 'error', `שגיאה לא צפויה: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleRefreshGroups = () => {
    setIsFetching(true);
    addLogEntry('רענון ידני', 'info', 'המשתמש ביקש לרענן את רשימת הקבוצות');
    
    fetchUserGroups();
    checkFacebookConnection();
    
    toast({
      title: "רענון קבוצות",
      description: "מנסה לטעון את רשימת הקבוצות..."
    });
    
    // Set a timeout to show loading state and then clear it
    setTimeout(() => {
      setIsFetching(false);
      
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
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">בדיקות פרסום</h1>
        <p className="mt-2 text-muted-foreground">בדיקת פרסום אוטומטי בקבוצות פייסבוק</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full animate-fade-in animate-delay-100">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="post">יצירת פוסט</TabsTrigger>
          <TabsTrigger value="status">סטטוס וקבוצות</TabsTrigger>
        </TabsList>

        {/* Post Creation Tab */}
        <TabsContent value="post" className="space-y-6">
          <Card className="border shadow-md animate-fade-in animate-delay-200">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl">יצירת פוסט</CardTitle>
              <CardDescription>הגדר את תוכן הפוסט שברצונך לפרסם</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-6">
              {/* Post Content */}
              <div className="space-y-2">
                <Label htmlFor="testContent" className="text-lg font-medium">תוכן הפוסט</Label>
                <Textarea
                  id="testContent"
                  placeholder="הקלד כאן את תוכן הפוסט..."
                  value={testPostContent}
                  onChange={(e) => setTestPostContent(e.target.value)}
                  className="min-h-[150px] text-base focus:border-primary"
                />
              </div>

              {/* Media Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">הוספת תמונה</Label>
                  <Switch 
                    checked={imageUpload} 
                    onCheckedChange={setImageUpload} 
                  />
                </div>
                
                {imageUpload && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center justify-center border-2 border-dashed rounded-md h-[100px] cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center">
                        <ImagePlus className="h-6 w-6 mb-1 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">העלאת תמונה</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center border-2 border-dashed rounded-md h-[100px] cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-6 w-6 mb-1 text-muted-foreground"
                        >
                          <path d="M5.52 19.346a2 2 0 0 1-1.4-2.45l1.865-7a2 2 0 0 1 1.94-1.514H16.2a2 2 0 0 1 1.906 1.38L20 14" />
                          <path d="M8.037 9.382a9 9 0 0 0-6.72 10.46 9 9 0 0 0 10.459 6.718 9 9 0 0 0 6.719-10.459A9 9 0 0 0 8.037 9.382Z" />
                          <circle cx="15" cy="13" r="2" />
                        </svg>
                        <span className="text-sm text-muted-foreground">תמונות מאגר</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Group Selection Section */}
              <div className="space-y-2">
                <Label className="text-lg font-medium">בחירת קבוצות</Label>
                <div className="border rounded-md p-2">
                  {availableGroups.length === 0 ? (
                    <div className="text-center py-4">
                      <UserCheck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">לא נמצאו קבוצות. לחץ על כפתור "רענן רשימת קבוצות"</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={handleRefreshGroups}
                        disabled={isFetching || isLoading}
                      >
                        <RefreshCw className={`ml-2 h-4 w-4 ${(isFetching || isLoading) ? "animate-spin" : ""}`} />
                        רענן רשימת קבוצות
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px] rounded-md">
                      <div className="space-y-2 p-1">
                        {availableGroups.map(group => (
                          <div
                            key={group.id}
                            className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted ${
                              selectedGroupId === group.id ? 'bg-primary/10 border border-primary/30' : 'bg-card'
                            }`}
                            onClick={() => setSelectedGroupId(group.id)}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{group.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{group.url}</p>
                            </div>
                            <Badge variant={group.status === 'active' ? 'default' : 'outline'}>
                              {group.status === 'active' ? 'פעיל' : 'לא פעיל'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>

              {/* Schedule Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">תזמון פרסום</Label>
                  <Switch 
                    checked={scheduledPost} 
                    onCheckedChange={setScheduledPost} 
                  />
                </div>
                
                {scheduledPost && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button 
                      variant={postSchedule === "now" ? "default" : "outline"} 
                      className="justify-start" 
                      onClick={() => setPostSchedule("now")}
                    >
                      <Timer className="mr-2 h-4 w-4" />
                      כרגע
                    </Button>
                    <Button 
                      variant={postSchedule === "tomorrow" ? "default" : "outline"} 
                      className="justify-start" 
                      onClick={() => setPostSchedule("tomorrow")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      מחר
                    </Button>
                    <Button 
                      variant={postSchedule === "custom" ? "default" : "outline"} 
                      className="justify-start" 
                      onClick={() => setPostSchedule("custom")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      מותאם אישית
                    </Button>
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="close-tab"
                    checked={closeTabAfterPost}
                    onCheckedChange={setCloseTabAfterPost}
                  />
                  <Label htmlFor="close-tab">סגור טאב אוטומטית לאחר פרסום</Label>
                </div>

                <div>
                  <Label htmlFor="testMode">מצב פרסום</Label>
                  <Select value={testMode} onValueChange={setTestMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מצב פרסום" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fill">מילוי בלבד (ללא פרסום)</SelectItem>
                      <SelectItem value="post">פרסום אמיתי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/30 flex justify-between">
              <Button variant="outline">שמור כטיוטה</Button>
              <Button 
                onClick={handleTestPost} 
                disabled={!isExtension || isFetching || isLoading || !selectedGroupId || !testPostContent}
                className="px-8"
              >
                {isFetching || isLoading ? "מפרסם..." : "פרסם עכשיו"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Status & Groups Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Extension Status */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">סטטוס</CardTitle>
                <CardDescription>מצב תוסף הדפדפן וחיבור לפייסבוק</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">תוסף דפדפן:</div>
                  <div className="text-sm">
                    {isExtension ? (
                      <span className="text-green-600 dark:text-green-400">פעיל</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">לא פעיל</span>
                    )}
                  </div>
                  
                  <div className="text-sm font-medium">קבוצת פייסבוק:</div>
                  <div className="text-sm">
                    {facebookStatus.inFacebookGroup ? (
                      <span className="text-green-600 dark:text-green-400">מחובר</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">לא מחובר</span>
                    )}
                  </div>

                  <div className="text-sm font-medium">קבוצות זמינות:</div>
                  <div className="text-sm">
                    <span className={availableGroups.length > 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                      {availableGroups.length || 0}
                    </span>
                  </div>
                </div>

                {!isExtension && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <strong>תוסף הדפדפן אינו פעיל.</strong> כדי להשתמש בתכונות בדיקת פייסבוק, עליך להפעיל את התוסף ולהתחבר לחשבון הפייסבוק שלך.
                  </div>
                )}

                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshGroups}
                    size="sm"
                    disabled={isFetching || isLoading}
                  >
                    <RefreshCw className={`ml-2 h-4 w-4 ${(isFetching || isLoading) ? "animate-spin" : ""}`} />
                    רענן מצב וקבוצות
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/logs">צפה ביומן פעילות</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Group Selection */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">קבוצות זמינות</CardTitle>
                <CardDescription>רשימת קבוצות פייסבוק שאפשר לפרסם בהן</CardDescription>
              </CardHeader>
              <CardContent>
                {availableGroups.length === 0 ? (
                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <p className="flex items-center">
                      <UserCheck className="ml-2 h-5 w-5" />
                      <span>לא נמצאו קבוצות פייסבוק. לחץ על כפתור "רענן מצב וקבוצות" כדי לנסות שוב.</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ScrollArea className="h-[200px] px-1">
                      <div className="space-y-2">
                        {availableGroups.map(group => (
                          <div
                            key={group.id}
                            className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted ${
                              selectedGroupId === group.id ? 'bg-primary/10 border border-primary/30' : 'bg-card'
                            }`}
                            onClick={() => setSelectedGroupId(group.id)}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{group.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{group.url}</p>
                            </div>
                            <Badge variant={group.status === 'active' ? 'default' : 'outline'}>
                              {group.status === 'active' ? 'פעיל' : 'לא פעיל'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm" 
                      onClick={handleRefreshGroups}
                      disabled={isFetching || isLoading}
                    >
                      <ListFilter className={`ml-2 h-4 w-4 ${(isFetching || isLoading) ? "animate-spin" : ""}`} />
                      רענן רשימת קבוצות
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button variant="outline" className="md:col-span-2" asChild>
              <Link to="/groups">
                צפייה וניהול כל הקבוצות
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card className="border border-blue-100 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-900/20 animate-fade-in animate-delay-200">
        <CardHeader>
          <CardTitle className="text-lg">הוראות שימוש בבדיקות</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>וודא שהתוסף מותקן ופעיל (אייקון GroupsFlow בסרגל התוספים)</li>
            <li>לחץ על "רענן מצב וקבוצות" כדי לקבל את רשימת הקבוצות הזמינות</li>
            <li>בחר את הקבוצה בה תרצה לבצע את הבדיקה</li>
            <li>בחר את מצב הבדיקה - מילוי בלבד או פרסום מלא</li>
            <li>הזן את תוכן הפוסט לבדיקה</li>
            <li>לחץ על "פרסם עכשיו" - המערכת תפתח פייסבוק ברקע ותסגור אוטומטית לאחר הפעולה</li>
            <li>ניתן לראות את ההיסטוריית הפעולות <Link to="/logs" className="text-primary hover:underline">ביומן הפעילות</Link></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestFacebook;
