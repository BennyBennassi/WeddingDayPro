import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

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

export function useTimelineQuestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: questions = [],
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useQuery<TimelineQuestion[]>({
    queryKey: ["/api/timeline-questions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return {
    questions,
    isLoadingQuestions,
    questionsError,
  };
}

export function useUserQuestionResponses(userId: number, timelineId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: responses = [],
    isLoading: isLoadingResponses,
    error: responsesError,
  } = useQuery<UserQuestionResponse[]>({
    queryKey: [`/api/user-question-responses/${userId}/${timelineId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Only fetch if user is authenticated and the userId matches the current user (or is admin)
    enabled: !!user && (user.id === userId || user.isAdmin),
  });

  const createResponseMutation = useMutation({
    mutationFn: async (responseData: {
      userId: number;
      timelineId: number;
      questionId: number;
      answer: boolean;
      completed: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/user-question-responses", responseData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-question-responses/${userId}/${timelineId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving response",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateResponseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<UserQuestionResponse, "id" | "createdAt" | "updatedAt">>;
    }) => {
      const res = await apiRequest("PUT", `/api/user-question-responses/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-question-responses/${userId}/${timelineId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating response",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getResponseForQuestion = (questionId: number) => {
    return responses.find((response) => response.questionId === questionId);
  };

  return {
    responses,
    isLoadingResponses,
    responsesError,
    createResponseMutation,
    updateResponseMutation,
    getResponseForQuestion,
  };
}

export function useAdminTimelineQuestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: questions = [],
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useQuery<TimelineQuestion[]>({
    queryKey: ["/api/admin/timeline-questions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: Omit<TimelineQuestion, "id" | "createdAt">) => {
      const res = await apiRequest("POST", "/api/admin/timeline-questions", questionData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline-questions"] });
      toast({
        title: "Question created",
        description: "The timeline question has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<TimelineQuestion, "id" | "createdAt">>;
    }) => {
      const res = await apiRequest("PUT", `/api/admin/timeline-questions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline-questions"] });
      toast({
        title: "Question updated",
        description: "The timeline question has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/timeline-questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline-questions"] });
      toast({
        title: "Question deleted",
        description: "The timeline question has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    questions,
    isLoadingQuestions,
    questionsError,
    createQuestionMutation,
    updateQuestionMutation,
    deleteQuestionMutation,
  };
}