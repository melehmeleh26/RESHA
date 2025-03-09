
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FacebookIcon, RefreshCw } from "lucide-react";

interface InstructionsCardProps {
  isExtension: boolean;
  onCheckConnection: () => void;
  onFetchGroups: () => void;
  isLoading: boolean;
}

const InstructionsCard = ({
  isExtension,
  onCheckConnection,
  onFetchGroups,
  isLoading,
}: InstructionsCardProps) => {
  return (
    <Card className="border-blue-100 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FacebookIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          הנחיות להתחברות לפייסבוק
        </CardTitle>
        <CardDescription>
          כדי לבדוק את יכולת הפרסום בקבוצות, עליך להיות מחובר לפייסבוק
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isExtension ? (
          <Alert variant="destructive">
            <AlertTitle>תוסף הדפדפן לא פעיל</AlertTitle>
            <AlertDescription>
              יש להתקין את תוסף הדפדפן כדי להשתמש באפשרויות הפרסום
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <ol className="ml-6 list-decimal space-y-2 text-sm text-muted-foreground">
              <li>פתח את הדפדפן והיכנס לחשבון הפייסבוק שלך</li>
              <li>ודא שהינך חבר בקבוצות הפייסבוק בהן תרצה לפרסם</li>
              <li>לחץ על "בדוק חיבור" כדי לאמת את החיבור לפייסבוק</li>
              <li>לחץ על "טען קבוצות" כדי לקבל את רשימת הקבוצות שלך</li>
              <li>צור פוסט לבדיקה ולחץ על "שלח" כדי לבדוק את התהליך</li>
            </ol>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCheckConnection}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                בדוק חיבור
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onFetchGroups}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                טען קבוצות
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InstructionsCard;
