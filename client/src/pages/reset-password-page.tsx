import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center">
          <ResetPasswordForm />
        </div>
        
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary-foreground to-muted p-8 rounded-lg">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Wedding Day Timeline</h1>
            <p className="text-lg">
              Create a new password to secure your wedding timeline planner.
            </p>
            <p className="text-md text-muted-foreground pt-4">
              Your wedding planning tools will be accessible once you create a new password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}