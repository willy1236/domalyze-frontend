import { Code, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cardStyles } from "@/lib/card-styles";

export function FeatureCard({ 
  icon, 
  title, 
  desc,
  highlights = [],
  commands = [],
  bgColor,
  color
}: { 
  icon: React.ReactNode, 
  title: string, 
  desc: string,
  highlights?: string[],
  commands?: string[],
  bgColor?: string,
  color?: string
}) {
  const iconBoxStyles = bgColor 
    ? cardStyles.iconBox.detailed(bgColor)
    : cardStyles.iconBox.simple;

  return (
    <div className={cardStyles.base}>
      <div className={iconBoxStyles}>
        <div className={bgColor ? color : ""}>
          {icon}
        </div>
      </div>
      <h3 className={cardStyles.title}>{title}</h3>
      <p className={cardStyles.description}>{desc}</p>
      
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {highlights.map((highlight, highlightIndex) => (
            <Badge
              key={highlightIndex}
              className={cardStyles.badge.highlight}
            >
              {highlight}
            </Badge>
          ))}
        </div>
      )}
      
      {commands.length > 0 && (
        <>
          <div className="flex items-center space-x-2 mb-3">
            <Terminal className={cardStyles.icon} />
            <span className={cardStyles.label}>常用指令</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {commands.map((command, cmdIndex) => (
              <Badge
                key={cmdIndex}
                className={cardStyles.badge.command}
              >
                <Code className="w-3 h-3 mr-1" />
                {command}
              </Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
