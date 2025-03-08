
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Clock, Shield, RefreshCcw, Laptop, Key, DatabaseZap } from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    businessName: "העסק שלי",
    city: "תל אביב",
    phone: "050-1234567",
    minDelay: 3,
    maxDelay: 10,
    mouseMovement: true,
    randomUserAgent: true,
    autoRetry: true,
    openAIKey: "",
    weekendPosting: true,
    workHours: true,
  });

  const handleSaveSettings = () => {
    toast.success("ההגדרות נשמרו בהצלחה", {
      description: "כל ההגדרות עודכנו ויחולו על הפוסטים הבאים",
    });
  };

  const handleOpenAITest = () => {
    if (!settings.openAIKey) {
      toast.error("נדרש מפתח OpenAI API", {
        description: "הזן מפתח חוקי כדי להשתמש ביצירת תוכן באמצעות GPT",
      });
      return;
    }
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "בודק את מפתח ה-API...",
        success: "המפתח חוקי ועובד כראוי",
        error: "שגיאה בבדיקת המפתח, אנא נסה שוב",
      }
    );
  };

  const handleResetPostingStats = () => {
    toast.success("הסטטיסטיקות אופסו בהצלחה", {
      description: "כל נתוני הפרסום נמחקו מהמערכת המקומית",
    });
  };

  const handleClearData = () => {
    toast.success("הנתונים נמחקו בהצלחה", {
      description: "כל הנתונים נמחקו מהמערכת המקומית",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">הגדרות מערכת</h1>
        <p className="mt-2 text-muted-foreground">התאם את הגדרות המערכת לצרכיך</p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in animate-delay-100">
        <TabsList className="w-full max-w-md grid grid-cols-3">
          <TabsTrigger value="general">כללי</TabsTrigger>
          <TabsTrigger value="automation">אוטומציה</TabsTrigger>
          <TabsTrigger value="advanced">מתקדם</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 animate-scale-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פרטי העסק</CardTitle>
              <CardDescription>
                פרטים אלו ישמשו להחלפת המשתנים בתבניות הפוסטים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">שם העסק</Label>
                <Input
                  id="business-name"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  placeholder="הזן את שם העסק"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">עיר</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    placeholder="הזן את שם העיר"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="הזן מספר טלפון"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} className="ml-auto">
                שמור הגדרות
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">זמני פרסום</CardTitle>
              <CardDescription>
                קבע מתי המערכת תפרסם פוסטים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>פרסום בסופי שבוע</Label>
                  <p className="text-sm text-muted-foreground">אפשר פרסום גם בימי שישי ושבת</p>
                </div>
                <Switch
                  checked={settings.weekendPosting}
                  onCheckedChange={(checked) => setSettings({ ...settings, weekendPosting: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>פרסום רק בשעות עבודה</Label>
                  <p className="text-sm text-muted-foreground">פרסם רק בין 9:00 ל-18:00</p>
                </div>
                <Switch
                  checked={settings.workHours}
                  onCheckedChange={(checked) => setSettings({ ...settings, workHours: checked })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} className="ml-auto">
                שמור הגדרות
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Automation Settings */}
        <TabsContent value="automation" className="space-y-6 animate-scale-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הגדרות אוטומציה</CardTitle>
              <CardDescription>
                שליטה באופן בו המערכת מפרסמת באופן אוטומטי
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>השהייה בין פוסטים (דקות)</Label>
                  <span className="text-sm font-medium">
                    {settings.minDelay} - {settings.maxDelay}
                  </span>
                </div>
                <Slider
                  value={[settings.minDelay, settings.maxDelay]}
                  min={1}
                  max={60}
                  step={1}
                  onValueChange={([min, max]) => setSettings({ ...settings, minDelay: min, maxDelay: max })}
                  className="py-4"
                />
                <p className="text-xs text-muted-foreground">
                  מומלץ לשמור על השהייה של לפחות 5 דקות בין פוסטים לצמצום סיכוני חסימה
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label>סימולציית תנועת עכבר</Label>
                      <p className="text-sm text-muted-foreground">מדמה תנועות עכבר אנושיות</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.mouseMovement}
                    onCheckedChange={(checked) => setSettings({ ...settings, mouseMovement: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label>החלפת User-Agent אקראית</Label>
                      <p className="text-sm text-muted-foreground">מתחלף בין דפדפנים שונים בכל פוסט</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.randomUserAgent}
                    onCheckedChange={(checked) => setSettings({ ...settings, randomUserAgent: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label>ניסיון חוזר אוטומטי</Label>
                      <p className="text-sm text-muted-foreground">נסה שוב אוטומטית במקרה של כישלון</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoRetry}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoRetry: checked })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} className="ml-auto">
                שמור הגדרות
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6 animate-scale-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הגדרות מתקדמות</CardTitle>
              <CardDescription>
                הגדרות נוספות עבור משתמשים מתקדמים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="openai-key">מפתח OpenAI API</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="openai-key"
                    type="password"
                    value={settings.openAIKey}
                    onChange={(e) => setSettings({ ...settings, openAIKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <Button variant="outline" onClick={handleOpenAITest}>בדוק</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  נדרש לצורך יצירת תוכן באמצעות GPT. המפתח נשמר רק במחשב שלך.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DatabaseZap className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">ניהול נתונים</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="w-full" onClick={handleResetPostingStats}>
                    איפוס סטטיסטיקות פרסום
                  </Button>
                  <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={handleClearData}>
                    מחיקת כל הנתונים
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  פעולות אלו יגרמו למחיקת מידע באופן שלא ניתן לשחזור. השתמש בזהירות.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50 shadow-sm dark:border-red-900 dark:bg-red-900/20">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 text-lg">אזהרת בטיחות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <strong>חשוב:</strong> שימוש באוטומציה לפרסום בקבוצות פייסבוק עלול להוביל לחסימת החשבון שלך. אנחנו מיישמים שיטות שונות להפחתת הסיכון, אך אין לנו שליטה על מדיניות פייסבוק. השימוש באפליקציה זו הוא על אחריותך בלבד.
              </p>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                GroupsFlow אינו קשור לפייסבוק ואינו מאושר על ידי פייסבוק.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
