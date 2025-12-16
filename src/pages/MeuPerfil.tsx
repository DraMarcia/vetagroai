import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, Linkedin, Instagram, Youtube, Facebook, 
  Sparkles, History, BarChart3, Lightbulb, 
  Settings, Clock, ChevronRight, Save, Crown,
  Leaf, Heart, Target
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ToolSuggestionDialog } from "@/components/ToolSuggestionDialog";
import { CreatorSection } from "@/components/CreatorSection";
import { Link } from "react-router-dom";
import creatorPhoto from "@/assets/creator-photo.jpeg";

interface UserPreferences {
  farm_name: string | null;
  role_description: string | null;
  preferred_segments: string[] | null;
  profile_photo_url: string | null;
}

interface ToolHistory {
  id: string;
  tool_name: string;
  tool_route: string;
  created_at: string;
}

interface FarmMetric {
  id: string;
  metric_name: string;
  metric_value: number | null;
  metric_unit: string | null;
  category: string | null;
}

const SEGMENTS = [
  { id: "pecuaria", label: "Pecuária de Corte" },
  { id: "leiteira", label: "Pecuária Leiteira" },
  { id: "pequenos", label: "Pequenos Animais" },
  { id: "equinos", label: "Equinos" },
  { id: "caprinos", label: "Caprinos e Ovinos" },
  { id: "aves", label: "Avicultura" },
  { id: "suinos", label: "Suinocultura" },
  { id: "gestao", label: "Gestão Rural" },
];

const MeuPerfil = () => {
  const { user, plan, isProfessional } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [preferences, setPreferences] = useState<UserPreferences>({
    farm_name: null,
    role_description: null,
    preferred_segments: [],
    profile_photo_url: null,
  });
  const [toolHistory, setToolHistory] = useState<ToolHistory[]>([]);
  const [farmMetrics, setFarmMetrics] = useState<FarmMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserProfile({ full_name: profileData.full_name });
      }

      // Load preferences
      const { data: prefsData } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prefsData) {
        setPreferences({
          farm_name: prefsData.farm_name,
          role_description: prefsData.role_description,
          preferred_segments: prefsData.preferred_segments,
          profile_photo_url: prefsData.profile_photo_url,
        });
      }

      // Load tool history
      const { data: historyData } = await supabase
        .from("user_tool_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (historyData) {
        setToolHistory(historyData);
      }

      // Load farm metrics
      const { data: metricsData } = await supabase
        .from("user_farm_metrics")
        .select("*")
        .eq("user_id", user.id)
        .limit(6);

      if (metricsData) {
        setFarmMetrics(metricsData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar preferências");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          farm_name: preferences.farm_name,
          role_description: preferences.role_description,
          preferred_segments: preferences.preferred_segments,
          profile_photo_url: preferences.profile_photo_url,
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Preferências salvas com sucesso!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erro ao salvar preferências");
    }
  };

  const toggleSegment = (segmentId: string) => {
    const current = preferences.preferred_segments || [];
    const updated = current.includes(segmentId)
      ? current.filter((s) => s !== segmentId)
      : [...current, segmentId];
    setPreferences({ ...preferences, preferred_segments: updated });
  };

  const getPlanBadge = () => {
    const currentPlan = plan || "free";
    const colors: Record<string, string> = {
      free: "bg-muted text-muted-foreground",
      pro: "bg-primary/20 text-primary",
      enterprise: "bg-amber-500/20 text-amber-600",
    };
    return (
      <Badge className={colors[currentPlan] || colors.free}>
        {currentPlan === "enterprise" && <Crown className="h-3 w-3 mr-1" />}
        {currentPlan.toUpperCase()}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="text-center py-12">
          <CardContent>
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Faça login para acessar</h2>
            <p className="text-muted-foreground mb-6">
              Acesse seu espaço inteligente para gerenciar preferências e histórico.
            </p>
            <Link to="/">
              <Button>Ir para Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Meu Espaço Inteligente
          </h1>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Gerencie suas informações, acompanhe seu histórico e personalize sua experiência no VetAgro AI.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-4">
            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
              <AvatarImage 
                src={creatorPhoto} 
                alt="Dra. Márcia Salgado"
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground text-2xl">
                MS
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">Dra. Márcia Salgado</CardTitle>
            <p className="text-sm text-muted-foreground">Pesquisadora e Criadora</p>
            <div className="mt-2">{getPlanBadge()}</div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="farmName">Nome da Propriedade</Label>
                  <Input
                    id="farmName"
                    value={preferences.farm_name || ""}
                    onChange={(e) => setPreferences({ ...preferences, farm_name: e.target.value })}
                    placeholder="Ex: Fazenda Boa Vista"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função no Agro</Label>
                  <Input
                    id="role"
                    value={preferences.role_description || ""}
                    onChange={(e) => setPreferences({ ...preferences, role_description: e.target.value })}
                    placeholder="Ex: Médico Veterinário"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePreferences} className="flex-1 gap-2">
                    <Save className="h-4 w-4" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Propriedade:</span>
                    <span className="font-medium">{preferences.farm_name || "Não definido"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Função:</span>
                    <span className="font-medium">{preferences.role_description || "Não definido"}</span>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full gap-2">
                  <Settings className="h-4 w-4" />
                  Editar Perfil
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preferences & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Segments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Meus Segmentos de Interesse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SEGMENTS.map((segment) => (
                  <div
                    key={segment.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={segment.id}
                      checked={preferences.preferred_segments?.includes(segment.id) || false}
                      onCheckedChange={() => toggleSegment(segment.id)}
                    />
                    <label
                      htmlFor={segment.id}
                      className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {segment.label}
                    </label>
                  </div>
                ))}
              </div>
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-3">
                  Selecione seus segmentos para personalizar recomendações.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tool History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Histórico de Ferramentas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {toolHistory.length > 0 ? (
                <div className="space-y-2">
                  {toolHistory.map((item) => (
                    <Link
                      key={item.id}
                      to={item.tool_route}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.tool_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhuma ferramenta utilizada ainda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Farm Metrics */}
      {farmMetrics.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Métricas da Propriedade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {farmMetrics.map((metric) => (
                <div key={metric.id} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">
                    {metric.metric_value ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">{metric.metric_unit || ""}</p>
                  <p className="text-sm font-medium mt-1">{metric.metric_name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 mt-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Sugerir Nova Ferramenta</h3>
              <p className="text-sm text-muted-foreground">Ajude a evoluir o app</p>
            </div>
            <ToolSuggestionDialog />
          </CardContent>
        </Card>

        {toolHistory.length > 0 && (
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <History className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Continuar de Onde Parei</h3>
                <p className="text-sm text-muted-foreground">{toolHistory[0]?.tool_name}</p>
              </div>
              <Link to={toolHistory[0]?.tool_route || "/"}>
                <Button variant="outline" size="sm">
                  Continuar
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-8" />

      {/* Creator Section - About the App */}
      <CreatorSection />
    </div>
  );
};

export default MeuPerfil;