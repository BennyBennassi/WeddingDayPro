import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EmailTemplate } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Code, FileText } from 'lucide-react';
import { format } from 'date-fns';

// Schema for email template form
const emailTemplateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  type: z.string().min(2, 'Template type is required'),
  subject: z.string().min(3, 'Subject line is required'),
  htmlBody: z.string().min(10, 'HTML template is required'),
  textBody: z.string().min(10, 'Text template is required'),
  isDefault: z.boolean().default(false),
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

export default function EmailTemplateManager() {
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');
  
  // Query to fetch all email templates
  const { 
    data: templates, 
    isLoading, 
    error 
  } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/email-templates');
      if (!res.ok) {
        throw new Error('Failed to fetch email templates');
      }
      return await res.json();
    },
  });
  
  // Mutation to create a new template
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: EmailTemplateFormData) => {
      const res = await apiRequest('POST', '/api/email-templates', templateData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to create template' }));
        throw new Error(errorData.message || 'Failed to create template');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setIsCreating(false);
      toast({
        title: 'Template created',
        description: 'The email template has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation to update an existing template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, templateData }: { id: number, templateData: Partial<EmailTemplateFormData> }) => {
      const res = await apiRequest('PUT', `/api/email-templates/${id}`, templateData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to update template' }));
        throw new Error(errorData.message || 'Failed to update template');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setEditingTemplate(null);
      toast({
        title: 'Template updated',
        description: 'The email template has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation to delete a template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/email-templates/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete template' }));
        throw new Error(errorData.message || 'Failed to delete template');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setTemplateToDelete(null);
      setDeleteDialogOpen(false);
      toast({
        title: 'Template deleted',
        description: 'The email template has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Form for creating/editing templates
  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: '',
      type: 'password_reset',
      subject: '',
      htmlBody: '',
      textBody: '',
      isDefault: false,
    },
  });
  
  // Open the edit dialog for a template
  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      type: template.type,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      isDefault: template.isDefault,
    });
  };
  
  // Open the create dialog
  const handleCreateTemplate = () => {
    form.reset({
      name: '',
      type: 'password_reset',
      subject: '',
      htmlBody: '',
      textBody: '',
      isDefault: false,
    });
    setIsCreating(true);
  };
  
  // Handle form submission (create or update)
  const onSubmit = (data: EmailTemplateFormData) => {
    if (isCreating) {
      createTemplateMutation.mutate(data);
    } else if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        templateData: data,
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-destructive text-lg mb-4">Error loading email templates</div>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] })}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Email Templates</h2>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>
      
      {templates && templates.length > 0 ? (
        <Table>
          <TableCaption>Manage email templates used for user communications</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.id}</TableCell>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full">
                    {template.type}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{template.subject}</TableCell>
                <TableCell>
                  {template.isDefault ? (
                    <span className="text-green-600 text-xs py-0.5 px-2 rounded-full bg-green-100">
                      Default
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {template.updatedAt ? format(new Date(template.updatedAt), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {/* Don't allow deleting the default template */}
                    {!template.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setTemplateToDelete(template);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          No email templates found. Create one to get started.
        </div>
      )}
      
      {/* Create/Edit Template Dialog */}
      <Dialog open={!!editingTemplate || isCreating} onOpenChange={(open) => {
        if (!open) {
          setEditingTemplate(null);
          setIsCreating(false);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Create Email Template' : 'Edit Email Template'}</DialogTitle>
            <DialogDescription>
              {isCreating 
                ? 'Create a new email template for system communications.' 
                : 'Update an existing email template.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Password Reset Email" 
                          {...field} 
                          disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="password_reset">Password Reset</SelectItem>
                          <SelectItem value="welcome">Welcome Email</SelectItem>
                          <SelectItem value="notification">Notification</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of email this template is used for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Reset Your Password" 
                        {...field} 
                        disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      The subject line for the email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Button 
                    type="button" 
                    variant={activeTab === 'html' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveTab('html')}
                    className="flex items-center gap-1"
                  >
                    <Code className="h-4 w-4" />
                    HTML Template
                  </Button>
                  <Button 
                    type="button" 
                    variant={activeTab === 'text' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveTab('text')}
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    Plain Text Version
                  </Button>
                </div>
                
                {activeTab === 'html' ? (
                  <FormField
                    control={form.control}
                    name="htmlBody"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTML Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="HTML email content" 
                            className="font-mono h-[300px]"
                            {...field} 
                            disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          HTML version of the email. Use {{resetLink}} for password reset links
                          and {{username}} to include the recipient's username.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="textBody"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plain Text Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Plain text email content" 
                            className="font-mono h-[300px]"
                            {...field} 
                            disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Plain text version of the email for clients that don't support HTML.
                          Use {{resetLink}} for password reset links and {{username}} to include 
                          the recipient's username.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Use as default template
                      </FormLabel>
                      <FormDescription>
                        Make this the default template for its type (e.g. password reset)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsCreating(false);
                  }}
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                >
                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isCreating ? 'Creating...' : 'Saving...'}
                    </>
                  ) : (
                    isCreating ? 'Create Template' : 'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Template Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the email template.
              
              {templateToDelete && (
                <div className="mt-4 p-4 border rounded-md bg-muted">
                  <div className="font-semibold">Template details:</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div className="text-muted-foreground">Name:</div>
                    <div>{templateToDelete.name}</div>
                    
                    <div className="text-muted-foreground">Type:</div>
                    <div>{templateToDelete.type}</div>
                    
                    <div className="text-muted-foreground">Subject:</div>
                    <div>{templateToDelete.subject}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTemplateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (templateToDelete) {
                  deleteTemplateMutation.mutate(templateToDelete.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Template"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}