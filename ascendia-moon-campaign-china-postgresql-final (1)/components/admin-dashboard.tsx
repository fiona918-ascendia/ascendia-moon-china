"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { QUESTIONS, getChoiceLabel } from "@/lib/campaign-config";

type SalesStatus = "new" | "contacted" | "following_up" | "quoted" | "won" | "paused";
type Lead = {
  id: string;
  name: string;
  company: string;
  contact_type: "wechat" | "phone";
  contact_value: string;
  email: string | null;
  markets: string[];
  business_stage: string;
  service_needs: string[];
  completed_items: string[];
  pain_points: string[];
  timeline: string;
  moon_phase: string;
  completion_count: number;
  lead_priority: "high" | "normal";
  sales_status: SalesStatus;
  email_notification_status: "sent" | "failed" | "pending";
  created_at: string;
  updated_at: string;
};

const statusNames: Record<SalesStatus, string> = {
  new: "新线索",
  contacted: "已联系",
  following_up: "跟进中",
  quoted: "已报价",
  won: "已成交",
  paused: "暂缓"
};

const phaseNames: Record<string, string> = {
  new_moon: "新月期",
  first_quarter: "上弦月",
  waxing_gibbous: "盈月期",
  full_moon: "满月期"
};

const filtersInitial = { search: "", market: "", service: "", phase: "", timeline: "", status: "" };
type LeadFilters = typeof filtersInitial;

function labels(question: Parameters<typeof getChoiceLabel>[0], values: string[] | string) {
  const valuesArray = Array.isArray(values) ? values : [values];
  return valuesArray.map((value) => getChoiceLabel(question, value)).join("、");
}

function dateText(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date(value));
}

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [filters, setFilters] = useState(filtersInitial);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadLeads = useCallback(async (nextFilters: LeadFilters) => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    try {
      const response = await fetch("/api/admin/leads?" + params.toString(), { cache: "no-store" });
      const data = (await response.json()) as { leads?: Lead[]; total?: number; error?: string };
      if (!response.ok) throw new Error(data.error || "无法读取 Lead。");
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "无法读取 Lead。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLeads(filtersInitial); }, [loadLeads]);

  const highIntentCount = useMemo(() => leads.filter((lead) => lead.lead_priority === "high").length, [leads]);

  function changeFilter(key: keyof typeof filtersInitial, value: string) {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
  }

  async function applyFilters() {
    await loadLeads(filters);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.assign("/admin/login");
  }

  async function changeStatus(lead: Lead, salesStatus: SalesStatus) {
    const response = await fetch("/api/admin/leads/" + lead.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salesStatus })
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error || "更新失败。");
      return;
    }
    const updated = { ...lead, sales_status: salesStatus };
    setLeads((current) => current.map((item) => item.id === lead.id ? updated : item));
    setSelected((current) => current?.id === lead.id ? updated : current);
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <BrandMark light={false} />
        <div><span>{adminEmail}</span><button type="button" onClick={logout}>退出</button></div>
      </header>
      <section className="admin-heading">
        <div><p className="admin-kicker">CAMPAIGN CRM</p><h1>中秋 × 国庆 Lead 管理</h1><p>所有客户联系方式仅对已授权管理员显示。</p></div>
        <a className="admin-export" href="/api/admin/export">导出 CSV</a>
      </section>
      <section className="admin-stat-grid">
        <div><span>当前线索</span><b>{total}</b></div>
        <div><span>高意向</span><b>{highIntentCount}</b></div>
        <div><span>本页显示</span><b>{leads.length}</b></div>
      </section>
      <section className="admin-filters" aria-label="Lead 筛选">
        <input placeholder="搜索姓名、公司或联系方式" value={filters.search} onChange={(event) => changeFilter("search", event.target.value)} />
        <select value={filters.market} onChange={(event) => changeFilter("market", event.target.value)}><option value="">全部市场</option>{QUESTIONS[0].choices.map((choice) => <option value={choice.id} key={choice.id}>{choice.label}</option>)}</select>
        <select value={filters.service} onChange={(event) => changeFilter("service", event.target.value)}><option value="">全部服务需求</option>{QUESTIONS[2].choices.map((choice) => <option value={choice.id} key={choice.id}>{choice.label}</option>)}</select>
        <select value={filters.phase} onChange={(event) => changeFilter("phase", event.target.value)}><option value="">全部月相</option>{Object.entries(phaseNames).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select>
        <select value={filters.timeline} onChange={(event) => changeFilter("timeline", event.target.value)}><option value="">全部推进时间</option>{QUESTIONS[5].choices.map((choice) => <option value={choice.id} key={choice.id}>{choice.label}</option>)}</select>
        <select value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}><option value="">全部销售状态</option>{Object.entries(statusNames).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select>
        <button type="button" onClick={() => void applyFilters()}>筛选</button>
      </section>
      <p className="admin-error" role="alert">{message}</p>
      <section className="admin-table-wrap" aria-live="polite">
        <table>
          <thead><tr><th>客户</th><th>意向市场</th><th>月相 / 推进</th><th>状态</th><th>提交时间</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6}>正在加载…</td></tr> : null}
            {!loading && leads.length === 0 ? <tr><td colSpan={6}>暂无符合条件的 Lead。</td></tr> : null}
            {!loading && leads.map((lead) => <tr key={lead.id}>
              <td><b>{lead.name}</b><span>{lead.company}</span>{lead.lead_priority === "high" && <em>🔥 高意向</em>}</td>
              <td>{labels("markets", lead.markets)}</td>
              <td>{phaseNames[lead.moon_phase] ?? lead.moon_phase}<span>{lead.completion_count} / 6 · {getChoiceLabel("timeline", lead.timeline)}</span></td>
              <td><select value={lead.sales_status} onChange={(event) => void changeStatus(lead, event.target.value as SalesStatus)}>{Object.entries(statusNames).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></td>
              <td>{dateText(lead.created_at)}<span>邮件：{lead.email_notification_status}</span></td>
              <td><button className="admin-detail-button" type="button" onClick={() => setSelected(lead)}>查看</button></td>
            </tr>)}
          </tbody>
        </table>
      </section>
      {selected && <LeadDetail lead={selected} onClose={() => setSelected(null)} onStatusChange={changeStatus} />}
    </main>
  );
}

function LeadDetail({ lead, onClose, onStatusChange }: { lead: Lead; onClose: () => void; onStatusChange: (lead: Lead, status: SalesStatus) => void }) {
  return <div className="admin-detail-overlay" role="dialog" aria-modal="true" aria-label="Lead 详情"><button className="admin-detail-backdrop" type="button" aria-label="关闭详情" onClick={onClose} /><aside className="admin-detail-panel">
    <div className="admin-detail-header"><div><p className="admin-kicker">LEAD DETAIL</p><h2>{lead.name} · {lead.company}</h2></div><button type="button" onClick={onClose}>×</button></div>
    <section><h3>联系方式</h3><p>{lead.contact_type === "phone" ? "手机号码" : "微信号"}：{lead.contact_value}</p><p>邮箱：{lead.email ?? "未提供"}</p></section>
    <section><h3>完整答题</h3><p><b>意向市场：</b>{labels("markets", lead.markets)}</p><p><b>出海阶段：</b>{getChoiceLabel("businessStage", lead.business_stage)}</p><p><b>服务需求：</b>{labels("serviceNeeds", lead.service_needs)}</p><p><b>已点亮布局：</b>{labels("completedItems", lead.completed_items) || "暂无"}</p><p><b>最大阻碍：</b>{labels("painPoints", lead.pain_points)}</p><p><b>推进时间：</b>{getChoiceLabel("timeline", lead.timeline)}</p></section>
    <section><h3>跟进状态</h3><select value={lead.sales_status} onChange={(event) => onStatusChange(lead, event.target.value as SalesStatus)}>{Object.entries(statusNames).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select><p>邮件通知：{lead.email_notification_status}</p></section>
  </aside></div>;
}
