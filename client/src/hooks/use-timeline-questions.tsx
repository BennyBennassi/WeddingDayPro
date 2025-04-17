import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types for timeline questions
export type TimelineQuestion = {
  id: number;
  question: string;
  description: string | null;
  active: boolean;
  order: number;
  defaultName: string | null;
  defaultCategory: string | null;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  defaultColor: string | null;
  defaultNotes: string | null;
  promptName: boolean;
  promptCategory: boolean;
  promptStartTime: boolean;
  promptEndTime: boolean;
  promptColor: boolean;
  promptNotes: boolean;
  createdAt: string;
};

// Types for user question responses
export type UserQuestionResponse = {
  id: number;
  userId: number;
  timelineId: number;
  questionId: number;
  answer: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

// Hook for fetching timeline questions (user-facing)
export function useTimelineQuestions() {
  const {
    data: questions = [],
    isLoading,
    error,
  } = useQuery<TimelineQuestion[]>({
    queryKey: ['/api/timeline-questions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/timeline-questions');
      if (!res.ok) {
        throw new Error('Failed to fetch timeline questions');
      }
      return await res.json();
    },
  });
  
  return {
    questions,
    isLoadingQuestions: isLoading,
    questionsError: error,
  };
}

// Hook for handling user question responses
export function useUserQuestionResponses(userId: number, timelineId: number) {
  const { toast } = useToast();
  
  const {
    data: responses = [],
    isLoading,
    error,
  } = useQuery<UserQuestionResponse[]>({
    queryKey: [`/api/user-question-responses/${userId}/${timelineId}`],
    queryFn: async () => {
      if (!userId || !timelineId) return [];
      
      const res = await apiRequest(
        'GET',
        `/api/user-question-responses/${userId}/${timelineId}`
      );
      if (!res.ok) {
        throw new Error('Failed to fetch user responses');
      }
      return await res.json();
    },
    enabled: !!userId && !!timelineId,
  });
  
  // Create response mutation
  const createResponseMutation = useMutation({
    mutationFn: async (data: Omit<UserQuestionResponse, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/user-question-responses', data);
      if (!res.ok) {
        throw new Error('Failed to save response');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/user-question-responses/${userId}/${timelineId}`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update response mutation
  const updateResponseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<UserQuestionResponse, 'id' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const res = await apiRequest('PUT', `/api/user-question-responses/${id}`, data);
      if (!res.ok) {
        throw new Error('Failed to update response');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/user-question-responses/${userId}/${timelineId}`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Helper to get response for a specific question
  const getResponseForQuestion = (questionId: number) => {
    return responses.find((response) => response.questionId === questionId);
  };
  
  return {
    responses,
    isLoadingResponses: isLoading,
    responsesError: error,
    createResponseMutation,
    updateResponseMutation,
    getResponseForQuestion,
  };
}

// Hook for admin timeline questions management
export function useAdminTimelineQuestions() {
  const { toast } = useToast();
  
  const {
    data: questions = [],
    isLoading,
    error,
  } = useQuery<TimelineQuestion[]>({
    queryKey: ['/api/admin/timeline-questions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/timeline-questions');
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('You do not have permission to access this resource');
        }
        throw new Error('Failed to fetch timeline questions');
      }
      return await res.json();
    },
  });
  
  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: Omit<TimelineQuestion, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/admin/timeline-questions', data);
      if (!res.ok) {
        throw new Error('Failed to create question');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/timeline-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeline-questions'] });
      toast({
        title: 'Success',
        description: 'Question created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<TimelineQuestion, 'id' | 'createdAt'>>;
    }) => {
      const res = await apiRequest('PUT', `/api/admin/timeline-questions/${id}`, data);
      if (!res.ok) {
        throw new Error('Failed to update question');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/timeline-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeline-questions'] });
      toast({
        title: 'Success',
        description: 'Question updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/timeline-questions/${id}`);
      if (!res.ok) {
        throw new Error('Failed to delete question');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/timeline-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeline-questions'] });
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  return {
    questions,
    isLoadingQuestions: isLoading,
    questionsError: error,
    createQuestionMutation,
    updateQuestionMutation,
    deleteQuestionMutation,
  };
}