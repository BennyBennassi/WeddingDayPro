import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";

interface AuthModalProps {
  triggerButton?: React.ReactNode;
}

export default function AuthModal({ triggerButton }: AuthModalProps) {
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // If user is logged in, show logout button instead of modal
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Logged in as </span>
          <span className="font-medium">{user.name || user.username}</span>
          {user.isAdmin && (
            <span className="ml-2 bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full">
              Admin
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm">
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Wedding Timeline Planner</DialogTitle>
          <DialogDescription>
            Create an account or log in to save and manage your wedding timelines.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
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
            <LoginForm />
            <div className="text-sm text-center mt-4 text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => setActiveTab("register")}
                className="text-primary hover:underline"
              >
                Register now
              </button>
            </div>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <RegisterForm />
            <div className="text-sm text-center mt-4 text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("login")}
                className="text-primary hover:underline"
              >
                Log in
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}