import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "secondary" | "accent";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-muted text-foreground",
        variant === "secondary" && "border border-border bg-card text-muted-foreground",
        variant === "accent" && "bg-accent-soft text-accent",
        className
      )}
    >
      {children}
    </span>
  );
}
