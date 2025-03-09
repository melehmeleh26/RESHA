
import { useState } from "react";
import { useChromeExtension } from "@/hooks/use-chrome-extension";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, UserCheck, ImagePlus, Clock, Calendar, Timer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FacebookGroup } from "@/types/facebook";

interface PostCreationFormProps {
  availableGroups: FacebookGroup[];
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  handleRefreshGroups: () => void;
  isFetching: boolean;
  isLoading: boolean;
  isExtension: boolean;
}

const PostCreationForm = ({
  availableGroups,
  selectedGroupId,
  setSelectedGroupId,
  handleRefreshGroups,
  isFetching,
  isLoading,
  isExtension
}: PostCreationFormProps) => {
  const { sendTestPost, addLogEntry } = useChromeExtension();
  const [testPostContent, setTestPostContent] = useState("");
  const [testMode, setTestMode] = useState("post");
  const [closeTabAfterPost, setCloseTabAfterPost] = useState(true);
  const [imageUpload, setImageUpload] = useState<boolean>(false);
  const [scheduledPost, setScheduledPost] = useState<boolean>(false);
  const [postSchedule, setPostSchedule] = useState<string>("now");

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
    }
  };

  return (
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
  );
};

export default PostCreationForm;
