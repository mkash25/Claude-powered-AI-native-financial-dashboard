import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { AnalysisReport } from "@/lib/types/analysis";
import { Card, CardTitle } from "@/components/ui/card";

interface ActionItemsProps {
  analysis: AnalysisReport | null;
}

export function ActionItems({ analysis }: ActionItemsProps) {
  if (!analysis) {
    return (
      <Card>
        <CardTitle>Action Items</CardTitle>
        <div className="flex items-center justify-center h-28 text-sm text-gray-500 mt-3">
          Run the pipeline to generate action items
        </div>
      </Card>
    );
  }

  const items = analysis.action_items ?? [];

  return (
    <Card>
      <CardTitle>Action Items</CardTitle>

      {/* Top concern alert */}
      {analysis.top_concern && (
        <div className="mt-2 mb-3 flex items-start gap-2 p-3 rounded-lg bg-yellow-950/40 border border-yellow-800/30">
          <AlertTriangle
            size={14}
            className="text-yellow-400 shrink-0 mt-0.5"
          />
          <p className="text-xs text-yellow-200 leading-relaxed">
            {analysis.top_concern}
          </p>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="flex items-center gap-2 mt-3 text-sm text-green-400">
          <CheckCircle2 size={15} />
          <span>No immediate action needed</span>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-1.5">
          {items.slice(0, 6).map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 py-1">
              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 text-xs flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <p className="text-sm text-gray-200 leading-relaxed">{item}</p>
            </div>
          ))}
          {items.length > 6 && (
            <p className="text-xs text-gray-500 mt-1 pl-7">
              +{items.length - 6} more on the Analysis page
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
