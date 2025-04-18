import { useState } from "react";
import { useTimelineTemplates } from "@/hooks/use-timeline-templates";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LayoutTemplate, AlertCircle, LogIn } from "lucide-react";

interface TemplateSelectorProps {
  timelineId?: number;
  onSelectTemplate?: (templateType: string) => Promise<void>;
}

export default function TemplateSelector({ timelineId, onSelectTemplate }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const { user } = useAuth();
  const { 
    templates, 
    isLoading, 
    error, 
    applyTemplate,
    isApplying 
  } = useTimelineTemplates();
  
  const handleSelectTemplate = (templateId: number) => {
    if (!user) {
      setIsLoginPromptOpen(true);
      setIsOpen(false);
      return;
    }
    
    setSelectedTemplateId(templateId);
    setIsConfirmDialogOpen(true);
  };
  
  const handleApplyTemplate = async () => {
    if (selectedTemplateId === null || !user) return;
    
    // If we have a direct template handler function, use it
    if (onSelectTemplate && selectedTemplateId) {
      const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        // Extract template type from template name or use a default
        const templateType = selectedTemplate.name.toLowerCase().includes('church') ? 'church' : 
                             selectedTemplate.name.toLowerCase().includes('single') ? 'single-venue' :
                             selectedTemplate.name.toLowerCase().includes('morning') ? 'morning-ceremony' :
                             selectedTemplate.name.toLowerCase().includes('evening') ? 'evening-ceremony' : 
                             'single-venue';
        
        await onSelectTemplate(templateType);
      }
    } else if (timelineId) {
      // Otherwise use the default applyTemplate function
      applyTemplate({
        timelineId,
        templateId: selectedTemplateId
      });
    }
    
    setIsConfirmDialogOpen(false);
    setIsOpen(false);
  };
  
  const handleLoginRedirect = () => {
    setIsLoginPromptOpen(false);
    setLocation("/auth");
  };
  
  return (
    <>
      <div className="mb-4">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2" 
          onClick={() => setIsOpen(true)}
        >
          <LayoutTemplate className="h-4 w-4" />
          <span>Apply Template</span>
        </Button>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timeline Templates</DialogTitle>
            <DialogDescription>
              Choose a template to apply to your timeline. This will add events from the template to your current timeline.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center p-4 border rounded-md bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="text-destructive">Error loading templates</p>
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedTemplateId === template.id ? "border-primary ring-1 ring-primary" : ""
                    }`}
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.isDefault && (
                          <Badge variant="outline" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {template.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 text-xs text-muted-foreground">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border rounded-md">
                <p className="text-muted-foreground">No templates available</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply this template to your timeline? This will add new events
              to your timeline and will not replace or remove any existing events.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApplyTemplate}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Login Prompt Dialog */}
      <AlertDialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to apply a template to your timeline.
              Would you like to log in or create an account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>
              <LogIn className="h-4 w-4 mr-2" />
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}