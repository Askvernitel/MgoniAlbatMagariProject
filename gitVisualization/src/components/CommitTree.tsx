import { CommitNode, type Commit } from "./CommitNode";
import { useState, useRef, useEffect } from "react";

interface CommitTreeProps {
  commits: Commit[];
  firstSelected: Commit | null;
  secondSelected: Commit | null;
  onSelectCommit: (commit: Commit) => void;
}

interface TreeNode {
  commit: Commit;
  children: TreeNode[];
  x: number;
  y: number;
  mod: number;
}

export const CommitTree = ({ commits, firstSelected, secondSelected, onSelectCommit }: CommitTreeProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Build tree structure
  const buildTree = (): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Create nodes
    commits.forEach((commit) => {
      nodeMap.set(commit.id, {
        commit,
        children: [],
        x: 0,
        y: 0,
        mod: 0,
      });
    });

    // Build parent-child relationships
    commits.forEach((commit) => {
      const node = nodeMap.get(commit.id)!;
      if (commit.parents.length === 0) {
        roots.push(node);
      } else {
        commit.parents.forEach((parentId) => {
          const parent = nodeMap.get(parentId);
          if (parent) {
            parent.children.push(node);
          }
        });
      }
    });

    return roots;
  };

  // Calculate positions using tree layout algorithm
  const calculatePositions = () => {
    const roots = buildTree();
    const horizontalSpacing = 120;
    const verticalSpacing = 100;
    const positions = new Map<string, { x: number; y: number }>();

    const assignPositions = (
      node: TreeNode,
      depth: number,
      leftBound: number
    ): number => {
      node.y = depth * verticalSpacing + 80;

      if (node.children.length === 0) {
        node.x = leftBound;
        positions.set(node.commit.id, { x: node.x, y: node.y });
        return leftBound + horizontalSpacing;
      }

      let currentX = leftBound;
      node.children.forEach((child) => {
        currentX = assignPositions(child, depth + 1, currentX);
      });

      // Center parent over children
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;

      positions.set(node.commit.id, { x: node.x, y: node.y });
      return currentX;
    };

    let currentX = 100;
    roots.forEach((root) => {
      currentX = assignPositions(root, 0, currentX);
    });

    return positions;
  };

  const calculatedPositions = calculatePositions();
  
  // Merge calculated positions with custom node positions
  const positions = new Map(calculatedPositions);
  nodePositions.forEach((pos, id) => {
    positions.set(id, pos);
  });

  // Apply drag offset to the currently dragging node
  const getNodePosition = (commitId: string) => {
    const pos = positions.get(commitId);
    if (!pos) return null;
    
    if (draggingNode === commitId) {
      return {
        x: pos.x + nodeDragOffset.x,
        y: pos.y + nodeDragOffset.y,
      };
    }
    return pos;
  };

  // Draw connecting lines with curves
  const renderConnections = () => {
    return commits.flatMap((commit) => {
      if (commit.parents.length === 0) return [];

      const childPos = getNodePosition(commit.id);
      if (!childPos) return [];

      return commit.parents.map((parentId) => {
        const parentPos = getNodePosition(parentId);
        if (!parentPos) return null;

        const midY = (childPos.y + parentPos.y) / 2;

        return (
          <path
            key={`${commit.id}-${parentId}`}
            d={`M ${childPos.x} ${childPos.y} 
                C ${childPos.x} ${midY}, 
                  ${parentPos.x} ${midY}, 
                  ${parentPos.x} ${parentPos.y}`}
            className="stroke-gray-800 fill-none"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      });
    });
  };

  // Calculate SVG dimensions
  const maxX = Math.max(...Array.from(positions.values()).map((p) => p.x)) + 200;
  const maxY = Math.max(...Array.from(positions.values()).map((p) => p.y)) + 100;

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 3);
    setZoom(newZoom);
  };

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  // Handle pan end
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Commit the drag offset to permanent position
    if (draggingNode) {
      const pos = positions.get(draggingNode);
      if (pos) {
        const finalPos = {
          x: pos.x + nodeDragOffset.x,
          y: pos.y + nodeDragOffset.y,
        };
        setNodePositions(prev => new Map(prev).set(draggingNode, finalPos));
      }
      setDraggingNode(null);
      setNodeDragOffset({ x: 0, y: 0 });
    }
  };

  // Handle node drag start
  const handleNodeDragStart = (e: React.MouseEvent, commitId: string) => {
    e.stopPropagation();
    setDraggingNode(commitId);
    setNodeDragOffset({ x: 0, y: 0 });
  };

  // Handle node drag
  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!draggingNode) return;
    e.stopPropagation();
    
    const svgPoint = getSVGPoint(e);
    const originalPos = positions.get(draggingNode);
    if (!originalPos) return;
    
    setNodeDragOffset({
      x: svgPoint.x - originalPos.x,
      y: svgPoint.y - originalPos.y,
    });
  };

  // Convert screen coordinates to SVG coordinates
  const getSVGPoint = (e: React.MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    // Account for current transform
    return {
      x: (svgP.x - pan.x) / zoom,
      y: (svgP.y - pan.y) / zoom,
    };
  };

  return (
    <div 
      className="relative w-full h-full min-h-[600px] overflow-hidden bg-blue-500 rounded-lg cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleNodeDrag(e);
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg 
        ref={svgRef}
        className="w-full h-full min-h-[600px]" 
        viewBox={`0 0 ${maxX} ${maxY}`}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Connection lines */}
        {renderConnections()}

          {/* Commit nodes */}
          {commits.map((commit) => {
            const pos = getNodePosition(commit.id);
            if (!pos) return null;

            let selectionState: "none" | "first" | "second" = "none";
            if (firstSelected?.id === commit.id) selectionState = "first";
            else if (secondSelected?.id === commit.id) selectionState = "second";

            return (
              <CommitNode
                key={commit.id}
                commit={commit}
                selectionState={selectionState}
                onSelect={onSelectCommit}
                position={pos}
                onDragStart={(e) => handleNodeDragStart(e, commit.id)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
