import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertThoughtSchema, type InsertThought } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MobileThoughtModalProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileThoughtModal({ open, onClose }: MobileThoughtModalProps) {
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
      onClose();
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>New Thought</DialogTitle>
        </DialogHeader>
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
                      placeholder="What's on your mind?"
                      className="resize-none min-h-[100px]"
                      onChange={(e) => {
                        field.onChange(e);
                        handleContentChange(e.target.value);
                      }}
                      data-testid="textarea-mobile-thought"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground" data-testid="text-mobile-character-count">
                {characterCount}/280
              </span>
              <Button
                type="submit"
                disabled={createThoughtMutation.isPending || characterCount === 0}
                data-testid="button-mobile-submit"
              >
                {createThoughtMutation.isPending ? "Sharing..." : "Share"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
