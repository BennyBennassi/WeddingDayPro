import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UserCircle, KeyRound, ShieldCheck } from "lucide-react";
import ChangePasswordForm from "./change-password-form";

export default function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  if (!user) return null;

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information and security settings
        </p>
      </div>

      <Tabs defaultValue="account" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-8 grid w-full grid-cols-2 md:grid-cols-3 max-w-md">
          <TabsTrigger value="account">
            <UserCircle className="h-4 w-4 mr-2" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound className="h-4 w-4 mr-2" />
            <span>Security</span>
          </TabsTrigger>
          {user.isAdmin && (
            <TabsTrigger value="admin">
              <ShieldCheck className="h-4 w-4 mr-2" />
              <span>Admin</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <h3 className="text-lg font-medium">Personal Details</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Username</dt>
                      <dd className="text-base">{user.username}</dd>
                    </div>
                    {user.name && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                        <dd className="text-base">{user.name}</dd>
                      </div>
                    )}
                    {user.email && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                        <dd className="text-base">{user.email}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                      <dd className="text-base">{user.isAdmin ? 'Administrator' : 'User'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Account Created</dt>
                      <dd className="text-base">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        {user.isAdmin && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Administrator Functions</CardTitle>
                <CardDescription>
                  Quick access to administrative functions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p>You have administrator privileges. Visit the admin page for full access to administrator functions.</p>
                </div>
                <a href="/admin" className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Go to Admin Panel
                </a>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}