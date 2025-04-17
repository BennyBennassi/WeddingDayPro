import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User as UserIcon, 
  Loader2, 
  Edit, 
  UserCog,
  HelpCircle,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import TimelineQuestionsManager from "@/components/admin/timeline-questions-manager";

// Type for user without password
type UserWithoutPassword = Omit<User, 'password'>;

// Schema for user edit form
const userEditSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email").optional().nullable(),
  name: z.string().min(2, "Name must be at least 2 characters").optional().nullable(),
  isAdmin: z.boolean().default(false),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<UserWithoutPassword | null>(null);
  
  // Query to fetch all users (admin only)
  const { 
    data: users, 
    isLoading, 
    error 
  } = useQuery<UserWithoutPassword[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('You do not have permission to access this page.');
        }
        throw new Error('Failed to fetch users');
      }
      return await res.json();
    },
  });
  
  // Mutation to update user
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number, userData: UserEditFormData }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${id}`, userData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to update user' }));
        throw new Error(errorData.message || 'Failed to update user');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingUser(null);
      toast({
        title: 'User updated',
        description: 'The user has been updated successfully.',
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
  
  // Setup form for user editing
  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      username: '',
      email: '',
      name: '',
      isAdmin: false,
    },
  });
  
  // Open edit dialog for a user
  const handleEditUser = (user: UserWithoutPassword) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      email: user.email || null,
      name: user.name || null,
      isAdmin: user.isAdmin, // Keep this value, but it's not editable in the form
    });
  };
  
  // Handle form submission
  const onSubmit = (data: UserEditFormData) => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      id: editingUser.id,
      userData: data,
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-destructive text-xl font-bold">{(error as Error).message}</div>
        <Button onClick={() => window.location.href = '/'}>Go to Home</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <UserCog className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Administrator Panel</h1>
      </div>
      
      <Tabs defaultValue="users" className="mb-6">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            Timeline Questions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="border rounded-lg shadow-sm bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          
          {users && users.length > 0 ? (
            <Table>
              <TableCaption>List of all users in the system</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full">
                          Admin
                        </span>
                      ) : (
                        <span className="bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full">
                          User
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="questions" className="border rounded-lg shadow-sm bg-card">
          <TimelineQuestionsManager />
        </TabsContent>
      </Tabs>
      
      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter username" 
                        {...field} 
                        disabled={updateUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter email" 
                        {...field} 
                        value={field.value || ''}
                        disabled={updateUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter full name" 
                        {...field} 
                        value={field.value || ''}
                        disabled={updateUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Administrator role option removed as requested */}
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  disabled={updateUserMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}