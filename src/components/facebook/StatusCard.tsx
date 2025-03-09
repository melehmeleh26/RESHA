
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { FacebookStatus, FacebookGroup } from "@/types/facebook";

interface StatusCardProps {
  isExtension: boolean;
  facebookStatus: FacebookStatus;
  availableGroups: FacebookGroup[];
  handleRefreshGroups: () => void;
  isFetching: boolean;
  isLoading: boolean;
}

const StatusCard = ({ 
  isExtension, 
  facebookStatus, 
  availableGroups,
  handleRefreshGroups,
  isFetching,
  isLoading
}: StatusCardProps) => {
  return (
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
  );
};

export default StatusCard;
