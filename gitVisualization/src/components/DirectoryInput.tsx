import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface DirectoryInputProps {
  onDirectoryChange?: (directory: string) => void;
}

export const DirectoryInput = ({ onDirectoryChange }: DirectoryInputProps) => {
  const [directory, setDirectory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (directory.trim()) {
      onDirectoryChange?.(directory);
      toast.success("Directory set", {
        description: directory,
      });
    }
  };

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-node">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter directory path..."
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" size="sm">
          Load
        </Button>
      </form>
    </div>
  );
};
