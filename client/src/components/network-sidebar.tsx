import { useEffect, useRef } from "react";
import type { Thought, NetworkStats } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expand } from "lucide-react";

interface NetworkSidebarProps {
  thoughts: Thought[];
  stats?: NetworkStats;
}

export default function NetworkSidebar({ thoughts, stats }: NetworkSidebarProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || thoughts.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Simple network visualization
    const nodes = thoughts.slice(0, 10).map((thought, index) => ({
      id: thought.id,
      x: Math.random() * (width - 40) + 20,
      y: Math.random() * (height - 40) + 20,
      connections: thought.connections.length,
    }));

    // Clear existing content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Draw connections
    nodes.forEach((node) => {
      node.connections > 0 && nodes.forEach((otherNode) => {
        if (node.id !== otherNode.id && Math.random() > 0.7) {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", node.x.toString());
          line.setAttribute("y1", node.y.toString());
          line.setAttribute("x2", otherNode.x.toString());
          line.setAttribute("y2", otherNode.y.toString());
          line.setAttribute("class", "stroke-muted-foreground stroke-1 opacity-40");
          svg.appendChild(line);
        }
      });
    });

    // Draw nodes
    nodes.forEach((node) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", node.x.toString());
      circle.setAttribute("cy", node.y.toString());
      circle.setAttribute("r", Math.max(4, Math.min(12, node.connections * 2 + 4)).toString());
      circle.setAttribute("class", "fill-primary cursor-pointer hover:fill-accent transition-colors");
      circle.setAttribute("data-testid", `node-${node.id}`);
      svg.appendChild(circle);
    });
  }, [thoughts]);

  const uniqueThemes = Array.from(
    new Set(thoughts.flatMap(t => t.tags))
  ).slice(0, 6);

  return (
    <div className="sticky top-24 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Thought Network</CardTitle>
            <Button variant="ghost" size="icon" data-testid="button-expand-network">
              <Expand size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 bg-muted rounded-md overflow-hidden mb-4">
            <svg
              ref={svgRef}
              className="w-full h-full"
              viewBox="0 0 300 200"
              data-testid="svg-network-graph"
            />
            
            {thoughts.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <i className="fas fa-project-diagram text-4xl text-muted-foreground opacity-50"></i>
                  <p className="text-sm text-muted-foreground mt-2">AI-powered connections</p>
                </div>
              </div>
            )}
          </div>
          
          {uniqueThemes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-card-foreground">Connected Themes</h4>
              <div className="flex flex-wrap gap-2">
                {uniqueThemes.map((theme) => (
                  <Badge
                    key={theme}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    data-testid={`theme-${theme}`}
                  >
                    #{theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Network Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Thoughts</span>
              <span className="font-semibold text-card-foreground" data-testid="stat-total-thoughts">
                {stats?.totalThoughts || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Connections</span>
              <span className="font-semibold text-card-foreground" data-testid="stat-active-connections">
                {stats?.activeConnections || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Your Contributions</span>
              <span className="font-semibold text-accent" data-testid="stat-user-contributions">
                {stats?.userContributions || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
