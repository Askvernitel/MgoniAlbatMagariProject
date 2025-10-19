import { useEffect, useState } from "react";
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

  const handleCommitWithAI = () => {
    toast.info("AI Commit", {
      description: "Connecting to backend for AI commit generation...",
    });
  };

  const handleCompareWithAI = () => {
    const compare = async () => {
      console.log("START");
      const response = await fetch(
        `http://localhost:3000/ai/compare?hash1=${firstSelected.id}&hash2=${secondSelected.id}`
      );
      let data = await response.json();
      console.log("JSON RESP:", JSON.stringify(data));
    };
    compare();
    //let comp = await fetch(`ai/compare?${firstSelected.hash}&${secondSelected.hash}`);

    toast.info("AI Comparison", {
      description: "Connecting to backend for AI comparison...",
    });
  };

  const handleAIAnalysis = () => {
    toast.info("AI Analysis", {
      description: "Connecting to backend for AI analysis...",
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
    toast.info("Selection cleared");
  };

  const handleDirectoryChange = async (directory: string) => {
    try {
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

      const data = await response.json();
      console.log("Server response:", data);
    } catch (error) {
      console.error("Error sending directory:", error);
    }
  };

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
        <div className="absolute top-20 right-4 z-20 max-w-2xl animate-fade-in">
          <CommitComparison
            firstCommit={firstSelected}
            secondCommit={secondSelected}
            onClear={handleClearSelection}
            onCompareWithAI={handleCompareWithAI}
          />
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
          commits={commits}
          firstSelected={firstSelected}
          secondSelected={secondSelected}
          onSelectCommit={handleSelectCommit}
        />
      </div>
    </div>
  );
};

export default Index;
