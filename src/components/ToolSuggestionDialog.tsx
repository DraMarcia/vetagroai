import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ToolSuggestionDialogProps {
  trigger?: React.ReactNode;
}

export const ToolSuggestionDialog = ({ trigger }: ToolSuggestionDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = async () => {
    if (!suggestion.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva sua sugestão.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("tool_suggestions").insert({
        user_id: user?.id || null,
        suggestion: suggestion.trim(),
        category: category || null,
      });

      if (error) throw error;

      setShowSuccess(true);
      setSuggestion("");
      setCategory("");
      
      setTimeout(() => {
        setShowSuccess(false);
        setOpen(false);
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao enviar sugestão:", error);
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugerir Ferramenta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Obrigado!</h3>
            <p className="text-muted-foreground">
              Sua contribuição ajuda a evoluir este app.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Sugerir Nova Ferramenta
              </DialogTitle>
              <DialogDescription>
                Conte-nos qual ferramenta você gostaria de ver no VetAgro IA
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veterinaria">Medicina Veterinária</SelectItem>
                    <SelectItem value="zootecnia">Zootecnia e Nutrição</SelectItem>
                    <SelectItem value="agronomia">Agronomia</SelectItem>
                    <SelectItem value="sustentabilidade">Sustentabilidade</SelectItem>
                    <SelectItem value="gestao">Gestão e Produção</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="suggestion">Sua Sugestão</Label>
                <Textarea
                  id="suggestion"
                  placeholder="Descreva a ferramenta que você gostaria de ter no app..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                <Send className="h-4 w-4" />
                {loading ? "Enviando..." : "Enviar Sugestão"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};