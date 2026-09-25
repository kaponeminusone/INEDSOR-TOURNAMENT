import { Institution } from "@/lib/data"
import { cn } from "@/components/ui/button"

interface InstitutionLogoProps {
  institution: Institution;
  className?: string;
  fallbackClassName?: string;
}

export function InstitutionLogo({ institution, className, fallbackClassName }: InstitutionLogoProps) {
  if (institution.logo) {
    return (
      <img
        src={institution.logo}
        alt={institution.name}
        className={cn("object-contain bg-white p-1", className)}
      />
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center bg-muted font-semibold tracking-[-0.03em] text-foreground/70",
      className,
      fallbackClassName
    )}>
      {institution.initials.substring(0, 3)}
    </div>
  );
}
