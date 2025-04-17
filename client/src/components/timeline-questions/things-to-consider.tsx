import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useTimelineQuestions,
  useUserQuestionResponses,
  type TimelineQuestion,
} from "@/hooks/use-timeline-questions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, ChevronDown, ChevronUp, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ThingsToConsiderProps {
  timelineId: number;
  onAddEvent: (eventData: any) => void;
}

export default function ThingsToConsider({ timelineId, onAddEvent }: ThingsToConsiderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [expandedSection, setExpandedSection] = useState(true);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [followUpData, setFollowUpData] = useState<Record<string, any>>({});
  
  // Fetch questions and user responses
  const { questions, isLoadingQuestions, questionsError } = useTimelineQuestions();
  const {
    responses,
    isLoadingResponses,
    responsesError,
    createResponseMutation,
    updateResponseMutation,
    getResponseForQuestion,
  } = useUserQuestionResponses(user?.id || 0, timelineId);
  
  // Loading state
  if (isLoadingQuestions || isLoadingResponses || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex-1">Things to Consider</div>
          </CardTitle>
          <CardDescription>
            Loading questionnaire...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  // Show error message if there was an error loading the questions
  if (questionsError || responsesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex-1">Things to Consider</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was a problem loading the questionnaire. Please try again later or contact the administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Toggle question accordion
  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions({
      ...expandedQuestions,
      [questionId]: !expandedQuestions[questionId],
    });
  };
  
  // Toggle entire section
  const toggleSection = () => {
    setExpandedSection(!expandedSection);
  };
  
  // Handle Yes/No response
  const handleResponse = async (question: TimelineQuestion, answer: boolean) => {
    const existingResponse = getResponseForQuestion(question.id);
    
    if (existingResponse) {
      // If the answer is being changed to No and it was previously Yes,
      // mark as incomplete so it moves to the bottom
      const completed = answer ? existingResponse.completed : false;
      
      await updateResponseMutation.mutate({
        id: existingResponse.id,
        data: {
          answer,
          completed,
          timelineId, // Needed for authorization check
        },
      });
    } else {
      await createResponseMutation.mutate({
        userId: user.id,
        timelineId,
        questionId: question.id,
        answer,
        completed: false,
      });
    }
    
    // Expand the question if answered Yes
    if (answer) {
      setExpandedQuestions({
        ...expandedQuestions,
        [question.id]: true,
      });
      
      // Set initial follow-up data based on defaults
      setFollowUpData({
        ...followUpData,
        [question.id]: {
          name: question.defaultName || "",
          category: question.defaultCategory || "",
          startTime: question.defaultStartTime || "",
          endTime: question.defaultEndTime || "",
          color: question.defaultColor || "#4f46e5",
          notes: question.defaultNotes || "",
        },
      });
      
      setCurrentQuestionId(question.id);
    }
  };
  
  // Handle follow-up form input changes
  const handleFollowUpChange = (questionId: number, field: string, value: string) => {
    setFollowUpData({
      ...followUpData,
      [questionId]: {
        ...(followUpData[questionId] || {}),
        [field]: value,
      },
    });
  };
  
  // Add event to timeline
  const handleAddEvent = (questionId: number) => {
    const question = questions.find(q => q.id === questionId);
    const formData = followUpData[questionId] || {};
    
    if (!question) return;
    
    const response = getResponseForQuestion(questionId);
    
    // Validate required fields
    const requiredFields = [];
    if (question.promptName && !formData.name) requiredFields.push("Name");
    if (question.promptCategory && !formData.category) requiredFields.push("Category");
    if (question.promptStartTime && !formData.startTime) requiredFields.push("Start Time");
    if (question.promptEndTime && !formData.endTime) requiredFields.push("End Time");
    
    if (requiredFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: `Please fill in: ${requiredFields.join(", ")}`,
      });
      return;
    }
    
    // Create event data
    const eventData = {
      userId: user.id,
      timelineId,
      name: formData.name || question.defaultName,
      category: formData.category || question.defaultCategory,
      startTime: formData.startTime || question.defaultStartTime,
      endTime: formData.endTime || question.defaultEndTime,
      color: formData.color || question.defaultColor,
      notes: formData.notes || question.defaultNotes,
      position: 1000, // Will be sorted by the server
    };
    
    // Add event to timeline
    onAddEvent(eventData);
    
    // Mark question as completed
    if (response) {
      updateResponseMutation.mutate({
        id: response.id,
        data: {
          completed: true,
          timelineId,
        },
      });
    }
    
    // Clear current question
    setCurrentQuestionId(null);
    
    toast({
      title: "Block of Time added",
      description: `${eventData.name} has been added to your timeline.`,
    });
  };
  
  // Separate questions into two groups: unanswered and completed
  const unansweredQuestions = questions?.filter(q => {
    const response = getResponseForQuestion(q.id);
    return !response || (response.answer && !response.completed);
  }) || [];
  
  const completedQuestions = questions?.filter(q => {
    const response = getResponseForQuestion(q.id);
    return response && (!response.answer || (response.answer && response.completed));
  }) || [];
  
  return (
    <Card className="mb-8">
      <CardHeader className="cursor-pointer" onClick={toggleSection}>
        <CardTitle className="flex items-center gap-2">
          <div className="flex-1">Things to Consider</div>
          {expandedSection ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CardTitle>
        <CardDescription>
          Answer these questions to help build your wedding day timeline
        </CardDescription>
      </CardHeader>
      
      {expandedSection && (
        <>
          <CardContent className="space-y-4">
            {unansweredQuestions.length === 0 && completedQuestions.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No timeline questions are available. Check back later or contact your administrator.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Unanswered Questions */}
                {unansweredQuestions.map((question) => {
                  const response = getResponseForQuestion(question.id);
                  const isExpanded = expandedQuestions[question.id];
                  const isAnsweredYes = response?.answer === true;
                  const questionData = followUpData[question.id] || {};
                  
                  return (
                    <div key={question.id} className="border rounded-lg">
                      <div className="p-4 flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{question.question}</h3>
                          {question.description && (
                            <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={isAnsweredYes ? "default" : "outline"}
                            className={isAnsweredYes ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={() => handleResponse(question, true)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Yes
                          </Button>
                          <Button
                            size="sm"
                            variant={response && !response.answer ? "default" : "outline"}
                            className={response && !response.answer ? "bg-destructive hover:bg-destructive/90" : ""}
                            onClick={() => handleResponse(question, false)}
                          >
                            <X className="h-4 w-4 mr-1" /> No
                          </Button>
                        </div>
                      </div>
                      
                      {isAnsweredYes && isExpanded && (
                        <div className="border-t p-4 space-y-4">
                          <div className="text-sm text-muted-foreground">
                            Fill in the details to add this Block of Time to your timeline:
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Name field */}
                            {question.promptName && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Block of Time Name</label>
                                <Input
                                  placeholder={question.defaultName || "Enter Block of Time name"}
                                  value={questionData.name || ""}
                                  onChange={(e) => handleFollowUpChange(question.id, "name", e.target.value)}
                                />
                              </div>
                            )}
                            
                            {/* Category field */}
                            {question.promptCategory && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Input
                                  placeholder={question.defaultCategory || "Enter category"}
                                  value={questionData.category || ""}
                                  onChange={(e) => handleFollowUpChange(question.id, "category", e.target.value)}
                                />
                              </div>
                            )}
                            
                            {/* Start Time field */}
                            {question.promptStartTime && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Start Time</label>
                                <Input
                                  placeholder={question.defaultStartTime || "HH:MM"}
                                  value={questionData.startTime || ""}
                                  onChange={(e) => handleFollowUpChange(question.id, "startTime", e.target.value)}
                                />
                              </div>
                            )}
                            
                            {/* End Time field */}
                            {question.promptEndTime && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">End Time</label>
                                <Input
                                  placeholder={question.defaultEndTime || "HH:MM"}
                                  value={questionData.endTime || ""}
                                  onChange={(e) => handleFollowUpChange(question.id, "endTime", e.target.value)}
                                />
                              </div>
                            )}
                            
                            {/* Color field */}
                            {question.promptColor && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Color</label>
                                <div className="flex gap-2">
                                  <div
                                    className="w-10 h-10 rounded border"
                                    style={{
                                      backgroundColor: questionData.color || question.defaultColor || "#4f46e5",
                                    }}
                                  />
                                  <Input
                                    placeholder={question.defaultColor || "CSS color"}
                                    value={questionData.color || ""}
                                    onChange={(e) => handleFollowUpChange(question.id, "color", e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Notes field */}
                          {question.promptNotes && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Notes</label>
                              <Textarea
                                placeholder={question.defaultNotes || "Add notes (optional)"}
                                value={questionData.notes || ""}
                                onChange={(e) => handleFollowUpChange(question.id, "notes", e.target.value)}
                              />
                            </div>
                          )}
                          
                          <div className="pt-2 flex justify-end">
                            <Button
                              onClick={() => handleAddEvent(question.id)}
                              className="gap-1"
                            >
                              <Plus className="h-4 w-4" /> Add Block of Time
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {isAnsweredYes && !isExpanded && (
                        <div
                          className="border-t p-2 text-center text-sm text-muted-foreground cursor-pointer hover:bg-accent/50"
                          onClick={() => toggleQuestion(question.id)}
                        >
                          Click to add details and create Block of Time
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Separator between sections */}
                {unansweredQuestions.length > 0 && completedQuestions.length > 0 && (
                  <Separator className="my-4" />
                )}
                
                {/* Completed Questions */}
                {completedQuestions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Completed / Ignored Items
                    </h3>
                    
                    <div className="space-y-2">
                      {completedQuestions.map((question) => {
                        const response = getResponseForQuestion(question.id);
                        return (
                          <div
                            key={question.id}
                            className="border rounded-lg p-3 flex justify-between items-center"
                          >
                            <div>
                              <h4 className="text-sm font-medium">{question.question}</h4>
                            </div>
                            <div>
                              {response?.answer ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-1" /> Added
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <X className="h-3 w-3 mr-1" /> Skipped
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}