
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ListFilter, UserCheck } from "lucide-react";
import { FacebookGroup } from "@/types/facebook";

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
  return (
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
  );
};

export default GroupsList;
