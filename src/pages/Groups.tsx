
import { useState, useEffect } from "react";
import { useChromeExtension } from "@/hooks/use-chrome-extension";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Search, ExternalLink, Users, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Sample groups data
const initialGroups = [
  {
    id: 1,
    name: "עסקים באזור השרון",
    url: "https://facebook.com/groups/123456789",
    members: 15200,
    active: true,
    lastPost: "לפני 2 ימים",
    category: "business",
  },
  {
    id: 2,
    name: "קבוצת קניות ומכירות",
    url: "https://facebook.com/groups/987654321",
    members: 34500,
    active: true,
    lastPost: "היום",
    category: "marketplace",
  },
  {
    id: 3,
    name: "דרושים עובדים תל אביב",
    url: "https://facebook.com/groups/456789123",
    members: 8900,
    active: false,
    lastPost: "לפני 5 ימים",
    category: "jobs",
  },
];

const Groups = () => {
  const [groups, setGroups] = useState(initialGroups);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("manual"); // "manual" or "facebook"
  const [searchQuery, setSearchQuery] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    url: "",
    category: "business",
  });
  
  const { availableGroups, fetchUserGroups, checkFacebookConnection, isExtension } = useChromeExtension();

  // Load Facebook groups on component mount
  useEffect(() => {
    if (isExtension && viewMode === "facebook") {
      handleRefreshGroups();
    }
  }, [isExtension, viewMode]);

  // Filter groups based on active tab and search query
  const filteredGroups = groups
    .filter(group => activeTab === "all" || group.category === activeTab)
    .filter(group => 
      searchQuery === "" || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleAddGroup = () => {
    if (!newGroup.name || !newGroup.url) return;
    
    setGroups([
      ...groups,
      {
        id: Math.max(0, ...groups.map(g => g.id)) + 1,
        name: newGroup.name,
        url: newGroup.url,
        members: 0,
        active: true,
        lastPost: "טרם פורסם",
        category: newGroup.category,
      },
    ]);
    
    setNewGroup({
      name: "",
      url: "",
      category: "business",
    });
    
    setAddingGroup(false);
  };

  const toggleGroupActive = (id: number) => {
    setGroups(
      groups.map(group =>
        group.id === id ? { ...group, active: !group.active } : group
      )
    );
  };

  const removeGroup = (id: number) => {
    setGroups(groups.filter(group => group.id !== id));
  };

  const handleRefreshGroups = () => {
    if (!isExtension) {
      toast({
        title: "התוסף אינו פעיל",
        description: "התקן והפעל את תוסף הדפדפן כדי לטעון קבוצות פייסבוק",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    fetchUserGroups();
    checkFacebookConnection();
    
    toast({
      title: "טוען קבוצות",
      description: "מנסה לטעון את רשימת הקבוצות מפייסבוק..."
    });
    
    // Set a timeout to show loading state and then clear it
    setTimeout(() => {
      setIsLoading(false);
      
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">קבוצות פייסבוק</h1>
            <p className="mt-2 text-muted-foreground">ניהול הקבוצות שבהן יפורסמו הפוסטים האוטומטיים</p>
          </div>
          <Button onClick={() => setAddingGroup(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>הוסף קבוצה</span>
          </Button>
        </div>
      </div>

      {/* View Mode Selection */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full animate-fade-in">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">קבוצות מנוהלות</TabsTrigger>
          <TabsTrigger value="facebook">קבוצות פייסבוק שלי</TabsTrigger>
        </TabsList>
        
        {/* Manual Groups Tab */}
        <TabsContent value="manual">
          {/* Search & Filters */}
          <div className="flex flex-col gap-4 sm:flex-row animate-fade-in animate-delay-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חפש קבוצות..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-none">
              <TabsList>
                <TabsTrigger value="all">הכל</TabsTrigger>
                <TabsTrigger value="business">עסקים</TabsTrigger>
                <TabsTrigger value="marketplace">קניות</TabsTrigger>
                <TabsTrigger value="jobs">דרושים</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Groups List */}
          {filteredGroups.length > 0 ? (
            <div className="grid gap-4 mt-6 animate-fade-in animate-delay-200">
              {filteredGroups.map((group) => (
                <Card key={group.id} className="overflow-hidden hover:border-primary/20 hover:shadow-md transition-all duration-300">
                  <CardContent className="flex flex-col gap-4 p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{group.name}</h3>
                          {group.category === "business" && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">עסקים</Badge>
                          )}
                          {group.category === "marketplace" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">מכירות</Badge>
                          )}
                          {group.category === "jobs" && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">דרושים</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{group.members.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>פוסט אחרון: {group.lastPost}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        <Switch
                          checked={group.active}
                          onCheckedChange={() => toggleGroupActive(group.id)}
                          aria-label="Toggle group active"
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                          <a href={group.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeGroup(group.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 border-t bg-secondary/20 px-4 py-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span>7 פוסטים הצליחו</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span>1 פוסטים נכשלו</span>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="link" className="p-0 h-auto text-xs">הגדרות מתקדמות</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 mt-6 text-center animate-fade-in animate-delay-200">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-medium">לא נמצאו קבוצות</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? "נסה לחפש משהו אחר או " : ""}
                הוסף קבוצות חדשות כדי להתחיל לפרסם פוסטים אוטומטיים
              </p>
              <Button className="mt-4" onClick={() => setAddingGroup(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                הוסף קבוצה
              </Button>
            </div>
          )}

          {/* Limits Warning */}
          {groups.length >= 3 && (
            <Card className="border-amber-200 bg-amber-50 shadow-sm dark:border-amber-900 dark:bg-amber-900/20 animate-fade-in mt-6">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">הגעת למגבלת הקבוצות בתוכנית החינמית</h4>
                    <p className="text-sm text-muted-foreground">שדרג לפרימיום כדי להוסיף עד 15 קבוצות</p>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 shadow-md hover:shadow-lg">
                  שדרג עכשיו
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Facebook Groups Tab */}
        <TabsContent value="facebook">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">הקבוצות שלי בפייסבוק</h2>
            <Button 
              variant="outline" 
              onClick={handleRefreshGroups}
              disabled={isLoading || !isExtension}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>רענן קבוצות</span>
            </Button>
          </div>
          
          {!isExtension && (
            <Card className="border border-amber-100 bg-amber-50 shadow-sm dark:border-amber-900 dark:bg-amber-900/20 mb-4">
              <CardContent className="p-4">
                <p className="text-amber-800 dark:text-amber-400">
                  <strong>התוסף אינו פעיל.</strong> התקן והפעל את תוסף הדפדפן כדי לטעון את הקבוצות שלך בפייסבוק.
                </p>
              </CardContent>
            </Card>
          )}
          
          {isExtension && (
            <div className="grid gap-4 animate-fade-in">
              {availableGroups.length > 0 ? (
                availableGroups.map((group) => (
                  <Card key={group.id} className="overflow-hidden hover:border-primary/20 hover:shadow-md transition-all duration-300">
                    <CardContent className="flex justify-between items-center p-4">
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <a 
                          href={group.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-muted-foreground hover:text-primary hover:underline flex items-center mt-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          {group.url}
                        </a>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={group.status === 'active' ? 'default' : 'outline'}>
                          {group.status === 'active' ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Simulate adding this Facebook group to our managed groups
                            setGroups([
                              ...groups, 
                              {
                                id: Math.max(0, ...groups.map(g => g.id)) + 1,
                                name: group.name,
                                url: group.url,
                                members: 0,
                                active: true,
                                lastPost: "עכשיו",
                                category: "business"
                              }
                            ]);
                            toast({
                              title: "הקבוצה נוספה בהצלחה",
                              description: `הקבוצה "${group.name}" נוספה לרשימת הקבוצות המנוהלות`
                            });
                          }}
                        >
                          הוסף לקבוצות שלי
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-medium">לא נמצאו קבוצות פייסבוק</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    לחץ על כפתור "רענן קבוצות" כדי לטעון את הקבוצות שלך מפייסבוק
                  </p>
                  <Button className="mt-4" onClick={handleRefreshGroups} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    רענן קבוצות
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <Card className="border border-blue-100 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-900/20 mt-6">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">כיצד זה עובד?</h3>
              <p className="text-sm text-muted-foreground">
                התוסף מושך את הקבוצות שלך ישירות מפייסבוק. ניתן להוסיף קבוצות לרשימת הקבוצות המנוהלות כדי לפרסם בהן באופן אוטומטי.
                בכדי שזה יעבוד תצטרכו להיות מחוברים לפייסבוק בדפדפן.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Group Modal */}
      {addingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md animate-scale-in">
            <CardHeader>
              <CardTitle>הוספת קבוצת פייסבוק חדשה</CardTitle>
              <CardDescription>
                הכנס את פרטי הקבוצה כדי להתחיל לפרסם בה פוסטים אוטומטיים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">שם הקבוצה</Label>
                <Input
                  id="group-name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="הזן את שם הקבוצה"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="group-url">קישור לקבוצה</Label>
                <Input
                  id="group-url"
                  value={newGroup.url}
                  onChange={(e) => setNewGroup({ ...newGroup, url: e.target.value })}
                  placeholder="https://facebook.com/groups/..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="group-category">קטגוריה</Label>
                <select
                  id="group-category"
                  value={newGroup.category}
                  onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="business">עסקים</option>
                  <option value="marketplace">קניות ומכירות</option>
                  <option value="jobs">דרושים</option>
                  <option value="other">אחר</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setAddingGroup(false)}>ביטול</Button>
              <Button onClick={handleAddGroup}>הוסף קבוצה</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Groups;
