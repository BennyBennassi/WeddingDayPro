import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, EyeIcon, EyeOffIcon } from 'lucide-react';

interface VenueRestrictionsProps {
  restrictions: any;
  onUpdate: (data: any) => void;
}

const formSchema = z.object({
  hasMusicEndTime: z.boolean().default(false),
  musicEndTime: z.string().optional(),
  hasCeremonyStartTime: z.boolean().default(false),
  ceremonyStartTime: z.string().optional(),
  hasDinnerStartTime: z.boolean().default(false),
  dinnerStartTime: z.string().optional(),
  showRestrictionLines: z.boolean().default(true)
});

const VenueRestrictions: React.FC<VenueRestrictionsProps> = ({ restrictions, onUpdate }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasMusicEndTime: !!restrictions?.musicEndTime,
      musicEndTime: restrictions?.musicEndTime || '01:00',
      hasCeremonyStartTime: !!restrictions?.ceremonyStartTime,
      ceremonyStartTime: restrictions?.ceremonyStartTime || '14:00',
      hasDinnerStartTime: !!restrictions?.dinnerStartTime,
      dinnerStartTime: restrictions?.dinnerStartTime || '19:00',
      showRestrictionLines: restrictions?.showRestrictionLines !== false // Default to true if not set
    }
  });
  
  React.useEffect(() => {
    if (restrictions) {
      form.reset({
        hasMusicEndTime: !!restrictions.musicEndTime,
        musicEndTime: restrictions.musicEndTime || '01:00',
        hasCeremonyStartTime: !!restrictions.ceremonyStartTime,
        ceremonyStartTime: restrictions.ceremonyStartTime || '14:00',
        hasDinnerStartTime: !!restrictions.dinnerStartTime,
        dinnerStartTime: restrictions.dinnerStartTime || '19:00',
        showRestrictionLines: restrictions.showRestrictionLines !== false // Default to true if not set
      });
    }
  }, [restrictions]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onUpdate({
      musicEndTime: data.hasMusicEndTime ? data.musicEndTime : null,
      ceremonyStartTime: data.hasCeremonyStartTime ? data.ceremonyStartTime : null,
      dinnerStartTime: data.hasDinnerStartTime ? data.dinnerStartTime : null,
      showRestrictionLines: data.showRestrictionLines
    });
  };

  return (
    <div className="mb-8 bg-gradient-to-r from-orange-50 to-transparent p-5 rounded-lg border border-orange-100">
      <h3 className="text-md font-medium text-orange-800 mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
        Venue Restrictions
      </h3>
      
      <Form {...form}>
        <form onChange={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="hasMusicEndTime"
            render={({ field }) => (
              <FormItem className="flex items-center">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="music-restriction"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </FormControl>
                <FormLabel className="ml-2 text-sm text-gray-700" htmlFor="music-restriction">
                  Music must end by
                </FormLabel>
                {field.value && (
                  <FormField
                    control={form.control}
                    name="musicEndTime"
                    render={({ field: timeField }) => (
                      <FormControl>
                        <Input
                          type="time"
                          className="ml-2 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-auto"
                          {...timeField}
                        />
                      </FormControl>
                    )}
                  />
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hasCeremonyStartTime"
            render={({ field }) => (
              <FormItem className="flex items-center">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="ceremony-time"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </FormControl>
                <FormLabel className="ml-2 text-sm text-gray-700" htmlFor="ceremony-time">
                  Ceremony can't start before
                </FormLabel>
                {field.value && (
                  <FormField
                    control={form.control}
                    name="ceremonyStartTime"
                    render={({ field: timeField }) => (
                      <FormControl>
                        <Input
                          type="time"
                          className="ml-2 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-auto"
                          {...timeField}
                        />
                      </FormControl>
                    )}
                  />
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hasDinnerStartTime"
            render={({ field }) => (
              <FormItem className="flex items-center">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="dinner-time"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </FormControl>
                <FormLabel className="ml-2 text-sm text-gray-700" htmlFor="dinner-time">
                  Dinner must start by
                </FormLabel>
                {field.value && (
                  <FormField
                    control={form.control}
                    name="dinnerStartTime"
                    render={({ field: timeField }) => (
                      <FormControl>
                        <Input
                          type="time"
                          className="ml-2 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-auto"
                          {...timeField}
                        />
                      </FormControl>
                    )}
                  />
                )}
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};

export default VenueRestrictions;
