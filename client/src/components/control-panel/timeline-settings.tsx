import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TimelineSettingsProps {
  timeline: any;
  onUpdate: (data: any) => void;
}

const formSchema = z.object({
  weddingDate: z.string().min(1, 'Wedding date is required'),
  startHour: z.string().min(1, 'Start hour is required'),
  timeFormat: z.string().min(1, 'Time format is required')
});

const TimelineSettings: React.FC<TimelineSettingsProps> = ({ timeline, onUpdate }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weddingDate: timeline?.weddingDate || new Date().toISOString().split('T')[0],
      startHour: timeline?.startHour?.toString() || '6',
      timeFormat: timeline?.timeFormat || '24h'
    }
  });
  
  React.useEffect(() => {
    if (timeline) {
      form.reset({
        weddingDate: timeline.weddingDate,
        startHour: timeline.startHour.toString(),
        timeFormat: timeline.timeFormat
      });
    }
  }, [timeline]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onUpdate({
      weddingDate: data.weddingDate,
      startHour: parseInt(data.startHour),
      timeFormat: data.timeFormat
    });
  };

  return (
    <div className="mb-8 bg-gradient-to-r from-primary-50 to-transparent p-5 rounded-lg border border-primary-100">
      <h3 className="text-md font-medium text-primary-800 mb-4">Timeline Settings</h3>
      <Form {...form}>
        <form onChange={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="weddingDate"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel className="text-sm text-gray-700">Wedding Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary max-w-[160px]"
                    {...field}
                  />
                </FormControl>
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
          
          <FormField
            control={form.control}
            name="timeFormat"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel className="text-sm text-gray-700">Time Format</FormLabel>
                <RadioGroup
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24h" id="timeFormat-24h" />
                    <label htmlFor="timeFormat-24h" className="text-sm text-gray-700">24h</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="12h" id="timeFormat-12h" />
                    <label htmlFor="timeFormat-12h" className="text-sm text-gray-700">12h</label>
                  </div>
                </RadioGroup>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};

export default TimelineSettings;
