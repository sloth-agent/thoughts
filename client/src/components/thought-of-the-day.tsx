
import { useQuery } from "@tanstack/react-query";
import type { Thought } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ThoughtCard from "@/components/thought-card";
import { apiRequest } from "@/lib/queryClient";

interface ThoughtOfTheDayProps {
  onViewConnections: (thoughtId: string) => void;
}

export default function ThoughtOfTheDay({ onViewConnections }: ThoughtOfTheDayProps) {
  const { data: thought, isLoading } = useQuery<Thought>({
    queryKey: ["/api/thought-of-the-day"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/thought-of-the-day");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading thought of the day...</p>
      </div>
    );
  }

  if (!thought) {
    return null;
  }

  return (
    <Card className="mb-8 bg-gradient-to-r from-primary/10 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg">Thought of the Day</CardTitle>
      </CardHeader>
      <CardContent>
        <ThoughtCard thought={thought} onViewConnections={onViewConnections} />
      </CardContent>
    </Card>
  );
}
