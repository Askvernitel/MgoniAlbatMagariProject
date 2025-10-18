import { Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIAnalysisProps {
  onAnalyze: () => void;
}

export const AIAnalysis = ({ onAnalyze }: AIAnalysisProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-node">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Get intelligent insights about your commit tree, patterns, and suggestions for improvements.
        </p>
        
        <Button
          onClick={onAnalyze}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze with AI
        </Button>
        
        <div className="pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-2">
            <p>AI will analyze:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Commit patterns and frequency</li>
              <li>Branch structure optimization</li>
              <li>Merge conflict predictions</li>
              <li>Code quality insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
