import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Stethoscope, 
  Wheat, 
  Leaf, 
  FileSearch, 
  Mic, 
  Brain,
  ArrowRight 
} from "lucide-react";
import logo from "@/assets/logo.jpg";

const categories = [
  {
    title: "Medicina Veterinária e Saúde Animal",
    description: "Diagnóstico, dosagem, análises clínicas e receituário",
    icon: Stethoscope,
    tools: 6,
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "Zootecnia, Nutrição e Produção Animal",
    description: "Formulação de rações balanceadas e nutrição animal",
    icon: Wheat,
    tools: 1,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Agronomia, Fitotecnia e Sustentabilidade",
    description: "Identificação de plantas, emissões e consultas geoespaciais",
    icon: Leaf,
    tools: 3,
    color: "from-green-600 to-teal-600",
  },
  {
    title: "Comunicação, Conteúdo e Imagem",
    description: "Análise, edição e geração de conteúdo multimídia",
    icon: FileSearch,
    tools: 6,
    color: "from-blue-500 to-cyan-600",
  },
  {
    title: "Voz, Áudio e Interatividade",
    description: "Transcrição de notas e assistente de voz em tempo real",
    icon: Mic,
    tools: 2,
    color: "from-purple-500 to-pink-600",
  },
  {
    title: "Modelagem e Cenários Avançados",
    description: "Análise de cenários complexos com raciocínio avançado",
    icon: Brain,
    tools: 1,
    color: "from-indigo-500 to-purple-600",
  },
];

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <img 
            src={logo} 
            alt="VetAGro Sustentável AI Logo" 
            className="w-48 h-48 object-contain rounded-full shadow-lg"
          />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-foreground">
          Suíte de Ferramentas de IA VetAgro
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Ferramentas especializadas de inteligência artificial para profissionais e tutores de pets. 
          Cada ferramenta é otimizada para auxiliar você a ser mais eficiente.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card 
            key={category.title} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                <category.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {category.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {category.tools} {category.tools === 1 ? 'ferramenta' : 'ferramentas'}
                </span>
                <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
