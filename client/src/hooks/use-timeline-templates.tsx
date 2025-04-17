import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define types for templates
export interface TimelineTemplate {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useTimelineTemplates() {
  const { toast } = useToast();
  
  // Query to fetch all templates
  const {
    data: templates,
    isLoading,
    error,
  } = useQuery<TimelineTemplate[]>({
    queryKey: ["/api/timeline-templates"],
    retry: false,
  });
  
  // Mutation to apply a template to a timeline
  const applyTemplateMutation = useMutation({
    mutationFn: async ({ 
      timelineId, 
      templateId 
    }: { 
      timelineId: number; 
      templateId: number;
    }) => {
      const response = await apiRequest(
        "POST", 
        `/api/timelines/${timelineId}/apply-template`, 
        { templateId }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to apply template" }));
        throw new Error(errorData.message || "Failed to apply template");
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Template applied",
        description: "The template has been applied to your timeline successfully.",
      });
      
      // Invalidate timeline events to refresh the timeline
      queryClient.invalidateQueries({ 
        queryKey: ["/api/timeline-events", variables.timelineId] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error applying template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return {
    templates,
    isLoading,
    error,
    applyTemplate: applyTemplateMutation.mutate,
    isApplying: applyTemplateMutation.isPending,
  };
}