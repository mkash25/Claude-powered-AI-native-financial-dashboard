import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { AnalysisReport } from "@/lib/types/analysis";
import { HEALTH_CONFIG } from "@/lib/constants";
import { Card, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface HealthCardProps {
  analysis: AnalysisReport | null;
}

const HEALTH_ICONS = {
  strong:   ShieldCheck,
  moderate: ShieldAlert,
  weak:     ShieldX,
};

export function HealthCard({ analysis }: HealthCardProps) {
  if (!analysis) {
    return (
      <Card className="flex flex-col items-center justify-center text-center min-h-[100px]">
        <div className="text-gray-500 text-sm">No analysis yet</div>
      </Card>
    );
  }

  const config = HEALTH_CONFIG[analysis.overall_health];
  const Icon = HEALTH_ICONS[analysis.overall_health];

  return (
    <Card>
      <CardTitle>Portfolio Health</CardTitle>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <HealthBadge health={analysis.overall_health} size="lg" />
          <p className="text-xs text-gray-400 leading-relaxed">
            {analysis.risk_level} risk
          </p>
        </div>
        <Icon
          size={36}
          style={{ color: config.color, opacity: 0.7 }}
        />
      </div>
      {analysis.analysis_date && (
        <p className="text-xs text-gray-600 mt-2">
          As of {formatDate(analysis.analysis_date)}
        </p>
      )}
    </Card>
  );
}
