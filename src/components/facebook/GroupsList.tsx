
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ListFilter, UserCheck, RefreshCw, ExternalLink } from "lucide-react";
import { FacebookGroup } from "@/types/facebook";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

interface GroupsListProps {
  availableGroups: FacebookGroup[];
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  handleRefreshGroups: () => void;
  isFetching: boolean;
  isLoading: boolean;
}

const GroupsList = ({
  availableGroups,
  selectedGroupId,
  setSelectedGroupId,
  handleRefreshGroups,
  isFetching,
  isLoading
}: GroupsListProps) => {
  const [showGroupUrls, setShowGroupUrls] = useState(false);
  
  // Function to open a group URL
  const openGroupUrl = (url: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selecting the group
    window.open(url, '_blank');
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">קבוצות זמינות</CardTitle>
            <CardDescription>רשימת קבוצות פייסבוק שאפשר לפרסם בהן</CardDescription>
          </div>
          {availableGroups.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowGroupUrls(!showGroupUrls)}
            >
              {showGroupUrls ? 'הסתר קישורים' : 'הצג קישורים'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {availableGroups.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <p className="flex items-center">
                <UserCheck className="ml-2 h-5 w-5" />
                <span>לא נמצאו קבוצות פייסבוק. לחץ על כפתור "רענן קבוצות" כדי לנסות שוב.</span>
              </p>
            </div>

            <Alert variant="default" className="bg-primary/5 border-primary/20">
              <AlertDescription className="text-xs">
                טיפ: פתח את פייסבוק בלשונית אחרת ונווט לעמוד הקבוצות שלך לפני שאתה מנסה לרענן את הרשימה.
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm" 
              onClick={handleRefreshGroups}
              disabled={isFetching || isLoading}
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${(isFetching || isLoading) ? "animate-spin" : ""}`} />
              רענן קבוצות
            </Button>
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
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">{group.name}</p>
                        {showGroupUrls && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 mr-1" 
                            onClick={(e) => openGroupUrl(group.url, e)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {showGroupUrls && (
                        <p className="text-xs text-muted-foreground truncate">{group.url}</p>
                      )}
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
  );
};

export default GroupsList;
