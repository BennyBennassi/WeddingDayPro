import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/login-form';
import RegisterForm from '@/components/auth/register-form';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-primary-50 to-background">
      <div className="container flex flex-col md:flex-row items-center justify-center gap-8 py-12">
        <div className="flex-1 max-w-md space-y-6">
          <Card className="border-primary/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Wedding Timeline Planner
              </CardTitle>
              <CardDescription>
                Create an account or log in to save and manage your wedding timelines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <LoginForm 
                    onSuccess={() => setLocation('/')}
                  />
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <RegisterForm 
                    onSuccess={() => setLocation('/')}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 max-w-lg space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              Plan Your Perfect Wedding Day
            </h2>
            <p className="text-lg text-muted-foreground">
              Our timeline planner helps you organize your wedding day with ease.
              Create a detailed schedule, collaborate with vendors, and ensure
              your special day runs smoothly.
            </p>
            
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Drag-and-drop timeline builder</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Pre-made templates for common wedding formats</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Export and share your timeline with vendors</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Multiple timelines for different scenarios</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}