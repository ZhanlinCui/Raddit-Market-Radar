"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Distribution } from "@/components/charts";
import { NoProject, PageHeader, Panel, useActiveProject } from "@/components/page-kit";
import { useUI } from "@/components/ui-context";

export default function TrendPage() {
  const { t } = useUI();
  const { pid } = useActiveProject();
  const { data } = useQuery({
    queryKey: ["trends", pid],
    queryFn: () => api.trends(pid!),
    enabled: !!pid,
  });

  if (!pid) return <NoProject />;

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <PageHeader title={t("tr.title")} sub={t("tr.sub", { n: data?.total ?? 0 })} />

      <div className="grid grid-cols-2 gap-5">
        <Panel title={t("tr.solution")} delay={0}>
          <Distribution data={data?.medo_solution_type ?? {}} color="#0d946c" />
        </Panel>
        <Panel title={t("tr.oppType")} delay={60}>
          <Distribution data={data?.opportunity_type ?? {}} color="#d9603a" />
        </Panel>
        <Panel title={t("tr.persona")} delay={120}>
          <Distribution data={data?.persona ?? {}} color="#2a6ce0" />
        </Panel>
        <Panel title={t("tr.intent")} delay={180}>
          <Distribution data={data?.purchase_intent ?? {}} color="#c57a00" />
        </Panel>
        <Panel title={t("tr.industry")} delay={240} className="col-span-2">
          <Distribution data={data?.industry ?? {}} color="#0d946c" />
        </Panel>
      </div>
    </div>
  );
}
