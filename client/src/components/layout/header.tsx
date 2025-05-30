import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, Settings, Home, Save, Share, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AuthModal from "@/components/auth/auth-modal";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  onSave?: () => void;
  onShare?: () => void;
  showActionButtons?: boolean;
}

export default function Header({ onSave, onShare, showActionButtons = false }: HeaderProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get first letter of username for avatar
  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };
  
  return (
    <header className="border-b bg-background sticky top-0 z-30">
      <div className="container px-4 mx-auto py-2">
        {/* Top row with logo and user controls */}
        <div className="flex items-center justify-between">
          {/* App Logo and Name */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Link href="/">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold">
                  WDT
                </div>
              </Link>
              <div className="flex flex-col">
                <Link href="/">
                  <span className="text-xl font-bold">
                    <span className="md:inline hidden">Wedding Day Timeline</span>
                    <span className="md:hidden inline">WD Timeline</span>
                  </span>
                </Link>
                <div className="hidden sm:block">
                  <p className="text-xs text-gray-600">for all couples from <a href="https://lauraandbennyphotography.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Laura and Benny Photography</a></p>
                  <p className="text-xs text-gray-500 hidden md:block">follow us on instagram <a href="https://www.instagram.com/lauraandbennyphotography/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@lauraandbennyphotography</a></p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Mobile Menu Button - Only visible on small screens */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                    <span className={`text-base font-medium transition-colors hover:text-primary ${
                      location === "/" ? "text-primary" : "text-muted-foreground"
                    }`}>
                      Home
                    </span>
                  </Link>
                  {user && (
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <span className={`text-base font-medium transition-colors hover:text-primary ${
                        location === "/profile" ? "text-primary" : "text-muted-foreground"
                      }`}>
                        My Profile
                      </span>
                    </Link>
                  )}
                  {user?.isAdmin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <span className={`text-base font-medium transition-colors hover:text-primary ${
                        location === "/admin" ? "text-primary" : "text-muted-foreground"
                      }`}>
                        Admin
                      </span>
                    </Link>
                  )}
                  
                  {/* Mobile action buttons */}
                  {showActionButtons && isMobile && (
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <h3 className="font-medium mb-3">Actions</h3>
                      <div className="flex flex-col space-y-3">
                        {onSave && (
                          <Button 
                            variant="default" 
                            className="bg-primary hover:bg-primary-dark text-white justify-start" 
                            onClick={onSave}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Timeline
                          </Button>
                        )}
                        
                        {onShare && (
                          <Button 
                            variant="secondary"
                            className="bg-secondary hover:bg-secondary-dark text-white justify-start"
                            onClick={onShare}
                          >
                            <Share className="h-4 w-4 mr-2" />
                            Share Timeline
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 mr-4">
              <Link href="/">
                <span className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === "/" ? "text-primary" : "text-muted-foreground"
                }`}>
                  Home
                </span>
              </Link>
              {user && (
                <Link href="/profile">
                  <span className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === "/profile" ? "text-primary" : "text-muted-foreground"
                  }`}>
                    My Profile
                  </span>
                </Link>
              )}
              {user?.isAdmin && (
                <Link href="/admin">
                  <span className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === "/admin" ? "text-primary" : "text-muted-foreground"
                  }`}>
                    Admin
                  </span>
                </Link>
              )}
            </nav>
            
            {/* Action Buttons - Only show on home page and desktop */}
            {showActionButtons && (
              <div className="hidden md:flex items-center space-x-3 mr-4">
                {onSave && (
                  <Button 
                    variant="default" 
                    className="bg-primary hover:bg-primary-dark text-white" 
                    onClick={onSave}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                )}
                
                {onShare && (
                  <Button 
                    variant="secondary"
                    className="bg-secondary hover:bg-secondary-dark text-white"
                    onClick={onShare}
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                )}
              </div>
            )}
            
            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitial(user.username)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/">
                      <DropdownMenuItem>
                        <Home className="mr-2 h-4 w-4" />
                        <span>Home</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    {user.isAdmin && (
                      <Link href="/admin">
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <AuthModal triggerButton={
                  <Button variant="outline">Log in</Button>
                } />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}