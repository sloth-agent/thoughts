import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Thought, NetworkStats } from "@shared/schema";
import ThoughtForm from "@/components/thought-form";
import ThoughtCard from "@/components/thought-card";
import NetworkSidebar from "@/components/network-sidebar";
import SearchBar from "@/components/search-bar";
import MobileThoughtModal from "@/components/mobile-thought-modal";
import ConnectionsModal from "@/components/connections-modal";
import ThoughtOfTheDay from "@/components/thought-of-the-day";
import { Brain, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdUnit from "@/components/ad-unit";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const handleViewConnections = (thoughtId: string) => {
    setSelectedThoughtId(thoughtId);
  };


  const { data: thoughts = [], isLoading } = useQuery<Thought[]>({
    queryKey: ["/api/thoughts"],
  });

  const { data: stats } = useQuery<NetworkStats>({
    queryKey: ["/api/stats"],
  });

  const { data: searchResults = [] } = useQuery<Thought[]>({
    queryKey: ["/api/thoughts/search", searchQuery],
    queryFn: () => fetch(`/api/thoughts/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    enabled: searchQuery.length > 0,
  });

  const displayedThoughts = searchQuery ? searchResults : thoughts;

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="text-2xl text-primary" />
              <h1 className="text-2xl font-bold text-foreground">I Think Too Much</h1>
            </div>
            
            <div className="flex-1 max-w-md mx-8">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                data-testid="search-input"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                data-testid="button-network-toggle"
              >
                <i className="fas fa-project-diagram text-xl" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                data-testid="button-profile"
              >
                <i className="fas fa-user-circle text-xl" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Thought of the Day */}
            <ThoughtOfTheDay onViewConnections={handleViewConnections} />

            {/* New Thought Input */}
            <div className="mb-8">
              <ThoughtForm data-testid="form-new-thought" />
            </div>

            {/* Thoughts Feed */}
            <div className="space-y-6" data-testid="thoughts-feed">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading thoughts...</p>
                </div>
              ) : displayedThoughts.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery ? "No matching thoughts found" : "No thoughts yet"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Try searching for different keywords or themes."
                      : "Be the first to share your thoughts and start the conversation."
                    }
                  </p>
                </div>
              ) : (
                displayedThoughts.flatMap((thought, index) => {
                  const items = [
                    <ThoughtCard
                      key={thought.id}
                      thought={thought}
                      onViewConnections={handleViewConnections}
                      data-testid={`card-thought-${thought.id}`}
                    />,
                  ];

                  if ((index + 1) % 3 === 0) {
                    items.push(
                      <AdUnit
                        key={`ad-${index}`}
                        adSlot="YOUR_AD_SLOT_ID"
                        className="my-6"
                      />,
                    );
                  }

                  return items;
                })
              )}
            </div>
          </div>

          {/* Network Sidebar */}
          <div className="lg:col-span-1">
            <NetworkSidebar 
              thoughts={thoughts}
              stats={stats}
              data-testid="sidebar-network"
            />
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <Button
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-40"
        onClick={() => setShowMobileModal(true)}
        data-testid="button-mobile-add"
      >
        <Plus className="text-xl" />
      </Button>

      {/* Mobile Thought Modal */}
      <MobileThoughtModal
        open={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        data-testid="modal-mobile-thought"
      />

      {/* Connections Modal */}
      <ConnectionsModal
        open={!!selectedThoughtId}
        onClose={() => setSelectedThoughtId(null)}
        thoughtId={selectedThoughtId}
      />
    </div>
  );
}
