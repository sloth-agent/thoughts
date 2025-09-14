
import { useQuery } from "@tanstack/react-query";
import type { Thought } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ThoughtCard from "@/components/thought-card";
import { apiRequest } from "@/lib/queryClient";

interface ConnectionsModalProps {
  open: boolean;
  onClose: () => void;
  thoughtId: string | null;
}

export default function ConnectionsModal({ open, onClose, thoughtId }: ConnectionsModalProps) {
  const { data: connectedThoughts = [], isLoading } = useQuery<Thought[]>({
    queryKey: ["/api/thoughts", thoughtId, "connections"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/thoughts/${thoughtId}/connections`);
      return res.json();
    },
    enabled: !!thoughtId,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connected Thoughts</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading connections...</p>
            </div>
          ) : connectedThoughts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No connections found for this thought.</p>
            </div>
          ) : (
            connectedThoughts.map(thought => (
              <ThoughtCard key={thought.id} thought={thought} onViewConnections={() => {}} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
