import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface CommitInputProps {
  onCommitWithAI: () => void;
}

export const CommitInput = ({ onCommitWithAI }: CommitInputProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-node">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Commit with AI</h2>
          <p className="text-sm text-muted-foreground">
            Let AI analyze your changes and create a commit
          </p>
        </div>
        <Button
          onClick={onCommitWithAI}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-glow"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Commit with AI
        </Button>
      </div>
    </div>
  );
};
