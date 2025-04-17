import { useAuth } from '@/hooks/use-auth';
import UserProfile from '@/components/user-profile/user-profile';
import { Loader2 } from 'lucide-react';
import { Redirect } from 'wouter';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <UserProfile />;
}