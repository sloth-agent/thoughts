import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
      <Input
        type="text"
        placeholder="Search thoughts..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        data-testid="input-search"
      />
    </div>
  );
}
