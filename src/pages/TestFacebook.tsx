
import { useState } from "react";
import { useChromeExtension } from "@/hooks/use-chrome-extension";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const TestFacebook = () => {
  const { isExtension, facebookStatus, sendTestPost } = useChromeExtension();
  const [testPostContent, setTestPostContent] = useState("");
  const [testMode, setTestMode] = useState("fill"); // "fill" or "post"
  const [isLoading, setIsLoading] = useState(false);

  const handleTestPost = async () => {
    if (!testPostContent) {
      toast({
        title: "שגיאה",
        description: "נא להזין תוכן לפוסט",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await sendTestPost({
        content: testPostContent,
        mode: testMode
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
            </div>

            {!isExtension && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <strong>תוסף הדפדפן אינו פעיל.</strong> כדי להשתמש בתכונות בדיקת פייסבוק, עליך להפעיל את התוסף ולהתחבר לחשבון הפייסבוק שלך.
              </div>
            )}

            {isExtension && !facebookStatus.inFacebookGroup && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <strong>קבוצת פייסבוק לא נמצאה.</strong> נא לפתוח קבוצת פייסבוק בלשונית פעילה כדי לבצע בדיקות.
              </div>
            )}
          </CardContent>
        </Card>

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
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleTestPost} 
              disabled={!isExtension || !facebookStatus.inFacebookGroup || isLoading}
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
            <li>פתח קבוצת פייסבוק באותו דפדפן בלשונית נפרדת</li>
            <li>בחר את מצב הבדיקה - מילוי בלבד או פרסום מלא</li>
            <li>הזן את תוכן הפוסט לבדיקה</li>
            <li>לחץ על "הרץ בדיקה" ועבור ללשונית הפייסבוק כדי לראות את התוצאות</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestFacebook;
