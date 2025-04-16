import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import ColorPicker from '@/components/ui/color-picker';

interface AddTimeBlockFormProps {
  timelineId: number;
}

const formSchema = z.object({
  name: z.string().min(1, 'Block of Time name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  category: z.string().min(1, 'Category is required'),
  color: z.string().min(1, 'Color is required'),
  notes: z.string().optional()
});

const AddTimeBlockForm: React.FC<AddTimeBlockFormProps> = ({ timelineId }) => {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startTime: '12:00',
      endTime: '13:00',
      category: 'morning_prep',
      color: 'bg-primary-light',
      notes: ''
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest('POST', '/api/timeline-events', {
        ...data,
        userId: 1, // Using the default user for now
        position: 999 // Put at the end
      });
    },
    onSuccess: () => {
      toast({
        title: 'Block of Time Added',
        description: 'Your block of time has been added to the timeline.'
      });
      form.reset({
        name: '',
        startTime: '12:00',
        endTime: '13:00',
        category: 'morning_prep',
        color: 'bg-primary-light',
        notes: ''
      });
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timelineId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add block of time. Please try again.',
        variant: 'destructive'
      });
      console.error('Failed to add block of time:', error);
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createEventMutation.mutate(data);
  };
  
  // Generate time options for select
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Block of Time Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., First Dance" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="morning_prep">Morning Prep</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="ceremony">Ceremony</SelectItem>
                  <SelectItem value="photos">Photos</SelectItem>
                  <SelectItem value="drinks_reception">Drinks Reception</SelectItem>
                  <SelectItem value="bell_call">Bell Call</SelectItem>
                  <SelectItem value="entrance">Entrance</SelectItem>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="speeches">Speeches</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="dancing">Dancing</SelectItem>
                  <SelectItem value="residence">Residence</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <ColorPicker
                  value={field.value}
                  onChange={(color) => field.onChange(color)}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special instructions or details"
                  rows={2}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary-dark text-white"
          disabled={createEventMutation.isPending}
        >
          <Plus className="h-5 w-5 mr-1" />
          Add Block of Time
        </Button>
      </form>
    </Form>
  );
};

export default AddTimeBlockForm;
