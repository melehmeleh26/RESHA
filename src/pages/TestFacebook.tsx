
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
import { ListFilter, RefreshCw, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const TestFacebook = () => {
  const { 
    isExtension, 
    facebookStatus, 
    sendTestPost, 
    addLogEntry, 
    checkFacebookConnection, 
    availableGroups, 
    fetchUserGroups 
  } = useChromeExtension();
  const [testPostContent, setTestPostContent] = useState("");
  const [testMode, setTestMode] = useState("fill"); // "fill" or "post"
  const [isLoading, setIsLoading] = useState(false);
  const [closeTabAfterPost, setCloseTabAfterPost] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

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
      addLogEntry('Test Post Error', 'error', 'ניסיון פרסום עם תוכן ריק');
      return;
    }

    if (!selectedGroupId) {
      toast({
        title: "שגיאה",
        description: "נא לבחור קבוצת פייסבוק",
        variant: "destructive"
      });
      addLogEntry('Test Post Error', 'error', 'ניסיון פרסום ללא בחירת קבוצה');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await sendTestPost({
        content: testPostContent,
        mode: testMode,
        closeTabAfterPost,
        targetGroupId: selectedGroupId
      });
      
      if (result.success) {
        toast({
          title: "בדיקה בוצעה בהצלחה",
          description: result.message || "הפעולה בוצעה בהצלחה"
        });
      } else {
        toast({
          title: "שגיאה בבדיקה",
          description: result.message || "אירעה שגיאה במהלך הבדיקה",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בבדיקה",
        description: "אירעה שגיאה לא צפויה",
        variant: "destructive"
      });
      console.error("Error running test post:", error);
      addLogEntry('Test Post Exception', 'error', `שגיאה לא צפויה: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">בדיקות פרסום</h1>
        <p className="mt-2 text-muted-foreground">בדיקת פרסום אוטומטי בקבוצות פייסבוק</p>
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Extension Status and Group Selection */}
        <div className="space-y-6">
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
                  onClick={() => {
                    checkFacebookConnection();
                    fetchUserGroups();
                  }} 
                  size="sm"
                >
                  <RefreshCw className="ml-2 h-4 w-4" />
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
              <CardTitle className="text-lg">בחירת קבוצה</CardTitle>
              <CardDescription>בחר קבוצת פייסבוק לביצוע הבדיקה</CardDescription>
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
                          <Badge variant={group.status === 'active' ? 'success' : 'outline'}>
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
                    onClick={fetchUserGroups}
                  >
                    <ListFilter className="ml-2 h-4 w-4" />
                    רענן רשימת קבוצות
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Form */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">בדיקת פרסום</CardTitle>
            <CardDescription>הרץ בדיקת פרסום אוטומטי בקבוצת פייסבוק</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testMode">מצב בדיקה</Label>
              <Select value={testMode} onValueChange={setTestMode}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מצב בדיקה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fill">מילוי בלבד (ללא פרסום)</SelectItem>
                  <SelectItem value="post">פרסום מלא</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="close-tab"
                checked={closeTabAfterPost}
                onCheckedChange={setCloseTabAfterPost}
              />
              <Label htmlFor="close-tab">סגור לשונית אוטומטית לאחר פרסום</Label>
            </div>

            <div>
              <Label htmlFor="testContent">תוכן הפוסט</Label>
              <Textarea
                id="testContent"
                placeholder="הזן את תוכן הפוסט לבדיקה..."
                value={testPostContent}
                onChange={(e) => setTestPostContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {selectedGroupId && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
                <strong>קבוצה נבחרה:</strong> {availableGroups.find(g => g.id === selectedGroupId)?.name || selectedGroupId}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleTestPost} 
              disabled={!isExtension || isLoading || !selectedGroupId}
              className="w-full"
            >
              {isLoading ? "מבצע בדיקה..." : "הרץ בדיקה"}
            </Button>
          </CardFooter>
        </Card>
      </div>

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
            <li>לחץ על "הרץ בדיקה" - המערכת תפתח פייסבוק ברקע ותסגור אוטומטית לאחר הפעולה</li>
            <li>ניתן לראות את ההיסטוריית הפעולות <Link to="/logs" className="text-primary hover:underline">ביומן הפעילות</Link></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestFacebook;
