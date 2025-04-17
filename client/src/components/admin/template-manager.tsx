import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, Pencil, Trash2, Check } from "lucide-react";

// Define types for our templates
interface TemplateEvent {
  id: number;
  templateId: number;
  name: string;
  startTime: string;
  endTime: string;
  category: string;
  color: string;
  notes: string | null;
  position: number;
}

interface TimelineTemplate {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Schemas for form validation
const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const templateEventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  category: z.string().min(1, "Category is required"),
  color: z.string().min(1, "Color is required"),
  notes: z.string().optional(),
  position: z.number().int().positive(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;
type TemplateEventFormValues = z.infer<typeof templateEventFormSchema>;

export default function TemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState<TimelineTemplate | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all templates
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery<TimelineTemplate[]>({
    queryKey: ["/api/admin/timeline-templates"],
    retry: false,
  });

  // Fetch events for selected template
  const {
    data: templateEvents,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery<TemplateEvent[]>({
    queryKey: ["/api/admin/template-events", selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate) return [];
      const response = await fetch(`/api/admin/template-events/${selectedTemplate.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch template events');
      }
      return response.json();
    },
    enabled: !!selectedTemplate,
    retry: false,
  });

  // Mutations for templates
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const response = await apiRequest("POST", "/api/admin/timeline-templates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template created",
        description: "The template has been created successfully.",
      });
      setIsAddingTemplate(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: TemplateFormValues;
    }) => {
      const response = await apiRequest("PUT", `/api/admin/timeline-templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template updated",
        description: "The template has been updated successfully.",
      });
      setIsEditingTemplate(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/timeline-templates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Template deleted",
        description: "The template and all associated events have been deleted.",
      });
      setSelectedTemplate(null);
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutations for template events
  const createTemplateEventMutation = useMutation({
    mutationFn: async (data: TemplateEventFormValues & { templateId: number }) => {
      const response = await apiRequest("POST", "/api/admin/template-events", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event added",
        description: "The event has been added to the template.",
      });
      setIsAddingEvent(false);
      if (selectedTemplate) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/admin/template-events", selectedTemplate.id] 
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTemplateEventMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<TemplateEventFormValues>;
    }) => {
      const response = await apiRequest("PUT", `/api/admin/template-events/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });
      if (selectedTemplate) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/admin/template-events", selectedTemplate.id] 
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplateEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/template-events/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been removed from the template.",
      });
      if (selectedTemplate) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/admin/template-events", selectedTemplate.id] 
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for adding/editing templates
  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
    },
  });

  const eventForm = useForm<TemplateEventFormValues>({
    resolver: zodResolver(templateEventFormSchema),
    defaultValues: {
      name: "",
      startTime: "09:00",
      endTime: "10:00",
      category: "custom",
      color: "bg-primary-light",
      notes: "",
      position: templateEvents ? templateEvents.length + 1 : 1,
    },
  });
  
  // Update form values when editing a template
  useEffect(() => {
    if (isEditingTemplate && selectedTemplate) {
      templateForm.reset({
        name: selectedTemplate.name,
        description: selectedTemplate.description || "",
        isDefault: selectedTemplate.isDefault,
      });
    }
  }, [isEditingTemplate, selectedTemplate, templateForm]);

  const handleSelectTemplate = (template: TimelineTemplate) => {
    setSelectedTemplate(template);
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate) return;
    
    templateForm.reset({
      name: selectedTemplate.name,
      description: selectedTemplate.description || "",
      isDefault: selectedTemplate.isDefault,
    });
    
    setIsEditingTemplate(true);
  };

  const handleAddTemplate = () => {
    templateForm.reset({
      name: "",
      description: "",
      isDefault: false,
    });
    setIsAddingTemplate(true);
  };

  const handleAddEvent = () => {
    eventForm.reset({
      name: "",
      startTime: "09:00",
      endTime: "10:00",
      category: "custom",
      color: "bg-primary-light",
      notes: "",
      position: templateEvents ? templateEvents.length + 1 : 1,
    });
    setIsAddingEvent(true);
  };

  const onSubmitTemplate = (data: TemplateFormValues) => {
    if (isEditingTemplate && selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const onSubmitEvent = (data: TemplateEventFormValues) => {
    if (!selectedTemplate) return;

    createTemplateEventMutation.mutate({
      ...data,
      templateId: selectedTemplate.id,
    });
  };

  const confirmDeleteTemplate = () => {
    if (!selectedTemplate) return;
    deleteTemplateMutation.mutate(selectedTemplate.id);
  };

  const handleDeleteEvent = (eventId: number) => {
    deleteTemplateEventMutation.mutate(eventId);
  };

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="text-center my-8">
        <p className="text-red-500">Error loading templates.</p>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    "preparation": "Preparation",
    "travel": "Travel",
    "ceremony": "Ceremony",
    "photos": "Photos",
    "reception": "Reception",
    "custom": "Custom",
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Timeline Templates</h2>
        <Button onClick={handleAddTemplate}>
          <Plus className="h-5 w-5 mr-2" /> New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>Select a template to view and manage its events</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pb-4 space-y-2 max-h-[400px] overflow-y-auto">
                {templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? "border-primary bg-primary/10"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{template.name}</span>
                        {template.isDefault && (
                          <Badge variant="outline" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader className="flex-row justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    {selectedTemplate.name}
                    {selectedTemplate.isDefault && (
                      <Badge variant="outline" className="ml-2 h-5">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate.description || "No description provided"}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleEditTemplate}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Template Events</h3>
                  <Button size="sm" onClick={handleAddEvent}>
                    <Plus className="h-4 w-4 mr-1" /> Add Event
                  </Button>
                </div>

                {eventsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : templateEvents && templateEvents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templateEvents
                        .sort((a, b) => a.position - b.position)
                        .map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div
                                  className={`w-3 h-3 rounded-full mr-2 ${event.color}`}
                                ></div>
                                {event.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {event.startTime} - {event.endTime}
                            </TableCell>
                            <TableCell>{categoryLabels[event.category] || event.category}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">No events in this template</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAddEvent}>
                      Add your first event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-16 px-4 border rounded-md bg-muted/20">
                <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a template from the list or create a new one
                </p>
                <Button onClick={handleAddTemplate}>
                  <Plus className="h-5 w-5 mr-2" /> Create New Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Template Dialog */}
      <Dialog
        open={isAddingTemplate || isEditingTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingTemplate(false);
            setIsEditingTemplate(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {isEditingTemplate
                ? "Update the details of this template"
                : "Fill in the details to create a new timeline template"}
            </DialogDescription>
          </DialogHeader>

          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-4">
              <FormField
                control={templateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Wedding Day Timeline" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of this template"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a short description to help users understand the purpose of this
                      template
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Set as Default</FormLabel>
                      <FormDescription>
                        Make this the default template for new timelines
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={templateForm.formState.isSubmitting}>
                  {templateForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditingTemplate ? "Save Changes" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Add a new event to the "{selectedTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>

          <Form {...eventForm}>
            <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="space-y-4">
              <FormField
                control={eventForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Hair & Makeup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={eventForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={eventForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={eventForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="preparation">Preparation</option>
                          <option value="travel">Travel</option>
                          <option value="ceremony">Ceremony</option>
                          <option value="photos">Photos</option>
                          <option value="reception">Reception</option>
                          <option value="custom">Custom</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={eventForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="bg-primary-light">Primary</option>
                          <option value="bg-pink-100">Pink</option>
                          <option value="bg-blue-100">Blue</option>
                          <option value="bg-green-100">Green</option>
                          <option value="bg-yellow-100">Yellow</option>
                          <option value="bg-purple-100">Purple</option>
                          <option value="bg-red-100">Red</option>
                          <option value="bg-gray-100">Gray</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={eventForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional notes about this event"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={eventForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The order in which this event appears in the timeline
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={eventForm.formState.isSubmitting}>
                  {eventForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Event
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{selectedTemplate?.name}" template? This will also
              delete all events in this template. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTemplate}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}