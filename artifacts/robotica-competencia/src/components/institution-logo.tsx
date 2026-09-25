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
        className={cn("object-contain bg-white", className)} 
      />
    );
  }
  
  return (
    <div className={cn(
      "flex items-center justify-center bg-muted text-muted-foreground font-bold font-serif uppercase tracking-tighter", 
      className,
      fallbackClassName
    )}>
      {institution.initials.substring(0, 3)}
    </div>
  );
}
