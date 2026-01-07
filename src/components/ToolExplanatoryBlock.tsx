import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureItem {
  icon: LucideIcon;
  label: string;
}

interface ToolExplanatoryBlockProps {
  description: string;
  whatItDoes: string;
  forWhom: string;
  whenToUse: string;
  whatYouGet: string;
  features?: FeatureItem[];
  variant?: "green" | "blue" | "amber" | "emerald" | "purple";
}

const variantStyles = {
  green: {
    bg: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    border: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600",
    titleColor: "text-green-800 dark:text-green-200",
  },
  blue: {
    bg: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
    border: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600",
    titleColor: "text-blue-800 dark:text-blue-200",
  },
  amber: {
    bg: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    border: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600",
    titleColor: "text-amber-800 dark:text-amber-200",
  },
  emerald: {
    bg: "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-800 dark:text-emerald-200",
  },
  purple: {
    bg: "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30",
    border: "border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-600",
    titleColor: "text-purple-800 dark:text-purple-200",
  },
};

export const ToolExplanatoryBlock = ({
  description,
  whatItDoes,
  forWhom,
  whenToUse,
  whatYouGet,
  features,
  variant = "green",
}: ToolExplanatoryBlockProps) => {
  const styles = variantStyles[variant];

  return (
    <Card className={`${styles.bg} ${styles.border} mb-6`}>
      <CardContent className="pt-6 space-y-4">
        <p className={`text-sm ${styles.titleColor} leading-relaxed`}>
          {description}
        </p>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
            <p className="font-medium text-sm text-foreground mb-1">O que faz</p>
            <p className="text-xs text-muted-foreground">{whatItDoes}</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
            <p className="font-medium text-sm text-foreground mb-1">Para quem é</p>
            <p className="text-xs text-muted-foreground">{forWhom}</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
            <p className="font-medium text-sm text-foreground mb-1">Quando usar</p>
            <p className="text-xs text-muted-foreground">{whenToUse}</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
            <p className="font-medium text-sm text-foreground mb-1">O que você recebe</p>
            <p className="text-xs text-muted-foreground">{whatYouGet}</p>
          </div>
        </div>

        {features && features.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconComponent className={`h-4 w-4 ${styles.iconColor}`} />
                  <span>{feature.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
