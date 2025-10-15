import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Shuffle } from 'lucide-react';

interface KeyboardSelectorProps {
  keyboards: Array<{ pid: string; name: string }>;
  onSelect: (pid: string) => void;
  currentPid?: string;
  showRandom?: boolean;
}

export function KeyboardSelector({ keyboards, onSelect, currentPid, showRandom = true }: KeyboardSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleRandomSelect = () => {
    if (keyboards.length === 0) return;
    const randomIndex = Math.floor(Math.random() * keyboards.length);
    const randomKeyboard = keyboards[randomIndex];
    onSelect(randomKeyboard.pid);
  };

  // Filter keyboards
  const filteredKeyboards = searchQuery
    ? keyboards.filter(kb =>
        kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kb.pid.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : keyboards;

  return (
    <div className="space-y-3">
      {/* Random Device Button */}
      {showRandom && (
        <>
          <div className="flex justify-center">
            <Button
              onClick={handleRandomSelect}
              variant="default"
              size="lg"
              className="gap-2"
            >
              <Shuffle className="w-5 h-5" />
              Pick Random Keyboard
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-muted-foreground">or choose manually</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
        </>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-accent" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search keyboards..."
          className="pl-10 w-full"
        />
      </div>

      {/* Keyboard list */}
      {filteredKeyboards.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
          <ul className="divide-y divide-border">
            {filteredKeyboards.map(kb => (
              <li key={kb.pid}>
                <button
                  onClick={() => onSelect(kb.pid)}
                  disabled={kb.pid === currentPid}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center justify-between cursor-pointer text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm">
                    <span className="font-mono text-muted-foreground">{kb.pid.toUpperCase()}</span> - {kb.name}
                  </span>
                  {kb.pid === currentPid ? (
                    <span className="text-xs text-primary">Current</span>
                  ) : (
                    <span className="text-xs text-primary">Select</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">No keyboards found matching "{searchQuery}"</p>
      )}
    </div>
  );
}
