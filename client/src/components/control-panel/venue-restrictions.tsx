import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, EyeIcon, EyeOffIcon, Clock } from 'lucide-react';
import TimeSelect from '@/components/ui/time-select';

interface TimeRestrictionsProps {
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
  hasCustomRestriction: z.boolean().default(false),
  customRestrictionTime: z.string().optional(),
  customRestrictionName: z.string().optional(),
  showRestrictionLines: z.boolean().default(true)
});

const TimeRestrictions: React.FC<TimeRestrictionsProps> = ({ restrictions, onUpdate }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasMusicEndTime: !!restrictions?.musicEndTime,
      musicEndTime: restrictions?.musicEndTime || '01:00',
      hasCeremonyStartTime: !!restrictions?.ceremonyStartTime,
      ceremonyStartTime: restrictions?.ceremonyStartTime || '14:00',
      hasDinnerStartTime: !!restrictions?.dinnerStartTime,
      dinnerStartTime: restrictions?.dinnerStartTime || '19:00',
      hasCustomRestriction: !!restrictions?.customRestrictionTime,
      customRestrictionTime: restrictions?.customRestrictionTime || '16:00',
      customRestrictionName: restrictions?.customRestrictionName || 'Custom Restriction',
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
        hasCustomRestriction: !!restrictions.customRestrictionTime,
        customRestrictionTime: restrictions.customRestrictionTime || '16:00',
        customRestrictionName: restrictions.customRestrictionName || 'Custom Restriction',
        showRestrictionLines: restrictions.showRestrictionLines !== false // Default to true if not set
      });
    }
  }, [restrictions]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onUpdate({
      musicEndTime: data.hasMusicEndTime ? data.musicEndTime : null,
      ceremonyStartTime: data.hasCeremonyStartTime ? data.ceremonyStartTime : null,
      dinnerStartTime: data.hasDinnerStartTime ? data.dinnerStartTime : null,
      customRestrictionTime: data.hasCustomRestriction ? data.customRestrictionTime : null,
      customRestrictionName: data.hasCustomRestriction ? data.customRestrictionName : null,
      showRestrictionLines: data.showRestrictionLines
    });
  };

  return (
    <div className="mb-8 bg-gradient-to-r from-orange-50 to-transparent p-5 rounded-lg border border-orange-100">
      <h3 className="text-md font-medium text-orange-800 mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2 text-orange-500" />
        Time Restrictions
      </h3>
      
      <Form {...form}>
        <form onChange={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Toggle for showing restriction lines */}
          <FormField
            control={form.control}
            name="showRestrictionLines"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between py-2 border-b border-orange-100">
                <div className="flex items-center">
                  <FormLabel className="font-medium text-sm text-gray-700 flex items-center space-x-2">
                    {field.value ? (
                      <EyeIcon className="h-4 w-4 mr-2 text-orange-500" />
                    ) : (
                      <EyeOffIcon className="h-4 w-4 mr-2 text-gray-400" />
                    )}
                    <span>Show restriction lines on timeline</span>
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
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
                        <TimeSelect
                          value={timeField.value}
                          onChange={timeField.onChange}
                          className="ml-2 w-32"
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
                        <TimeSelect
                          value={timeField.value}
                          onChange={timeField.onChange}
                          className="ml-2 w-32"
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
                        <TimeSelect
                          value={timeField.value}
                          onChange={timeField.onChange}
                          className="ml-2 w-32"
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
            name="hasCustomRestriction"
            render={({ field }) => (
              <FormItem className="flex items-center">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="custom-restriction"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </FormControl>
                <FormLabel className="ml-2 text-sm text-gray-700" htmlFor="custom-restriction">
                  Add custom restriction
                </FormLabel>
                {field.value && (
                  <div className="ml-2 flex flex-col sm:flex-row gap-2 w-full">
                    <FormField
                      control={form.control}
                      name="customRestrictionName"
                      render={({ field: nameField }) => (
                        <FormControl>
                          <Input
                            placeholder="Restriction name"
                            className="px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
                            {...nameField}
                          />
                        </FormControl>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customRestrictionTime"
                      render={({ field: timeField }) => (
                        <FormControl>
                          <TimeSelect
                            value={timeField.value}
                            onChange={timeField.onChange}
                            className="w-32"
                          />
                        </FormControl>
                      )}
                    />
                  </div>
                )}
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};

export default TimeRestrictions;
