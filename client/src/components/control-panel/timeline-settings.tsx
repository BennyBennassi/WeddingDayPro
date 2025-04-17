import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimelineSettingsProps {
  timeline: any;
  onUpdate: (data: any) => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Timeline name is required'),
  startHour: z.string().min(1, 'Start hour is required')
});

const TimelineSettings: React.FC<TimelineSettingsProps> = ({ timeline, onUpdate }) => {
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
    </div>
  );
};

export default TimelineSettings;
