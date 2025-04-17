import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import ColorPicker from '@/components/ui/color-picker';

interface EditTimeBlockFormProps {
  event: any;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Block of Time name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  category: z.string().min(1, 'Category is required'),
  color: z.string().min(1, 'Color is required')
});

const EditTimeBlockForm: React.FC<EditTimeBlockFormProps> = ({ event, onClose }) => {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: event.name,
      startTime: event.startTime,
      endTime: event.endTime,
      category: event.category,
      color: event.color
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest('PUT', `/api/timeline-events/${event.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Block of Time Updated',
        description: 'Your block of time has been updated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${event.timelineId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update block of time. Please try again.',
        variant: 'destructive'
      });
      console.error('Failed to update block of time:', error);
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/timeline-events/${event.id}`, null);
    },
    onSuccess: () => {
      toast({
        title: 'Block of Time Deleted',
        description: 'Your block of time has been removed from the timeline.'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${event.timelineId}`] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete block of time. Please try again.',
        variant: 'destructive'
      });
      console.error('Failed to delete block of time:', error);
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateEventMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this block of time?')) {
      deleteEventMutation.mutate();
    }
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
    <div>
      <div className="mb-4">
        <p className="text-lg font-medium text-primary">{event.name}</p>
        <p className="text-sm text-gray-600">{event.startTime} - {event.endTime}</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Block of Time Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
          
          <div className="flex space-x-2">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={updateEventMutation.isPending}
            >
              Update
            </Button>
            <Button
              type="button"
              className="bg-red-100 hover:bg-red-200 text-red-700"
              onClick={handleDelete}
              disabled={deleteEventMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditTimeBlockForm;
