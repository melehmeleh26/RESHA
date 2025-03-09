
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const InstructionsCard = () => {
  return (
    <Card className="border border-blue-100 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-900/20 animate-fade-in animate-delay-200">
      <CardHeader>
        <CardTitle className="text-lg">הוראות שימוש בבדיקות</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>וודא שהתוסף מותקן ופעיל (אייקון GroupsFlow בסרגל התוספים)</li>
          <li>לחץ על "רענן קבוצות" כדי לקבל את רשימת הקבוצות הזמינות מפייסבוק</li>
          <li>במידה ואין קבוצות, פתח לשונית נפרדת בדפדפן עם פייסבוק וגלול בעמוד הקבוצות שלך</li>
          <li>בחר את הקבוצה בה תרצה לבצע את הבדיקה מהרשימה</li>
          <li>בחר את מצב הבדיקה - מילוי בלבד או פרסום מלא</li>
          <li>הזן את תוכן הפוסט לבדיקה</li>
          <li>לחץ על "פרסם עכשיו" - המערכת תפתח פייסבוק ברקע ותסגור אוטומטית לאחר הפעולה</li>
          <li>ניתן לראות את הסטטיסטיקות והיסטוריית הפעולות <Link to="/logs" className="text-primary hover:underline">ביומן הפעילות</Link></li>
        </ol>
        
        <Alert variant="warning" className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>שים לב:</strong> התוסף צריך להיות מסוגל לגשת לקבוצות הפייסבוק שלך. אם אתה לא רואה את הקבוצות, 
            נסה לפתוח את עמוד הקבוצות של פייסבוק בלשונית נפרדת וודא שאתה מחובר לחשבון שלך.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default InstructionsCard;
