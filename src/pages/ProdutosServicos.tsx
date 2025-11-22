import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

const ProdutosServicos = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtos e Serviços</h1>
            <p className="text-muted-foreground">Conheça nossos produtos e serviços especializados</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
          <CardDescription>
            Esta seção será preenchida com nossos produtos e serviços.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você encontrará aqui uma lista completa de produtos e serviços 
            disponíveis para profissionais veterinários e agropecuários.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdutosServicos;
