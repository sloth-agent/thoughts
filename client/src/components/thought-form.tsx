import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertThoughtSchema, type InsertThought } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ThoughtForm() {
  const [characterCount, setCharacterCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertThought>({
    resolver: zodResolver(insertThoughtSchema),
    defaultValues: {
      content: "",
    },
  });

  const createThoughtMutation = useMutation({
    mutationFn: (data: InsertThought) => apiRequest("POST", "/api/thoughts", data),
    onSuccess: () => {
      form.reset();
      setCharacterCount(0);
      queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Thought shared!",
        description: "Your thought has been added and AI is finding connections.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share thought. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertThought) => {
    createThoughtMutation.mutate(data);
  };

  const handleContentChange = (value: string) => {
    setCharacterCount(value.length);
    form.setValue("content", value);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Share a thought</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What's on your mind? Share your thoughts and see how they connect with others..."
                      className="resize-none min-h-[100px]"
                      onChange={(e) => {
                        field.onChange(e);
                        handleContentChange(e.target.value);
                      }}
                      data-testid="textarea-thought-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center mt-4">
              <span 
                className="text-sm text-muted-foreground"
                data-testid="text-character-count"
              >
                {characterCount}/280 characters
              </span>
              <Button
                type="submit"
                disabled={createThoughtMutation.isPending || characterCount === 0}
                data-testid="button-submit-thought"
              >
                {createThoughtMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2" size={16} />
                    Share Thought
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
