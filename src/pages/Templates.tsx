
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Copy } from "lucide-react";

// Sample template data
const initialTemplates = [
  {
    id: 1,
    name: "מסעדה - הצעה מיוחדת",
    content: "היי חברים! {business_name} מזמינה אתכם ליהנות מהצעה מיוחדת לתושבי {city}: קבלו 15% הנחה על כל התפריט בהזמנה טלפונית! להזמנות: {phone}",
    category: "food",
  },
  {
    id: 2,
    name: "יועץ עסקי - שירותים",
    content: "בעלי עסק ב{city}? {business_name} מציעים ייעוץ עסקי ראשוני ללא עלות לבעלי עסקים חדשים. נשמח לעזור לכם להצליח! לפרטים: {phone}",
    category: "service",
  },
  {
    id: 3,
    name: "חנות - מבצע סוף שבוע",
    content: "מבצע סוף שבוע מיוחד ב{business_name} ב{city}! פריטים נבחרים ב-50% הנחה! המבצע בתוקף עד יום ראשון בלבד. לפרטים נוספים: {phone}",
    category: "retail",
  },
];

const Templates = () => {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTab, setActiveTab] = useState("all");
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const filteredTemplates = activeTab === "all" 
    ? templates 
    : templates.filter(t => t.category === activeTab);

  const handleEditTemplate = (template: any) => {
    setEditingTemplate({ ...template });
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    
    if (editingTemplate.id) {
      // Update existing template
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      ));
    } else {
      // Add new template
      setTemplates([
        ...templates, 
        { 
          ...editingTemplate, 
          id: Math.max(0, ...templates.map(t => t.id)) + 1 
        }
      ]);
    }
    
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({
      id: null,
      name: "",
      content: "",
      category: "food",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">תבניות פוסטים</h1>
            <p className="mt-2 text-muted-foreground">יצירה וניהול תבניות לפוסטים אוטומטיים</p>
          </div>
          <Button onClick={handleCreateTemplate} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>תבנית חדשה</span>
          </Button>
        </div>
      </div>

      {/* Template editing modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md animate-scale-in">
            <CardHeader>
              <CardTitle>{editingTemplate.id ? "עריכת תבנית" : "יצירת תבנית חדשה"}</CardTitle>
              <CardDescription>
                השתמש במשתנים {'{business_name}'}, {'{city}'}, {'{phone}'} כדי להתאים אישית את הפוסט.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">שם התבנית</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="הזן שם לתבנית"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-category">קטגוריה</Label>
                <select
                  id="template-category"
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="food">מסעדה / אוכל</option>
                  <option value="service">שירותים</option>
                  <option value="retail">קמעונאות</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-content">תוכן הפוסט</Label>
                <Textarea
                  id="template-content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  placeholder="הזן את תוכן הפוסט"
                  rows={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>ביטול</Button>
              <Button onClick={handleSaveTemplate}>שמור תבנית</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in animate-delay-100">
        <TabsList className="w-full max-w-md grid grid-cols-4">
          <TabsTrigger value="all">הכל</TabsTrigger>
          <TabsTrigger value="food">מסעדות</TabsTrigger>
          <TabsTrigger value="service">שירותים</TabsTrigger>
          <TabsTrigger value="retail">חנויות</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6 grid gap-6 md:grid-cols-2">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden border shadow-sm animate-scale-in">
              <CardHeader className="bg-secondary/30 pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{template.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="whitespace-pre-line rounded-md bg-secondary/50 p-3 text-sm">
                  {template.content}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-secondary/20 px-6 py-3">
                <Button variant="outline" size="sm" className="mr-auto gap-2">
                  <Copy className="h-3.5 w-3.5" />
                  <span>שכפל תבנית</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      
      {/* Tips Card */}
      <Card className="mt-6 border border-blue-100 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-900/20 animate-fade-in animate-delay-200">
        <CardHeader>
          <CardTitle className="text-lg">טיפים ליצירת פוסטים אפקטיביים</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-sm">
            <li>השתמש במשתנים <code className="text-primary">{'{business_name}'}</code>, <code className="text-primary">{'{city}'}</code>, ו-<code className="text-primary">{'{phone}'}</code> לפוסטים מותאמים אישית.</li>
            <li>שמור על תוכן קצר וממוקד - פסקה אחת עובדת הכי טוב.</li>
            <li>הוסף קריאה לפעולה ברורה בסוף הפוסט.</li>
            <li>הימנע משימוש חוזר באותן מילים כדי להפחית סיכוני חסימה.</li>
            <li>וודא שהתוכן רלוונטי לקבוצה בה אתה מפרסם.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Templates;
