import { GitCompare, Calendar, User, Hash, GitBranch, Sparkles } from "lucide-react";
import type { Commit } from "./CommitNode";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CommitComparisonProps {
  firstCommit: Commit | null;
  secondCommit: Commit | null;
  onClear: () => void;
  onCompareWithAI: () => void;
}

export const CommitComparison = ({ firstCommit, secondCommit, onClear, onCompareWithAI }: CommitComparisonProps) => {
  if (!firstCommit && !secondCommit) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 shadow-node text-center">
        <GitCompare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Select Two Commits</h3>
        <p className="text-muted-foreground">
          Click on any two commits in the tree to compare them
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-node overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Commit Comparison</h3>
          </div>
          {(firstCommit || secondCommit) && (
            <button
              onClick={onClear}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 divide-x divide-border">
        {/* First commit */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">First Commit</span>
          </div>

          {firstCommit ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Commit ID</div>
                  <div className="font-mono font-semibold text-purple-500">{firstCommit.hash}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GitBranch className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Message</div>
                  <div className="text-sm text-foreground">{firstCommit.message}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Author</div>
                  <div className="text-sm text-foreground">{firstCommit.author}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Date</div>
                  <div className="text-sm text-foreground">{firstCommit.date}</div>
                </div>
              </div>

              {firstCommit.branch && (
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-purple-500/20 text-purple-500 text-xs font-mono font-semibold">
                    <GitBranch className="w-3 h-3" />
                    {firstCommit.branch}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No commit selected
            </div>
          )}
        </div>

        {/* Second commit */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Second Commit</span>
          </div>

          {secondCommit ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Commit ID</div>
                  <div className="font-mono font-semibold text-pink-500">{secondCommit.hash}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GitBranch className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Message</div>
                  <div className="text-sm text-foreground">{secondCommit.message}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Author</div>
                  <div className="text-sm text-foreground">{secondCommit.author}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Date</div>
                  <div className="text-sm text-foreground">{secondCommit.date}</div>
                </div>
              </div>

              {secondCommit.branch && (
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-pink-500/20 text-pink-500 text-xs font-mono font-semibold">
                    <GitBranch className="w-3 h-3" />
                    {secondCommit.branch}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No commit selected
            </div>
          )}
        </div>
      </div>

      {/* Comparison summary */}
      {firstCommit && secondCommit && (
        <div className="border-t border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Time difference:</span>
              <span className="font-semibold text-foreground">
                {Math.abs(
                  new Date(secondCommit.date).getTime() - new Date(firstCommit.date).getTime()
                ) / (1000 * 60 * 60 * 24)} days
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Same author:</span>
              <span className="font-semibold text-foreground">
                {firstCommit.author === secondCommit.author ? "Yes" : "No"}
              </span>
            </div>
          </div>
          <Button
            onClick={onCompareWithAI}
            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Compare with AI
          </Button>
        </div>
      )}
    </div>
  );
};
