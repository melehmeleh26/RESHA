
import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, PlusCircle, Save, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Sample scheduled posts data
const initialScheduledPosts = [
  {
    id: 1,
    template: "מסעדה - הצעה מיוחדת",
    group: "עסקים באזור השרון",
    scheduledDate: new Date(2023, 8, 15, 14, 30),
    status: "pending"
  },
  {
    id: 2,
    template: "יועץ עסקי - שירותים",
    group: "קבוצת קניות ומכירות",
    scheduledDate: new Date(2023, 8, 18, 10, 0),
    status: "pending"
  },
  {
    id: 3,
    template: "חנות - מבצע סוף שבוע",
    group: "דרושים עובדים תל אביב",
    scheduledDate: new Date(2023, 8, 12, 16, 45),
    status: "completed"
  }
];

// Sample template options
const templateOptions = [
  { value: "food", label: "מסעדה - הצעה מיוחדת" },
  { value: "service", label: "יועץ עסקי - שירותים" },
  { value: "retail", label: "חנות - מבצע סוף שבוע" }
];

// Sample group options
const groupOptions = [
  { value: "group1", label: "עסקים באזור השרון" },
  { value: "group2", label: "קבוצת קניות ומכירות" },
  { value: "group3", label: "דרושים עובדים תל אביב" }
];

const Scheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useState(initialScheduledPosts);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  
  // Form state for new scheduled post
  const [newPost, setNewPost] = useState({
    template: "",
    group: "",
    time: "12:00",
    message: ""
  });

  // Filter posts for selected date
  const postsForSelectedDate = selectedDate 
    ? scheduledPosts.filter(post => 
        post.scheduledDate.getDate() === selectedDate.getDate() &&
        post.scheduledDate.getMonth() === selectedDate.getMonth() &&
        post.scheduledDate.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  // Handle scheduling a new post
  const handleSchedulePost = () => {
    if (!selectedDate || !newPost.template || !newPost.group || !newPost.time) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    const [hours, minutes] = newPost.time.split(":").map(Number);
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(hours, minutes);

    const newScheduledPost = {
      id: Math.max(0, ...scheduledPosts.map(p => p.id)) + 1,
      template: templateOptions.find(t => t.value === newPost.template)?.label || newPost.template,
      group: groupOptions.find(g => g.value === newPost.group)?.label || newPost.group,
      scheduledDate,
      status: "pending"
    };

    setScheduledPosts([...scheduledPosts, newScheduledPost]);
    setNewPost({ template: "", group: "", time: "12:00", message: "" });
    setShowNewPostForm(false);

    toast({
      title: "פוסט תוזמן בהצלחה",
      description: `הפוסט יפורסם בתאריך ${format(scheduledDate, "dd/MM/yyyy בשעה HH:mm", { locale: he })}`,
    });
  };

  // Handle deleting a scheduled post
  const handleDeletePost = (id: number) => {
    setScheduledPosts(scheduledPosts.filter(post => post.id !== id));
    toast({
      title: "פוסט נמחק",
      description: "הפוסט המתוזמן נמחק בהצלחה",
    });
  };

  // Get dates that have scheduled posts for highlighting in calendar
  const datesWithPosts = scheduledPosts.map(post => post.scheduledDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">תזמון פוסטים</h1>
            <p className="mt-2 text-muted-foreground">תזמון ותכנון פרסומים עתידיים בקבוצות פייסבוק</p>
          </div>
          <Button 
            onClick={() => setShowNewPostForm(true)} 
            className="gap-2"
            disabled={showNewPostForm || !selectedDate}
          >
            <PlusCircle className="h-4 w-4" />
            <span>תזמן פוסט חדש</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in animate-delay-100">
        <TabsList className="w-full max-w-md grid grid-cols-2">
          <TabsTrigger value="calendar">לוח שנה</TabsTrigger>
          <TabsTrigger value="list">רשימת פוסטים</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Calendar */}
            <Card className="border shadow-sm md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">לוח שנה</CardTitle>
                <CardDescription>בחר תאריך לתזמון או צפייה בפוסטים</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="pointer-events-auto mx-auto"
                  modifiersStyles={{
                    selected: { backgroundColor: "var(--primary)" }
                  }}
                  modifiers={{
                    booked: datesWithPosts.map(date => new Date(date))
                  }}
                  modifiersClassNames={{
                    booked: "border-primary border"
                  }}
                  locale={he}
                />
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                תאריכים עם מסגרת כוללים פוסטים מתוזמנים
              </CardFooter>
            </Card>

            {/* Scheduled Posts for Selected Date or New Post Form */}
            <Card className="border shadow-sm md:col-span-2 animate-scale-in">
              <CardHeader>
                <CardTitle className="text-lg">
                  {showNewPostForm 
                    ? "תזמון פוסט חדש" 
                    : selectedDate 
                      ? `פוסטים מתוזמנים לתאריך ${format(selectedDate, "dd/MM/yyyy", { locale: he })}` 
                      : "בחר תאריך לצפייה בפוסטים מתוזמנים"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showNewPostForm ? (
                  // New post form
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template">תבנית</Label>
                      <Select 
                        value={newPost.template} 
                        onValueChange={value => setNewPost({...newPost, template: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר תבנית" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {templateOptions.map(template => (
                            <SelectItem key={template.value} value={template.value}>
                              {template.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="group">קבוצה</Label>
                      <Select 
                        value={newPost.group} 
                        onValueChange={value => setNewPost({...newPost, group: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר קבוצה" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {groupOptions.map(group => (
                            <SelectItem key={group.value} value={group.value}>
                              {group.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="time">שעה</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newPost.time}
                        onChange={e => setNewPost({...newPost, time: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">הערות (אופציונלי)</Label>
                      <Textarea
                        id="message"
                        placeholder="הוסף הערות או הוראות מיוחדות..."
                        value={newPost.message}
                        onChange={e => setNewPost({...newPost, message: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  // List of posts for selected date
                  <div>
                    {postsForSelectedDate.length > 0 ? (
                      <div className="space-y-4">
                        {postsForSelectedDate.map(post => (
                          <div key={post.id} className="flex justify-between items-start border-b pb-4">
                            <div>
                              <div className="font-medium">{post.template}</div>
                              <div className="text-sm text-muted-foreground">
                                קבוצה: {post.group}
                              </div>
                              <div className="text-sm flex items-center gap-1 mt-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  {format(post.scheduledDate, "HH:mm", { locale: he })}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedDate ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>אין פוסטים מתוזמנים לתאריך זה</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setShowNewPostForm(true)}
                        >
                          תזמן פוסט חדש
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>בחר תאריך בלוח השנה כדי לצפות או לתזמן פוסטים</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              {showNewPostForm && (
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleSchedulePost}>
                    <Save className="ml-2 h-4 w-4" />
                    שמור תזמון
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">כל הפוסטים המתוזמנים</CardTitle>
              <CardDescription>רשימת כל הפוסטים המתוזמנים לפרסום</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length > 0 ? (
                <div className="divide-y">
                  {scheduledPosts
                    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
                    .map(post => (
                      <div key={post.id} className="py-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{post.template}</div>
                          <div className="text-sm text-muted-foreground">
                            קבוצה: {post.group}
                          </div>
                          <div className="text-sm flex items-center gap-1 mt-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>
                              {format(post.scheduledDate, "dd/MM/yyyy בשעה HH:mm", { locale: he })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            post.status === "completed" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          )}>
                            {post.status === "completed" ? "פורסם" : "ממתין"}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>אין פוסטים מתוזמנים</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setActiveTab("calendar");
                      setShowNewPostForm(true);
                    }}
                  >
                    תזמן פוסט חדש
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      <Card className="mt-6 border border-blue-100 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-900/20 animate-fade-in animate-delay-200">
        <CardHeader>
          <CardTitle className="text-lg">טיפים לתזמון יעיל</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-sm">
            <li>תזמן פוסטים בשעות שיא של פעילות בקבוצות (16:00-21:00 בד"כ).</li>
            <li>הימנע מתזמון יותר מדי פוסטים באותו היום לאותה קבוצה.</li>
            <li>בחר ימי פרסום שונים לקבוצות שונות כדי למקסם חשיפה.</li>
            <li>שים לב לחוקי הקבוצות לגבי תדירות פרסום מותרת.</li>
            <li>תזמן מראש פוסטים לאירועים עונתיים ומבצעים מיוחדים.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scheduler;
