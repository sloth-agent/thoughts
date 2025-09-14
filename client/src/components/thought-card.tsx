import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Thought } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Link as LinkIcon, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ThoughtCardProps {
  thought: Thought;
  onViewConnections: (thoughtId: string) => void;
}

export default function ThoughtCard({ thought, onViewConnections }: ThoughtCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/thoughts/${thought.id}/like`),
    onSuccess: () => {
      setIsLiked(true);
      queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      toast({
        title: "Thought liked!",
        description: "Your appreciation has been noted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like thought. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="text-primary-foreground" size={16} />
            </div>
            <div>
              <p className="font-medium text-card-foreground" data-testid={`text-author-${thought.id}`}>
                {thought.author}
              </p>
              <p className="text-sm text-muted-foreground" data-testid={`text-timestamp-${thought.id}`}>
                {formatTimeAgo(thought.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" data-testid={`badge-connections-${thought.id}`}>
              {thought.connections.length} connections
            </Badge>
          </div>
        </div>
        
        <p className="text-card-foreground mb-4 leading-relaxed" data-testid={`text-content-${thought.id}`}>
          {thought.content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => likeMutation.mutate()}
              disabled={isLiked || likeMutation.isPending}
              className="text-muted-foreground hover:text-accent transition-colors"
              data-testid={`button-like-${thought.id}`}
            >
              <Lightbulb className="mr-1" size={16} />
              <span data-testid={`text-likes-${thought.id}`}>
                {thought.likes + (isLiked ? 1 : 0)}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid={`button-connections-${thought.id}`}
              onClick={() => onViewConnections(thought.id)}
            >
              <LinkIcon className="mr-1" size={16} />
              View Connections
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {thought.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs"
                data-testid={`tag-${tag}-${thought.id}`}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
