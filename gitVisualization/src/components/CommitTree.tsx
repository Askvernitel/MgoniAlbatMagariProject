import { CommitNode, type Commit } from "./CommitNode";
import { useState, useRef, useEffect } from "react";

interface CommitTreeProps {
  commits: Commit[];
  firstSelected: Commit | null;
  secondSelected: Commit | null;
  onSelectCommit: (commit: Commit) => void;
  onMergeCommits?: (commits: Commit[]) => void;
}

interface TreeNode {
  commit: Commit;
  children: TreeNode[];
  x: number;
  y: number;
  mod: number;
}

export const CommitTree = ({
  commits,
  firstSelected,
  secondSelected,
  onSelectCommit,
  onMergeCommits,
}: CommitTreeProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [draggedNodeStart, setDraggedNodeStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tempDragPosition, setTempDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
  const [mergeMessage, setMergeMessage] = useState<string | null>(null);

  const NODE_RADIUS = 18;

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

  const getSVGPoint = (e: React.MouseEvent, svg: SVGSVGElement) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()?.inverse());
  };

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;

    // Get mouse position in SVG coordinates, accounting for pan/zoom
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    setDraggedNodeId(nodeId);
    const currentPos = nodePositions[nodeId] || positions.get(nodeId);
    if (currentPos) {
      setDraggedNodeStart({
        x: svgPoint.x - currentPos.x,
        y: svgPoint.y - currentPos.y,
      });
    }
  };

  function getNodeAtPosition(x: number, y: number, excludeId?: string) {
    for (const commit of commits) {
      if (commit.id === excludeId) continue;
      const pos = nodePositions[commit.id] || positions.get(commit.id);
      if (!pos) continue;
      const dx = pos.x - x;
      const dy = pos.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS * 2) {
        return commit.id;
      }
    }
    return null;
  }

  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!draggedNodeId || !draggedNodeStart) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const newX = svgPoint.x - draggedNodeStart.x;
    const newY = svgPoint.y - draggedNodeStart.y;
    setTempDragPosition({ x: newX, y: newY });
    // Check for merge target
    const targetId = getNodeAtPosition(newX, newY, draggedNodeId);
    setMergeTargetId(targetId);
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

  const positions = calculatePositions();

  // Draw connecting lines with curves
  const renderConnections = () => {
    return commits.flatMap((commit) => {
      if (commit.parents.length === 0) return [];

      const defaultChildPos = positions.get(commit.id);
      const customChildPos = nodePositions[commit.id];
      // Use temp drag position if this node is being dragged
      const childPos =
        draggedNodeId === commit.id && tempDragPosition
          ? tempDragPosition
          : customChildPos || defaultChildPos;
      if (!childPos) return [];

      return commit.parents.map((parentId) => {
        const defaultParentPos = positions.get(parentId);
        const customParentPos = nodePositions[parentId];
        // Use temp drag position if parent node is being dragged
        const parentPos =
          draggedNodeId === parentId && tempDragPosition
            ? tempDragPosition
            : customParentPos || defaultParentPos;
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
  const maxX =
    Math.max(...Array.from(positions.values()).map((p) => p.x)) + 200;
  const maxY =
    Math.max(...Array.from(positions.values()).map((p) => p.y)) + 100;

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 3);
    setZoom(newZoom);
  };

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggedNodeId) return; // Don't pan when dragging a node
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      handleNodeDrag(e);
      return;
    }
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  // Handle pan end
  const handleMouseUp = () => {
    // If merge target exists, create a new merge commit node
    if (draggedNodeId && mergeTargetId) {
      // Find dragged and target commits
      const draggedCommit = commits.find((c) => c.id === draggedNodeId);
      const targetCommit = commits.find((c) => c.id === mergeTargetId);
      if (draggedCommit && targetCommit) {
        // Generate a unique id/hash for the new merge commit
        const newId = `M${Date.now()}`;
        const newHash = `M${Math.random().toString(36).slice(2, 8)}`;
        // Use color of target, or fallback
        const color = targetCommit.color || "cyan";
        // Create new merge commit node
        const mergeCommit = {
          id: newId,
          hash: newHash,
          message: `Merge commit (${draggedCommit.hash}, ${targetCommit.hash})`,
          author: "Merge Bot",
          date: new Date().toISOString().slice(0, 10),
          parents: [draggedCommit.id, targetCommit.id],
          color,
        };
        // Add new node to commits
        const updatedCommits = [...commits, mergeCommit];
        setNodePositions((prev) => ({
          ...prev,
          [draggedNodeId]: tempDragPosition || prev[draggedNodeId],
        }));
        setMergeTargetId(null);
        setDraggedNodeId(null);
        setDraggedNodeStart(null);
        setTempDragPosition(null);
        if (typeof onMergeCommits === "function") {
          onMergeCommits(updatedCommits);
        }
        setMergeMessage(`Merged! New commit ${mergeCommit.hash}`);
        setTimeout(() => setMergeMessage(null), 1600);
        return;
      }
    }
    // Normal drag end
    if (draggedNodeId && tempDragPosition) {
      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: tempDragPosition,
      }));
    }
    setIsPanning(false);
    setDraggedNodeId(null);
    setDraggedNodeStart(null);
    setTempDragPosition(null);
    setMergeTargetId(null);
  };

  return (
    <div
      className="relative w-full h-full min-h-[600px] overflow-hidden bg-blue-500 rounded-lg cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full min-h-[600px]"
        viewBox={`0 0 ${maxX} ${maxY}`}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Connection lines */}
          {renderConnections()}

          {/* Commit nodes */}
          {commits.map((commit) => {
            const defaultPos = positions.get(commit.id);
            const customPos = nodePositions[commit.id];
            const isDragging = draggedNodeId === commit.id;
            const pos =
              isDragging && tempDragPosition
                ? tempDragPosition
                : customPos || defaultPos;
            if (!pos) return null;
            let selectionState: "none" | "first" | "second" = "none";
            if (firstSelected?.id === commit.id) selectionState = "first";
            else if (secondSelected?.id === commit.id)
              selectionState = "second";
            // Highlight merge target
            const isMergeTarget =
              mergeTargetId === commit.id && !!draggedNodeId;
            return (
              <g
                key={commit.id}
                onMouseDown={(e) => handleNodeDragStart(e, commit.id)}
              >
                <CommitNode
                  commit={commit}
                  selectionState={selectionState}
                  onSelect={onSelectCommit}
                  position={pos}
                  highlight={isMergeTarget}
                  tooltip={
                    isMergeTarget && draggedNodeId
                      ? "Drop here to merge"
                      : undefined
                  }
                />
              </g>
            );
          })}
        </g>
      </svg>
      {mergeMessage && (
        <div className="absolute left-1/2 top-8 -translate-x-1/2 bg-yellow-300 text-yellow-900 font-bold px-6 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {mergeMessage}
        </div>
      )}
    </div>
  );
};
