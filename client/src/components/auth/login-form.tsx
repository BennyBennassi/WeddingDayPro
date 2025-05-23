import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, UserX, KeyRound, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    // Clear any previous error
    setLoginError(null);
    
    loginMutation.mutate(data, {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error) => {
        setLoginError(error.message || "Invalid username or password. Please check your credentials and try again.");
        
        // Focus the username field after error for better UX
        setTimeout(() => {
          form.setFocus("username");
        }, 100);
      }
    });
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {loginError && (
            <Alert variant="destructive" className="mb-6 animate-fadeIn border-2 animate-shake">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle className="font-semibold ml-2">Unable to sign in</AlertTitle>
              <AlertDescription className="mt-2 ml-7">
                <p className="text-sm">
                  {loginError.includes("401") || 
                   loginError.includes("Invalid username or password") || 
                   loginError.includes("Authentication failed") || 
                   loginError.includes("Unauthorized") ? 
                    "The username or password you entered is incorrect. Please check your credentials and try again." : 
                    loginError}
                </p>
              </AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your username" 
                    {...field} 
                    disabled={loginMutation.isPending}
                    className={loginError ? "border-destructive focus:border-destructive" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...field}
                      disabled={loginMutation.isPending}
                      className={loginError ? "border-destructive focus:border-destructive" : ""}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </Button>
          
          <div className="mt-4 text-center">
            <Link href="/forgot-password">
              <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                Forgot your password?
              </span>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}