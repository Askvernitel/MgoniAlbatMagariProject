import { cn } from "@/lib/utils";

export interface Commit {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
  branch?: string;
  color?: "cyan" | "gray" | "orange" | "green";
}

interface CommitNodeProps {
  commit: Commit;
  selectionState: "none" | "first" | "second";
  onSelect: (commit: Commit) => void;
  position: { x: number; y: number };
  onDragStart?: (e: React.MouseEvent) => void;
}

const colorClasses = {
  cyan: "fill-cyan-400",
  gray: "fill-gray-400", 
  orange: "fill-orange-400",
  green: "fill-emerald-400",
};

const strokeColorClasses = {
  cyan: "stroke-gray-800",
  gray: "stroke-gray-800",
  orange: "stroke-gray-800",
  green: "stroke-gray-800",
};

export const CommitNode = ({ commit, selectionState, onSelect, position, onDragStart }: CommitNodeProps) => {
  const colorClass = colorClasses[commit.color || "cyan"];
  const strokeClass = strokeColorClasses[commit.color || "cyan"];

  return (
    <g 
      onClick={() => onSelect(commit)} 
      onMouseDown={onDragStart}
      className="cursor-move hover:cursor-grab active:cursor-grabbing"
    >
      {/* Selection badge */}
      {selectionState !== "none" && (
        <g>
          <circle
            cx={position.x + 18}
            cy={position.y - 18}
            r="12"
            className={cn(
              selectionState === "first" && "fill-purple-500 stroke-gray-800 stroke-2",
              selectionState === "second" && "fill-pink-500 stroke-gray-800 stroke-2"
            )}
          />
          <text
            x={position.x + 18}
            y={position.y - 18}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white text-[11px] font-bold pointer-events-none"
          >
            {selectionState === "first" ? "A" : "B"}
          </text>
        </g>
      )}

      {/* Branch label */}
      {commit.branch && (
        <g>
          <rect
            x={position.x + 28}
            y={position.y - 14}
            width={commit.branch.length * 8 + 12}
            height={20}
            rx="6"
            className={cn(
              commit.color === "cyan" && "fill-blue-500",
              commit.color === "orange" && "fill-orange-500",
              commit.color === "green" && "fill-emerald-500",
              commit.color === "gray" && "fill-gray-600",
              "stroke-gray-800 stroke-[1.5]"
            )}
          />
          <text
            x={position.x + 34}
            y={position.y - 4}
            className="fill-white text-[11px] font-mono font-semibold"
          >
            {commit.branch}
          </text>
        </g>
      )}
      
      {/* Node circle */}
      <circle
        cx={position.x}
        cy={position.y}
        r={selectionState !== "none" ? 18 : 16}
        className={cn(
          colorClass,
          strokeClass,
          "stroke-[2.5]",
          selectionState === "first" && "stroke-purple-500 stroke-[3.5]",
          selectionState === "second" && "stroke-pink-500 stroke-[3.5]"
        )}
      />

      {/* Commit ID text */}
      <text
        x={position.x}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[13px] font-mono font-bold pointer-events-none select-none fill-gray-900"
      >
        {commit.hash}
      </text>

      {/* Hover info tooltip */}
      <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <rect
          x={position.x + 25}
          y={position.y - 38}
          width={180}
          height={56}
          rx="8"
          className="fill-white stroke-gray-800 stroke-2"
        />
        <text
          x={position.x + 35}
          y={position.y - 22}
          className="fill-gray-900 text-xs font-semibold"
        >
          {commit.message}
        </text>
        <text
          x={position.x + 35}
          y={position.y - 8}
          className="fill-gray-600 text-[10px]"
        >
          {commit.author}
        </text>
      </g>
    </g>
  );
};
