
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Thought } from '@shared/schema';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  content: string;
  connections: string[];
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

export function useNetworkGraph(thoughts: Thought[]) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || thoughts.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svg.node()!.getBoundingClientRect().width;
    const height = svg.node()!.getBoundingClientRect().height;

    svg.selectAll('*').remove();

    const nodes: Node[] = thoughts.map(t => ({
      id: t.id,
      content: t.content,
      connections: t.connections,
    }));

    const links: Link[] = [];
    const thoughtMap = new Map(thoughts.map(t => [t.id, t]));

    thoughts.forEach(thought => {
      thought.connections.forEach(connectionId => {
        if (thoughtMap.has(connectionId) && thought.id < connectionId) {
          links.push({
            source: thought.id,
            target: connectionId,
          });
        }
      });
    });

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    const defs = svg.append('defs');

    const filter = defs.append('filter')
      .attr('id', 'glow');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3.5')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    const backgroundPattern = defs.append('pattern')
      .attr('id', 'background')
      .attr('width', 40)
      .attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse');

    backgroundPattern.append('path')
      .attr('d', 'M0,0 H40 V40 H0 Z')
      .attr('fill', '#f0f0f0');
    backgroundPattern.append('path')
      .attr('d', 'M10,0 V40 M20,0 V40 M30,0 V40 M0,10 H40 M0,20 H40 M0,30 H40')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1);

    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#background)');

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('class', 'stroke-muted-foreground stroke-1 opacity-40');

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => Math.max(4, Math.min(12, d.connections.length * 2 + 4)))
      .attr('class', 'fill-primary cursor-pointer')
      .style('filter', 'url(#glow)')
      .call(drag(simulation));
      
    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute z-10 invisible bg-background border border-border rounded-md px-3 py-2 text-sm')
      .style('pointer-events', 'none');

    node.on('mouseover', (event, d) => {
      tooltip.text(d.content).style('visibility', 'visible');
      d3.select(event.currentTarget).transition().duration(200).attr('r', 15);
    })
    .on('mousemove', (event) => {
      tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', (event, d) => {
      tooltip.style('visibility', 'hidden');
      d3.select(event.currentTarget).transition().duration(200).attr('r', Math.max(4, Math.min(12, d.connections.length * 2 + 4)));
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as unknown as Node).x!)
        .attr('y1', d => (d.source as unknown as Node).y!)
        .attr('x2', d => (d.target as unknown as Node).x!)
        .attr('y2', d => (d.target as unknown as Node).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        svg.selectAll('g').attr('transform', event.transform);
      });

    svg.call(zoom);
    
    return () => {
      tooltip.remove();
    };

  }, [thoughts]);

  function drag(simulation: d3.Simulation<Node, undefined>) {
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag<SVGCircleElement, Node>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return svgRef;
}
