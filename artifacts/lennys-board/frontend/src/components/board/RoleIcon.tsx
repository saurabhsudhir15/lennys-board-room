import { Zap, Cog, Telescope, UserCircle2, Eye } from "lucide-react";

const map: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  CHALLENGER: Zap,
  OPERATOR: Cog,
  VISIONARY: Telescope,
  "USER ADVOCATE": UserCircle2,
  "DATA ORACLE": Eye,
};

export function RoleIcon({ role }: { role: string }) {
  const key = role.toUpperCase();
  const Icon = map[key] ?? Zap;
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-full"
      style={{
        background: "rgba(255, 107, 53, 0.1)",
        border: "1px solid rgba(255, 107, 53, 0.25)",
      }}
    >
      <Icon size={28} strokeWidth={1.75} className="text-[var(--ember)]" />
    </div>
  );
}
