import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center">
          <ForgotPasswordForm />
        </div>
        
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary-foreground to-muted p-8 rounded-lg">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Wedding Day Timeline</h1>
            <p className="text-lg">
              Reset your password to regain access to your wedding timeline planner.
            </p>
            <p className="text-md text-muted-foreground pt-4">
              Create a beautiful timeline for your special day with our intuitive planning tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}