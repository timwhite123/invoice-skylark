import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TagManagerProps {
  invoiceId: number;
  currentTags: string[];
  onTagsUpdate: (tags: string[]) => void;
}

const TAG_COLORS = [
  "bg-red-100 text-red-800",
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-purple-100 text-purple-800",
];

export const TagManager = ({ invoiceId, currentTags, onTagsUpdate }: TagManagerProps) => {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const { toast } = useToast();

  const handleAddTag = () => {
    if (tags.length >= 2) {
      toast({
        title: "Tag limit reached",
        description: "Maximum of 2 tags per invoice",
        variant: "destructive",
      });
      return;
    }

    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      onTagsUpdate(updatedTags);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    onTagsUpdate(updatedTags);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tag className="h-4 w-4" />
          Manage Tags
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Tags for Invoice {invoiceId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className={`${selectedColor} cursor-pointer`}
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add new tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              maxLength={20}
            />
            <Button onClick={handleAddTag}>Add</Button>
          </div>
          <div className="flex gap-2">
            {TAG_COLORS.map((color) => (
              <div
                key={color}
                className={`w-6 h-6 rounded cursor-pointer ${color} ${
                  selectedColor === color ? "ring-2 ring-offset-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};