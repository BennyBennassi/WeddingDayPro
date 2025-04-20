import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface AppSetting {
  id: number;
  key: string;
  value: any;
  description: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const SettingsManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("admin");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<AppSetting | null>(null);
  const [newSetting, setNewSetting] = useState({
    key: "",
    value: "",
    description: "",
    category: "admin",
  });

  // Get app settings for the active category
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery<AppSetting[]>({
    queryKey: ["/api/app-settings", activeCategory],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/app-settings?category=${activeCategory}`
      );
      return response.json();
    },
    enabled: !!user?.isAdmin,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (setting: typeof newSetting) => {
      let valueToSend = setting.value;
      try {
        // Try to parse JSON if it's valid
        valueToSend = JSON.parse(setting.value);
      } catch (e) {
        // Not valid JSON, use as is (string)
      }

      const response = await apiRequest("POST", "/api/app-settings", {
        ...setting,
        value: valueToSend,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/app-settings", activeCategory],
      });
      setIsCreateDialogOpen(false);
      setNewSetting({
        key: "",
        value: "",
        description: "",
        category: activeCategory,
      });
      toast({
        title: "Setting created",
        description: "The setting was created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (setting: {
      key: string;
      value: any;
      description?: string;
      category?: string;
    }) => {
      let valueToSend = setting.value;
      try {
        // Try to parse JSON if it's valid
        if (typeof setting.value === "string") {
          valueToSend = JSON.parse(setting.value);
        }
      } catch (e) {
        // Not valid JSON, use as is (string)
      }

      const response = await apiRequest(
        "PUT",
        `/api/app-settings/${setting.key}`,
        {
          ...setting,
          value: valueToSend,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/app-settings", activeCategory],
      });
      setIsEditDialogOpen(false);
      setEditingSetting(null);
      toast({
        title: "Setting updated",
        description: "The setting was updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      await apiRequest("DELETE", `/api/app-settings/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/app-settings", activeCategory],
      });
      toast({
        title: "Setting deleted",
        description: "The setting was deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateSetting = () => {
    if (!newSetting.key || !newSetting.category) {
      toast({
        title: "Validation error",
        description: "Key and category are required.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newSetting);
  };

  const handleUpdateSetting = () => {
    if (!editingSetting) return;
    updateMutation.mutate({
      key: editingSetting.key,
      value: editingSetting.value,
      description: editingSetting.description || undefined,
      category: editingSetting.category,
    });
  };

  const handleDeleteSetting = (key: string) => {
    if (window.confirm("Are you sure you want to delete this setting?")) {
      deleteMutation.mutate(key);
    }
  };

  const handleEditSetting = (setting: AppSetting) => {
    // For display in the form, convert value to JSON string if it's an object
    const settingToEdit = {
      ...setting,
      value:
        typeof setting.value === "object"
          ? JSON.stringify(setting.value, null, 2)
          : setting.value,
    };
    setEditingSetting(settingToEdit);
    setIsEditDialogOpen(true);
  };

  if (!user?.isAdmin) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  const availableCategories = ["admin", "system", "timeline", "email"];

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Application Settings Manager</h1>
          <p className="text-muted-foreground">
            Manage persistent application settings and configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Setting
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue={activeCategory}
        onValueChange={setActiveCategory}
        className="w-full"
      >
        <TabsList className="mb-4">
          {availableCategories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableCategories.map((category) => (
          <TabsContent key={category} value={category}>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-destructive">
                  Error loading settings: {(error as Error).message}
                </p>
                <Button variant="outline" onClick={() => refetch()} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : settings && settings.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {settings.map((setting) => (
                  <SettingCard
                    key={setting.id}
                    setting={setting}
                    onEdit={() => handleEditSetting(setting)}
                    onDelete={() => handleDeleteSetting(setting.key)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No settings found for category '{category}'
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Setting
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Setting Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Setting</DialogTitle>
            <DialogDescription>
              Add a new application setting with a unique key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-key">Key</Label>
              <Input
                id="new-key"
                placeholder="setting_key"
                value={newSetting.key}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, key: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-category">Category</Label>
              <select
                id="new-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newSetting.category}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, category: e.target.value })
                }
              >
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value">Value (JSON or string)</Label>
              <Textarea
                id="new-value"
                placeholder='{"example": "value"} or simple string'
                rows={4}
                value={newSetting.value}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, value: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea
                id="new-description"
                placeholder="What this setting is used for"
                value={newSetting.description}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSetting}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Setting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Setting Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update the setting value and description.
            </DialogDescription>
          </DialogHeader>
          {editingSetting && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-key">Key</Label>
                <Input
                  id="edit-key"
                  value={editingSetting.key}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editingSetting.category}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-value">Value (JSON or string)</Label>
                <Textarea
                  id="edit-value"
                  rows={6}
                  value={
                    typeof editingSetting.value === "string"
                      ? editingSetting.value
                      : JSON.stringify(editingSetting.value, null, 2)
                  }
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      value: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingSetting.description || ""}
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSetting}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Component to display a single setting card
const SettingCard: React.FC<{
  setting: AppSetting;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ setting, onEdit, onDelete }) => {
  // Format the setting value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="truncate">{setting.key}</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            {setting.category}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          {setting.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted p-2 rounded text-xs font-mono overflow-auto max-h-[100px]">
          {formatValue(setting.value)}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <div>Created: {new Date(setting.createdAt).toLocaleString()}</div>
          <div>Updated: {new Date(setting.updatedAt).toLocaleString()}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SettingsManager;