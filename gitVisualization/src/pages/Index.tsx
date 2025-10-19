import { useEffect, useState, useRef } from "react";
import { CommitTree } from "@/components/CommitTree";
import { CommitInput } from "@/components/CommitInput";
import { CommitComparison } from "@/components/CommitComparison";
import { DirectoryInput } from "@/components/DirectoryInput";
import { AIAnalysis } from "@/components/AIAnalysis";
import type { Commit } from "@/components/CommitNode";
import { GitCompare, Plus, BarChart3, Brain, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CommitTreeResponse {
  roots: Commit[];
  all: Commit[];
  tips: Commit[];
}
const Index = () => {
  const [commits, setCommits] = useState<Commit[]>([
    {
      id: "1",
      hash: "C0",
      message: "Initial commit",
      author: "Dev Team",
      date: "2024-01-15",
      parents: [],
      color: "cyan",
    },
    {
      id: "2",
      hash: "C1",
      message: "Add authentication",
      author: "Jane Smith",
      date: "2024-01-16",
      parents: ["1"],
      color: "cyan",
    },
    {
      id: "3",
      hash: "C2",
      message: "Fix bug",
      author: "John Doe",
      date: "2024-01-17",
      parents: ["2"],
      color: "gray",
      branch: "bugFix",
    },
    {
      id: "4",
      hash: "C3",
      message: "Another fix",
      author: "John Doe",
      date: "2024-01-18",
      parents: ["3"],
      color: "gray",
    },
    {
      id: "5",
      hash: "C4",
      message: "UI improvements",
      author: "Jane Smith",
      date: "2024-01-17",
      parents: ["2"],
      color: "cyan",
    },
    {
      id: "6",
      hash: "C5",
      message: "Add sidebar",
      author: "Jane Smith",
      date: "2024-01-18",
      parents: ["5"],
      color: "cyan",
      branch: "side",
    },
    {
      id: "7",
      hash: "C6",
      message: "New feature",
      author: "Alice",
      date: "2024-01-17",
      parents: ["2"],
      color: "orange",
    },
    {
      id: "8",
      hash: "C7",
      message: "Refactor code",
      author: "Alice",
      date: "2024-01-18",
      parents: ["7"],
      color: "orange",
      branch: "another",
    },
    {
      id: "9",
      hash: "C8",
      message: "Merge branches",
      author: "Dev Team",
      date: "2024-01-19",
      parents: ["2"],
      color: "green",
      branch: "main",
    },
  ]);
  useEffect(() => {
    const fetchTree = async () => {
      const response = await fetch("http://localhost:3000/commit/tree");
      const tree = (await response.json()) as Commit[];
      tree.forEach((commit) => {
        console.log(commit);
      });
      setCommits(tree);
    };
    fetchTree();
  }, []);
  const [firstSelected, setFirstSelected] = useState<Commit | null>(null);
  const [secondSelected, setSecondSelected] = useState<Commit | null>(null);

  const [showComparison, setShowComparison] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [compareResult, setCompareResult] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [aiAnalysisResult, setAIAnalysisResult] = useState<any>(null);
  const compareResultRef = useRef<HTMLDivElement | null>(null);

  const handleCommitWithAI = () => {
    toast.info("AI Commit", {
      description: "Connecting to backend for AI commit generation...",
    });
  };

  const handleCompareWithAI = () => {
    const compare = async () => {
      setCompareLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/ai/compare?hash1=${firstSelected.id}&hash2=${secondSelected.id}`
        );
        const data = await response.json();
        setCompareResult(data);
      } catch (error) {
        setCompareResult({ error: "Failed to fetch AI comparison." });
      } finally {
        setCompareLoading(false);
      }
    };
    compare();
    toast.info("AI Comparison", {
      description: "Connecting to backend for AI comparison...",
    });
  };

  const handleAIAnalysis = () => {
    toast.info("AI Analysis", {
      description: "Mock AI analysis returned.",
    });
    setAIAnalysisResult({
      summary: "This is a mock AI analysis summary.",
      details:
        "Mock details: The repository is well-structured, with clear separation of concerns and good commit hygiene. No major issues detected.",
      score: 92,
      suggestions: [
        "Consider adding more unit tests.",
        "Document API endpoints for easier onboarding.",
        "Review dependency updates for security patches.",
      ],
    });
  };

  const handleMagic = () => {
    toast.success("Magic Mode Activated! ✨", {
      description: "AI is taking over to optimize everything...",
    });
  };

  const handleSelectCommit = (commit: Commit) => {
    // If clicking the same commit that's already first selected, deselect it
    if (firstSelected?.id === commit.id) {
      setFirstSelected(null);
      toast.info("Deselected commit A");
      return;
    }

    // If clicking the same commit that's already second selected, deselect it
    if (secondSelected?.id === commit.id) {
      setSecondSelected(null);
      toast.info("Deselected commit B");
      return;
    }

    // If no first selection, set as first
    if (!firstSelected) {
      setFirstSelected(commit);
      toast.success("Selected as Commit A", {
        description: `${commit.hash} - ${commit.message}`,
      });
      return;
    }

    // If first is selected but no second, set as second
    if (!secondSelected) {
      setSecondSelected(commit);
      toast.success("Selected as Commit B", {
        description: `${commit.hash} - ${commit.message}`,
      });
      return;
    }

    // If both are selected, replace the second one
    setSecondSelected(commit);
    toast.info("Replaced Commit B", {
      description: `${commit.hash} - ${commit.message}`,
    });
  };

  const handleClearSelection = () => {
    setFirstSelected(null);
    setSecondSelected(null);
    setCompareResult(null);
    toast.info("Selection cleared");
  };

  const handleDirectoryChange = async (directory: string) => {
    try {
      // Send directory to backend
      const response = await fetch("http://localhost:3000/repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: directory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      // Now fetch the new commit tree for the selected directory
      const treeResponse = await fetch("http://localhost:3000/commit/tree");
      if (!treeResponse.ok) {
        throw new Error(`Failed to fetch commit tree: ${treeResponse.status}`);
      }
      const tree = (await treeResponse.json()) as Commit[];
      setCommits(tree);
      setFirstSelected(null);
      setSecondSelected(null);
    } catch (error) {
      console.error("Error sending directory or fetching commits:", error);
      toast.error("Failed to load commits for the selected directory");
    }
  };

  useEffect(() => {
    if (!showComparison) {
      setCompareResult(null);
    }
  }, [showComparison]);

  useEffect(() => {
    if (compareResult && compareResultRef.current) {
      compareResultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [compareResult]);

  const branchColors: Record<string, "cyan" | "gray" | "orange" | "green"> = {
    main: "green",
    bugFix: "gray",
    side: "cyan",
    another: "orange",
  };
  const defaultColor = "cyan" as const;

  function assignBranchColors(commits: Commit[]): Commit[] {
    return commits.map((commit) => {
      if (commit.branch && branchColors[commit.branch]) {
        return { ...commit, color: branchColors[commit.branch] };
      }
      // If no branch or unknown branch, assign default color
      return { ...commit, color: defaultColor };
    });
  }

  const authorColors: ("cyan" | "gray" | "orange" | "green")[] = [
    "cyan",
    "gray",
    "orange",
    "green",
  ];
  function getAuthorColor(
    author: string,
    authorMap: Record<string, "cyan" | "gray" | "orange" | "green">,
    colorList: ("cyan" | "gray" | "orange" | "green")[]
  ) {
    if (authorMap[author]) return authorMap[author];
    const color = colorList[Object.keys(authorMap).length % colorList.length];
    authorMap[author] = color;
    return color;
  }
  function assignAuthorColors(commits: Commit[]): Commit[] {
    const authorMap: Record<string, "cyan" | "gray" | "orange" | "green"> = {};
    return commits.map((commit) => ({
      ...commit,
      color: getAuthorColor(commit.author, authorMap, authorColors),
    }));
  }

  // Log commit data in a useEffect to ensure it prints when commits change.
  useEffect(() => {
    console.log("Commits for color assignment:", commits);
  }, [commits]);

  // Add your directory loading logic here

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Directory Input - Top Left */}
      <div className="absolute top-4 left-4 z-20 max-w-md">
        <DirectoryInput onDirectoryChange={handleDirectoryChange} />
      </div>

      {/* Control Buttons - Floating Top Right */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button
          onClick={handleMagic}
          className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white shadow-lg"
        >
          <Wand2 className="w-5 h-5 mr-2" />
          Magic
        </Button>
        <Button
          variant={showComparison ? "default" : "outline"}
          size="icon"
          onClick={() => setShowComparison(!showComparison)}
          className="w-12 h-12 shadow-node"
          title="Compare Commits"
        >
          <GitCompare className="w-5 h-5" />
        </Button>
        <Button
          variant={showInput ? "default" : "outline"}
          size="icon"
          onClick={() => setShowInput(!showInput)}
          className="w-12 h-12 shadow-node"
          title="Commit with AI"
        >
          <Plus className="w-5 h-5" />
        </Button>
        <Button
          variant={showAIAnalysis ? "default" : "outline"}
          size="icon"
          onClick={() => setShowAIAnalysis(!showAIAnalysis)}
          className="w-12 h-12 shadow-node"
          title="AI Analysis"
        >
          <Brain className="w-5 h-5" />
        </Button>
        <Button
          variant={showStats ? "default" : "outline"}
          size="icon"
          onClick={() => setShowStats(!showStats)}
          className="w-12 h-12 shadow-node"
          title="Statistics"
        >
          <BarChart3 className="w-5 h-5" />
        </Button>
      </div>

      {/* Comparison Widget - Floating */}
      {showComparison && (firstSelected || secondSelected) && (
        <div className="fixed top-20 right-4 z-20 w-full max-w-md animate-fade-in">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-node w-full max-h-[70vh] overflow-y-auto">
            <CommitComparison
              firstCommit={firstSelected}
              secondCommit={secondSelected}
              onClear={handleClearSelection}
              onCompareWithAI={handleCompareWithAI}
            />
            {compareLoading && (
              <div className="flex items-center justify-center mt-4 mb-2">
                <svg
                  className="animate-spin h-5 w-5 text-blue-500 mr-2"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span className="text-sm text-muted-foreground">
                  Loading AI comparison...
                </span>
              </div>
            )}
            {compareResult && !compareLoading && (
              <div
                ref={compareResultRef}
                className="mt-4 bg-background rounded-lg shadow border border-border p-3 max-h-[40vh] overflow-y-auto"
              >
                <h3 className="text-base font-bold mb-2 text-foreground">
                  AI Comparison Summary
                </h3>
                {compareResult.error ? (
                  <div className="text-red-500">{compareResult.error}</div>
                ) : (
                  <>
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-foreground mb-1">
                        Overall Analysis
                      </div>
                      <div className="text-muted-foreground whitespace-pre-line leading-relaxed bg-card rounded p-2 border border-border text-sm">
                        {compareResult.overallAnalysis}
                      </div>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600 hover:underline mb-1">
                        Show full AI response details
                      </summary>
                      <pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground bg-card rounded p-2 border border-border mt-1 max-h-[20vh] overflow-y-auto">
                        {JSON.stringify(compareResult, null, 2)}
                      </pre>
                    </details>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Widget - Floating Bottom Right */}
      {showInput && (
        <div className="absolute bottom-4 right-4 z-20 w-96 animate-fade-in">
          <CommitInput onCommitWithAI={handleCommitWithAI} />
        </div>
      )}

      {/* AI Analysis Widget - Floating Top Left */}
      {showAIAnalysis && (
        <div className="absolute top-4 left-4 z-20 w-80 animate-fade-in">
          <AIAnalysis onAnalyze={handleAIAnalysis} />
          {aiAnalysisResult && (
            <div className="mt-4 bg-background rounded-lg shadow border border-border p-3">
              <h3 className="text-base font-bold mb-2 text-foreground">
                AI Analysis Result
              </h3>
              <div className="text-muted-foreground whitespace-pre-line leading-relaxed bg-card rounded p-2 border border-border text-sm mb-2">
                <strong>Summary:</strong> {aiAnalysisResult.summary}
              </div>
              <div className="text-muted-foreground whitespace-pre-line leading-relaxed bg-card rounded p-2 border border-border text-sm mb-2">
                <strong>Details:</strong> {aiAnalysisResult.details}
              </div>
              <div className="text-muted-foreground mb-2">
                <strong>Score:</strong> {aiAnalysisResult.score}/100
              </div>
              <div className="text-muted-foreground mb-2">
                <strong>Suggestions:</strong>
                <ul className="list-disc ml-5">
                  {aiAnalysisResult.suggestions.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Widget - Floating Bottom Left */}
      {showStats && (
        <div className="absolute bottom-4 left-4 z-20 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-node animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Statistics
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Total Commits</span>
              <span className="font-semibold text-primary">
                {commits.length}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Commit A</span>
              <span className="font-semibold text-purple-500">
                {firstSelected ? firstSelected.hash : "None"}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Commit B</span>
              <span className="font-semibold text-pink-500">
                {secondSelected ? secondSelected.hash : "None"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tree visualization - Fullscreen */}
      <div className="absolute inset-0">
        <CommitTree
          commits={assignAuthorColors(commits)}
          firstSelected={firstSelected}
          secondSelected={secondSelected}
          onSelectCommit={handleSelectCommit}
        />
      </div>
    </div>
  );
};

export default Index;
