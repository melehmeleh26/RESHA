
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const InstructionsCard = () => {
  return (
    <Card className="border border-blue-100 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-900/20 animate-fade-in animate-delay-200">
      <CardHeader>
        <CardTitle className="text-lg">הוראות שימוש בבדיקות</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>וודא שהתוסף מותקן ופעיל (אייקון GroupsFlow בסרגל התוספים)</li>
          <li>לחץ על "רענן מצב וקבוצות" כדי לקבל את רשימת הקבוצות הזמינות</li>
          <li>וודא שיש לך לשונית פייסבוק פתוחה ושאתה נמצא בקבוצה</li>
          <li>בחר את הקבוצה בה תרצה לבצע את הבדיקה</li>
          <li>בחר את מצב הבדיקה - מילוי בלבד או פרסום מלא</li>
          <li>הזן את תוכן הפוסט לבדיקה</li>
          <li>לחץ על "פרסם עכשיו" - המערכת תפתח פייסבוק ברקע ותסגור אוטומטית לאחר הפעולה</li>
          <li>ניתן לראות את ההיסטוריית הפעולות <Link to="/logs" className="text-primary hover:underline">ביומן הפעילות</Link></li>
        </ol>
      </CardContent>
    </Card>
  );
};

export default InstructionsCard;
