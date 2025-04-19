import { useState } from "react";
import { useAdminTimelineQuestions, type TimelineQuestion } from "@/hooks/use-timeline-questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ColorPicker from "@/components/ui/color-picker";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Save, Trash } from "lucide-react";
import TimeSelect from "@/components/ui/time-select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const questionSchema = z.object({
  question: z.string().min(5, { message: "Question must be at least 5 characters" }),
  description: z.string().optional(),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
  defaultName: z.string().optional(),
  defaultCategory: z.string().optional(),
  defaultStartTime: z.string().optional(),
  defaultEndTime: z.string().optional(),
  defaultColor: z.string().optional(),
  defaultNotes: z.string().optional(),
  promptName: z.boolean().default(true),
  promptCategory: z.boolean().default(false),
  promptStartTime: z.boolean().default(true),
  promptEndTime: z.boolean().default(true),
  promptColor: z.boolean().default(false),
  promptNotes: z.boolean().default(false),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

export default function TimelineQuestionsManager() {
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  
  const {
    questions,
    isLoadingQuestions,
    questionsError,
    createQuestionMutation,
    updateQuestionMutation,
    deleteQuestionMutation,
  } = useAdminTimelineQuestions();
  
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: selectedQuestion ? {
      question: selectedQuestion.question,
      description: selectedQuestion.description || "",
      active: selectedQuestion.active,
      order: selectedQuestion.order,
      defaultName: selectedQuestion.defaultName || "",
      defaultCategory: selectedQuestion.defaultCategory || "",
      defaultStartTime: selectedQuestion.defaultStartTime || "",
      defaultEndTime: selectedQuestion.defaultEndTime || "",
      defaultColor: selectedQuestion.defaultColor || "",
      defaultNotes: selectedQuestion.defaultNotes || "",
      promptName: selectedQuestion.promptName,
      promptCategory: selectedQuestion.promptCategory,
      promptStartTime: selectedQuestion.promptStartTime,
      promptEndTime: selectedQuestion.promptEndTime,
      promptColor: selectedQuestion.promptColor,
      promptNotes: selectedQuestion.promptNotes,
    } : {
      question: "",
      description: "",
      active: true,
      order: questions.length,
      defaultName: "",
      defaultCategory: "",
      defaultStartTime: "",
      defaultEndTime: "",
      defaultColor: "bg-primary-light",
      defaultNotes: "",
      promptName: true,
      promptCategory: false,
      promptStartTime: true,
      promptEndTime: true,
      promptColor: false,
      promptNotes: false,
    }
  });
  
  const handleSelectQuestion = (question: TimelineQuestion) => {
    setSelectedQuestionId(question.id);
    setShowNewForm(false);
    
    form.reset({
      question: question.question,
      description: question.description || "",
      active: question.active,
      order: question.order,
      defaultName: question.defaultName || "",
      defaultCategory: question.defaultCategory || "",
      defaultStartTime: question.defaultStartTime || "",
      defaultEndTime: question.defaultEndTime || "",
      defaultColor: question.defaultColor || "bg-primary-light",
      defaultNotes: question.defaultNotes || "",
      promptName: question.promptName,
      promptCategory: question.promptCategory,
      promptStartTime: question.promptStartTime,
      promptEndTime: question.promptEndTime,
      promptColor: question.promptColor,
      promptNotes: question.promptNotes,
    });
  };
  
  const handleNewQuestion = () => {
    setSelectedQuestionId(null);
    setShowNewForm(true);
    
    form.reset({
      question: "",
      description: "",
      active: true,
      order: questions.length,
      defaultName: "",
      defaultCategory: "",
      defaultStartTime: "",
      defaultEndTime: "",
      defaultColor: "bg-primary-light",
      defaultNotes: "",
      promptName: false,
      promptCategory: false,
      promptStartTime: false,
      promptEndTime: false,
      promptColor: false,
      promptNotes: false,
    });
  };
  
  const onSubmit = (data: QuestionFormValues) => {
    console.log('Form submitted:', data);
    if (selectedQuestionId) {
      console.log(`Updating question with ID ${selectedQuestionId}:`, data);
      updateQuestionMutation.mutate({ id: selectedQuestionId, data }, {
        onSuccess: (updated) => {
          console.log('Question updated successfully:', updated);
        },
        onError: (error) => {
          console.error('Error updating question:', error);
        }
      });
    } else {
      createQuestionMutation.mutate(data);
      setShowNewForm(false);
    }
  };
  
  const handleDeleteQuestion = () => {
    if (selectedQuestionId && confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(selectedQuestionId);
      setSelectedQuestionId(null);
      setShowNewForm(false);
    }
  };
  
  if (isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (questionsError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Error loading timeline questions. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timeline Questions Manager</h2>
        <Button onClick={handleNewQuestion}>
          <Plus className="mr-2 h-4 w-4" /> Add New Question
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h3 className="font-medium">Questions</h3>
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions added yet.</p>
          ) : (
            <div className="space-y-2">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`p-3 rounded-md cursor-pointer border ${
                    selectedQuestionId === question.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                  onClick={() => handleSelectQuestion(question)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        question.active ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span className="font-medium">{question.question}</span>
                  </div>
                  {question.description && (
                    <p className="mt-1 text-sm text-muted-foreground truncate">
                      {question.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedQuestionId
                  ? "Edit Question"
                  : showNewForm
                  ? "Add New Question"
                  : "Select or Create a Question"}
              </CardTitle>
              <CardDescription>
                {selectedQuestionId || showNewForm
                  ? "Configure the question and default values"
                  : "Select a question from the list or create a new one"}
              </CardDescription>
            </CardHeader>
            
            {(selectedQuestionId || showNewForm) && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-6">
                    <Tabs defaultValue="general">
                      <TabsList className="mb-4">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="field_settings">Field Settings</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="general" className="space-y-4">
                        <FormField
                          control={form.control}
                          name="question"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter the yes/no question" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is the yes/no question asked to the user
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Add more details about this question (optional)"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Additional information to help the user understand the question
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Active</FormLabel>
                                  <FormDescription>
                                    Show this question to users
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Order</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="Order"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Lower numbers appear first
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="field_settings" className="space-y-6">
                        <div className="bg-muted/50 rounded-lg p-4 mb-6">
                          <h4 className="font-medium mb-2">How to use Field Settings</h4>
                          <div className="text-sm text-muted-foreground">
                            <strong>Prompt user toggle:</strong>
                            <ul className="mt-1 ml-6 space-y-1 list-disc">
                              <li>ON — User will be prompted to provide this information</li>
                              <li>OFF — User will not be prompted and the default value below will be used automatically</li>
                            </ul>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            For fields that aren't prompted, make sure to provide appropriate default values.
                          </p>
                        </div>
                        
                        {/* Name field settings */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Block of Time Name</h3>
                            <FormField
                              control={form.control}
                              name="promptName"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 m-0">
                                  <FormLabel className="text-sm font-normal">Prompt user</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="defaultName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Default Value</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Block of Time name"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormDescription>
                                  If "Prompt user" is OFF, this value will be used automatically. If ON, it will be shown as a suggestion.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Category field settings */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Block of Time Category</h3>
                            <FormField
                              control={form.control}
                              name="promptCategory"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 m-0">
                                  <FormLabel className="text-sm font-normal">Prompt user</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="defaultCategory"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Default Value</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="morning_prep">Morning Prep</SelectItem>
                                    <SelectItem value="travel">Travel</SelectItem>
                                    <SelectItem value="ceremony">Ceremony</SelectItem>
                                    <SelectItem value="photos">Photos</SelectItem>
                                    <SelectItem value="drinks_reception">Drinks Reception</SelectItem>
                                    <SelectItem value="bell_call">Bell Call</SelectItem>
                                    <SelectItem value="entrance">Entrance</SelectItem>
                                    <SelectItem value="dining">Dining</SelectItem>
                                    <SelectItem value="speeches">Speeches</SelectItem>
                                    <SelectItem value="entertainment">Entertainment</SelectItem>
                                    <SelectItem value="dancing">Dancing</SelectItem>
                                    <SelectItem value="residence">Residence</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  If "Prompt user" is OFF, this value will be used automatically. If ON, it will be shown as a suggestion.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Time field settings */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Block of Time Timing</h3>
                            <div className="flex items-center space-x-4">
                              <FormField
                                control={form.control}
                                name="promptStartTime"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 m-0">
                                    <FormLabel className="text-sm font-normal">Prompt for start</FormLabel>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="promptEndTime"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 m-0">
                                    <FormLabel className="text-sm font-normal">Prompt for end</FormLabel>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="defaultStartTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default Start Time</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="HH:MM"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="defaultEndTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default End Time</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="HH:MM"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormDescription>
                            Enter times in 24-hour format (e.g. "14:30" for 2:30 PM). For either toggle that is OFF, the default time will be used automatically.
                          </FormDescription>
                        </div>
                        
                        {/* Color field settings */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Block of Time Color</h3>
                            <FormField
                              control={form.control}
                              name="promptColor"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 m-0">
                                  <FormLabel className="text-sm font-normal">Prompt user</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="defaultColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Default Color</FormLabel>
                                <FormControl>
                                  <ColorPicker
                                    value={field.value || "bg-primary-light"}
                                    onChange={(color) => field.onChange(color)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  If "Prompt user" is OFF, this color will be used automatically. If ON, it will be shown as a suggestion.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Notes field settings */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Block of Time Notes</h3>
                            <FormField
                              control={form.control}
                              name="promptNotes"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 m-0">
                                  <FormLabel className="text-sm font-normal">Prompt user</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="defaultNotes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Default Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Default notes for this Block of Time (optional)"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormDescription>
                                  If "Prompt user" is OFF, these notes will be used automatically. If ON, they will be shown as a suggestion.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    {selectedQuestionId && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDeleteQuestion}
                        disabled={deleteQuestionMutation.isPending}
                      >
                        {deleteQuestionMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    )}
                    <div className="ml-auto">
                      <Button
                        type="submit"
                        disabled={
                          createQuestionMutation.isPending ||
                          updateQuestionMutation.isPending
                        }
                      >
                        {(createQuestionMutation.isPending ||
                          updateQuestionMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Save className="mr-2 h-4 w-4" />
                        {selectedQuestionId ? "Update" : "Create"}
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </Form>
            )}
            
            {!selectedQuestionId && !showNewForm && (
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Select a question from the list or create a new one to get started
                  </p>
                  <Button onClick={handleNewQuestion}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Question
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}