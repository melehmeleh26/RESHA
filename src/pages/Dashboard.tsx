
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Clock, CheckCircle, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  
  // Mock activity data
  const recentActivity = [
    { id: 1, group: "עסקים באזור השרון", status: "success", time: "לפני 2 שעות" },
    { id: 2, group: "קבוצת קניות ומכירות", status: "pending", time: "מתוזמן ל-15:30" },
    { id: 3, group: "דרושים עובדים תל אביב", status: "error", time: "לפני 5 שעות" },
  ];

  // Stats data
  const stats = [
    { label: "פוסטים שנשלחו", value: 7 },
    { label: "קבוצות פעילות", value: 3 },
    { label: "אחוז הצלחה", value: "85%" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">שלום, משתמש</h1>
        <p className="mt-2 text-muted-foreground">ברוך הבא למערכת GroupsFlow. הנה סיכום הפעילות שלך.</p>
      </div>

      {/* Control Card */}
      <Card className="overflow-hidden border-2 border-primary/10 shadow-md animate-scale-in">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-xl">מצב מערכת</CardTitle>
          <CardDescription>שליטה בהפצת הפוסטים האוטומטיים</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative h-32 w-32">
              <div className={`absolute inset-0 rounded-full ${isRunning ? 'bg-primary/10 animate-pulse' : 'bg-secondary'} transition-all duration-300`}></div>
              <Button
                variant="outline"
                size="icon"
                className={`absolute inset-0 flex h-full w-full items-center justify-center rounded-full border-2 ${isRunning ? 'border-primary/50 bg-white text-primary' : 'border-muted-foreground/20 bg-white text-muted-foreground'} shadow-sm transition-all duration-300 hover:scale-105`}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10" />}
              </Button>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium">
                {isRunning ? 'המערכת פעילה' : 'המערכת מושהית'}
              </div>
              <p className="text-sm text-muted-foreground">
                {isRunning ? 'הפוסטים נשלחים אוטומטית לפי הגדרות המערכת' : 'לחץ על הכפתור להפעלת המערכת'}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-secondary/50 px-6 py-3">
          <div className="text-sm">
            <span className="font-medium">מצב שליחה:</span>{" "}
            <span className="text-muted-foreground">
              {isRunning ? 'ממתין לפוסט הבא (5:32 דקות)' : 'מושהה'}
            </span>
          </div>
          <Button variant="link" size="sm" className="p-0">
            הגדרות מתקדמות
          </Button>
        </CardFooter>
      </Card>

      {/* Stats & Activity */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Stats */}
        <Card className="border shadow-sm md:col-span-1 animate-scale-in animate-delay-100">
          <CardHeader>
            <CardTitle className="text-lg">סטטיסטיקות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className="font-medium">{stat.value}</span>
                  </div>
                  <Progress value={index === 0 ? 70 : index === 1 ? 100 : 85} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="mx-auto px-0 py-0 text-xs text-muted-foreground">
              צפה בכל הסטטיסטיקות
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Activity */}
        <Card className="border shadow-sm md:col-span-2 animate-scale-in animate-delay-200">
          <CardHeader>
            <CardTitle className="text-lg">פעילות אחרונה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {activity.status === "success" ? (
                      <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                    ) : activity.status === "pending" ? (
                      <Clock className="ml-2 h-5 w-5 text-amber-500" />
                    ) : (
                      <AlertCircle className="ml-2 h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{activity.group}</div>
                      <div className="text-sm text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs"
                  >
                    פרטים
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" size="sm">
              צפה בכל הפעילות
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Premium Banner */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6 shadow-sm animate-fade-in animate-delay-300">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h3 className="text-lg font-medium">שדרג לתוכנית פרימיום</h3>
            <p className="text-sm text-muted-foreground">
              קבל גישה ל-5 פוסטים ביום, 15 קבוצות ותמיכה מועדפת
            </p>
          </div>
          <Button className="shrink-0 bg-primary shadow-md hover:shadow-lg">
            שדרג עכשיו ב- ₪97/חודש
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
