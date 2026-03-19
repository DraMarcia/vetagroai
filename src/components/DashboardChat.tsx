import { useState } from "react";
import { Send, Upload, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import { Badge } from "@/components/ui/badge";

export function DashboardChat() {
  const { profileData } = useProfile();
  const [inputValue, setInputValue] = useState("");

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const groupedActions = profileData.actions.reduce<Record<string, string[]>>((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action.label);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        {/* Greeting */}
        <div className="max-w-2xl w-full text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <Badge variant="secondary" className="text-xs font-medium">
              {profileData.chipLabel}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            {profileData.greeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            {profileData.subtitle}
          </p>
        </div>

        {/* Action Cards - max 6 */}
        <div className="max-w-2xl w-full mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {profileData.actions.slice(0, 6).map((action, i) => (
              <button
                key={i}
                onClick={() => setInputValue(action.label)}
                className="group flex flex-col items-start p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-left"
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                  {action.category}
                </span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Smart Suggestions */}
        <div className="max-w-2xl w-full">
          <div className="flex flex-wrap gap-2 justify-center">
            {profileData.suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 rounded-full border border-border bg-card text-xs text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/30 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area - Fixed Bottom */}
      <div className="border-t border-border bg-background px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0"
              title="Upload arquivo ou imagem"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={profileData.placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[36px] max-h-[120px] py-2"
              style={{ fieldSizing: "content" } as any}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  // TODO: send message
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0"
              title="Microfone"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled={!inputValue.trim()}
              title="Enviar"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
            {profileData.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
