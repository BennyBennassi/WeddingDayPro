import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Settings, Key } from 'lucide-react';
import ChangePasswordForm from './change-password-form';

export default function UserProfile() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  if (!user) return null;
  
  // Get initials for avatar
  const getInitials = () => {
    if (user.name) {
      return user.name.split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold mb-1">{user.name || user.username}</h1>
        {user.email && (
          <p className="text-muted-foreground">{user.email}</p>
        )}
        {user.isAdmin && (
          <div className="mt-2 bg-primary/10 text-primary text-sm py-1 px-3 rounded-full">
            Administrator
          </div>
        )}
      </div>
      
      <Tabs 
        defaultValue="profile" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your personal information and account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p>{user.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p>{user.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                  <p>{user.isAdmin ? 'Administrator' : 'User'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <Button 
                  variant="destructive"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}