import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, LayoutTemplate } from 'lucide-react';

interface TimelineSettingsProps {
  timeline: any;
  onUpdate: (data: any) => void;
  onDeleteTimeline?: () => void;
  onClearTimeline?: () => void;
  isDeleting?: boolean;
  isClearing?: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, 'Timeline name is required'),
  startHour: z.string().min(1, 'Start hour is required')
});

const TimelineSettings: React.FC<TimelineSettingsProps> = ({ 
  timeline, 
  onUpdate, 
  onDeleteTimeline, 
  onClearTimeline,
  isDeleting = false,
  isClearing = false
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  // Extract the editable part of the timeline name (after "TL# - ")
  const getEditableTimelineName = (fullName: string) => {
    if (!fullName) return '';
    const prefixMatch = fullName.match(/^TL\d+ - (.*)/);
    return prefixMatch ? prefixMatch[1] : fullName;
  };
  
  // Get the non-editable prefix part of the timeline name
  const getTimelinePrefix = (fullName: string) => {
    if (!fullName) return '';
    const prefixMatch = fullName.match(/^(TL\d+ - ).*/);
    return prefixMatch ? prefixMatch[1] : '';
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: getEditableTimelineName(timeline?.name) || '',
      startHour: timeline?.startHour?.toString() || '6'
    }
  });
  
  React.useEffect(() => {
    if (timeline) {
      form.reset({
        name: getEditableTimelineName(timeline.name),
        startHour: timeline.startHour.toString()
      });
    }
  }, [timeline]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Combine the prefix with the editable part of the name
    const timelinePrefix = getTimelinePrefix(timeline?.name || '');
    const fullName = timelinePrefix + data.name;
    
    onUpdate({
      name: fullName,
      startHour: parseInt(data.startHour)
    });
  };

  return (
    <>
      <div className="mb-8 bg-gradient-to-r from-primary-50 to-transparent p-5 rounded-lg border border-primary-100">
        <h3 className="text-md font-medium text-primary-800 mb-4">Timeline Settings</h3>
        <Form {...form}>
          <form onChange={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <FormLabel className="text-sm text-gray-700 mb-2 md:mb-0">Timeline Name</FormLabel>
                  <div className="w-full md:max-w-[220px]">
                    <div className="flex items-center">
                      {timeline?.name && (
                        <div className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-input text-muted-foreground text-xs md:text-sm">
                          {getTimelinePrefix(timeline.name)}
                        </div>
                      )}
                      <FormControl>
                        <Input
                          className={timeline?.name ? "rounded-l-none" : ""}
                          placeholder="Timeline name"
                          {...field}
                        />
                      </FormControl>
                    </div>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startHour"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="text-sm text-gray-700">Start Hour</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="max-w-[160px]">
                        <SelectValue placeholder="Select start hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">12:00 AM</SelectItem>
                      <SelectItem value="1">1:00 AM</SelectItem>
                      <SelectItem value="2">2:00 AM</SelectItem>
                      <SelectItem value="3">3:00 AM</SelectItem>
                      <SelectItem value="4">4:00 AM</SelectItem>
                      <SelectItem value="5">5:00 AM</SelectItem>
                      <SelectItem value="6">6:00 AM</SelectItem>
                      <SelectItem value="7">7:00 AM</SelectItem>
                      <SelectItem value="8">8:00 AM</SelectItem>
                      <SelectItem value="9">9:00 AM</SelectItem>
                      <SelectItem value="10">10:00 AM</SelectItem>
                      <SelectItem value="11">11:00 AM</SelectItem>
                      <SelectItem value="12">12:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </form>
        </Form>
        
        {/* Timeline Actions */}
        {onDeleteTimeline || onClearTimeline ? (
          <div className="mt-6 border-t pt-4 border-primary-100">
            <h4 className="text-sm font-medium text-primary-800 mb-3">Timeline Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {onClearTimeline && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowClearDialog(true)}
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <LayoutTemplate className="mr-2 h-4 w-4" />
                      Clear Timeline
                    </>
                  )}
                </Button>
              )}
              
              {onDeleteTimeline && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Timeline
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Delete Timeline Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this timeline? This action cannot be undone.
              All events and settings associated with this timeline will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (onDeleteTimeline) {
                  onDeleteTimeline();
                  setShowDeleteDialog(false);
                }
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Timeline"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Clear Timeline Confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Timeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all events from this timeline? This action cannot be undone.
              The timeline itself will remain, but all events will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (onClearTimeline) {
                  onClearTimeline();
                  setShowClearDialog(false);
                }
              }}
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear Timeline"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TimelineSettings;
