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

interface EditEventFormProps {
  event: any;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  category: z.string().min(1, 'Category is required'),
  color: z.string().min(1, 'Color is required')
});

const EditEventForm: React.FC<EditEventFormProps> = ({ event, onClose }) => {
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
        title: 'Event Updated',
        description: 'Your event has been updated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${event.userId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive'
      });
      console.error('Failed to update event:', error);
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/timeline-events/${event.id}`, null);
    },
    onSuccess: () => {
      toast({
        title: 'Event Deleted',
        description: 'Your event has been removed from the timeline.'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${event.userId}`] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive'
      });
      console.error('Failed to delete event:', error);
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateEventMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this event?')) {
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
                <FormLabel>Event Name</FormLabel>
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
                    <SelectItem value="ceremony">Ceremony</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="food">Food & Dining</SelectItem>
                    <SelectItem value="photos">Photography</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="preparation">Preparation</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
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
              className="flex-1 bg-secondary hover:bg-secondary-dark text-white"
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

export default EditEventForm;
