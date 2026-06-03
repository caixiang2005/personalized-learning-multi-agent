import { useNavigate } from "react-router-dom";
import {
  Bot,
  Route,
  LineChart,
  Brain,
  Boxes,
  Camera,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { capabilities } from "../../lib/designTokens";

const icons: Record<string, LucideIcon> = {
  scan: Camera,
  plan: CalendarCheck,
  profile: Brain,
  agents: Boxes,
  path: Route,
  tutor: Bot,
  analytics: LineChart,
};

export default function CapabilityGrid() {
  const navigate = useNavigate();

  return (
    <div className="scholar-cap-grid" role="list">
      {capabilities.map((cap) => {
        const Icon = icons[cap.id] ?? Boxes;
        return (
          <button
            key={cap.id}
            type="button"
            role="listitem"
            className="scholar-cap-card"
            onClick={() => navigate(cap.path)}
          >
            <span className="scholar-cap-card__icon" aria-hidden>
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <span className="scholar-cap-card__title">{cap.title}</span>
            <span className="scholar-cap-card__desc">{cap.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
