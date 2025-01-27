import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center space-y-4 animate-fade-in",
      className
    )}>
      {icon && (
        <div className="w-20 h-20 mb-4 text-muted-foreground animate-fade-in">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      {action && (
        <Button 
          onClick={action.onClick}
          className="mt-4 animate-fade-in hover:scale-105 transition-transform"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}