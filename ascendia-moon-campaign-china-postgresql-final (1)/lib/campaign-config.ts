export const BRAND = {
  en: "Ascendia Partners",
  cn: "信宏咨询",
  slogan: "立足亚洲，辐射全球",
  consultationKeyword: "月圆",
  offerDeadline: "2026 年 10 月 7 日",
  notifyEmail: "fiona.gu@ascendiaptrs.com"
} as const;

export type Choice = {
  id: string;
  label: string;
  exclusive?: boolean;
};

export type QuestionConfig = {
  id: "markets" | "businessStage" | "serviceNeeds" | "completedItems" | "painPoints" | "timeline";
  index: number;
  shortTitle: string;
  title: string;
  helper?: string;
  kind: "single" | "multi";
  choices: readonly Choice[];
  maxSelections?: number;
  minimumSelections?: number;
};

export const QUESTIONS: readonly QuestionConfig[] = [
  {
    id: "markets",
    index: 1,
    shortTitle: "意向市场",
    title: "你目前重点关注哪些市场？",
    helper: "最多选择 3 项。若暂未确定，请选择最后一项。",
    kind: "multi",
    maxSelections: 3,
    minimumSelections: 1,
    choices: [
      { id: "hong_kong", label: "中国香港" },
      { id: "singapore", label: "新加坡" },
      { id: "malaysia", label: "马来西亚" },
      { id: "thailand", label: "泰国" },
      { id: "indonesia", label: "印度尼西亚" },
      { id: "vietnam", label: "越南" },
      { id: "other_asia", label: "其他亚洲市场" },
      { id: "undetermined", label: "暂未确定，希望先比较不同市场", exclusive: true }
    ]
  },
  {
    id: "businessStage",
    index: 2,
    shortTitle: "出海阶段",
    title: "你的海外业务目前走到哪一步了？",
    kind: "single",
    minimumSelections: 1,
    choices: [
      { id: "researching", label: "还在了解市场，暂时没有确定具体方案" },
      { id: "planning", label: "已确定目标国家 / 地区，正在规划落地" },
      { id: "setting_up", label: "正在办理公司设立、牌照或其他落地手续" },
      { id: "launching", label: "海外公司已经设立，正在准备正式运营" },
      { id: "operating", label: "已经在当地经营，希望进一步完善合规和运营" },
      { id: "expanding", label: "已有多个海外市场，正在考虑下一步扩张" }
    ]
  },
  {
    id: "serviceNeeds",
    index: 3,
    shortTitle: "服务需求",
    title: "目前你最希望解决哪些问题？",
    helper: "可多选。选择“整体评估”时，将优先为你梳理整体路径。",
    kind: "multi",
    minimumSelections: 1,
    choices: [
      { id: "entity_structure", label: "海外公司设立 / 股权及公司结构设计" },
      { id: "market_access", label: "市场准入 / 行业牌照" },
      { id: "tax_compliance", label: "财税合规 / 记账报税 / 审计协调" },
      { id: "crossborder_funds", label: "跨境资金及企业收付款安排" },
      { id: "work_permits", label: "工作准证 / 外籍员工安排" },
      { id: "hr_payroll", label: "人力资源 / 薪资管理" },
      { id: "local_support", label: "注册地址 / 公司秘书 / 本地支持" },
      { id: "annual_maintenance", label: "年审 / 续证 / 年度维护" },
      { id: "multi_market", label: "多国家 / 地区整体布局规划" },
      { id: "overall_assessment", label: "暂时不确定，希望先做整体评估", exclusive: true }
    ]
  },
  {
    id: "completedItems",
    index: 4,
    shortTitle: "点亮月相",
    title: "你的海外布局已经点亮了哪些？",
    helper: "每点亮一项，月亮便向满月更进一步；未开始也可以直接进入下一题。",
    kind: "multi",
    minimumSelections: 0,
    choices: [
      { id: "entity", label: "已设立或明确规划合适的海外公司主体" },
      { id: "market_access", label: "已确认行业准入、经营范围及所需牌照" },
      { id: "tax", label: "已安排当地财税、记账、报税或审计" },
      { id: "funds", label: "已规划企业跨境收付款及资金安排" },
      { id: "people", label: "已确认工作准证、外籍员工及人力安排" },
      { id: "maintenance", label: "已安排年审、续证、注册地址及持续维护" }
    ]
  },
  {
    id: "painPoints",
    index: 5,
    shortTitle: "核心阻碍",
    title: "目前最影响你推进海外业务的是什么？",
    helper: "最多选择 2 项。",
    kind: "multi",
    maxSelections: 2,
    minimumSelections: 1,
    choices: [
      { id: "market_fit", label: "不确定哪个国家 / 地区更适合" },
      { id: "structure", label: "不清楚公司或股权结构怎么设计" },
      { id: "licensing", label: "当地行业准入 / 牌照要求比较复杂" },
      { id: "tax", label: "财税、审计或持续合规比较难处理" },
      { id: "people", label: "工作准证 / 招聘 / 人员落地存在困难" },
      { id: "funds", label: "跨境收付款或资金安排还没有理顺" },
      { id: "maintenance", label: "海外公司已经设立，但后续维护比较麻烦" },
      { id: "provider", label: "已经找过服务商，但沟通或执行体验不理想" },
      { id: "proactive", label: "暂时没有明显问题，希望提前做好规划" }
    ]
  },
  {
    id: "timeline",
    index: 6,
    shortTitle: "推进时间",
    title: "你预计什么时候推进下一步？",
    kind: "single",
    minimumSelections: 1,
    choices: [
      { id: "urgent", label: "已经在推进，希望尽快解决" },
      { id: "one_month", label: "1 个月内" },
      { id: "one_to_three", label: "1–3 个月内" },
      { id: "three_to_six", label: "3–6 个月内" },
      { id: "after_six", label: "6 个月以后" },
      { id: "exploring", label: "目前先了解，还没有明确时间" }
    ]
  }
] as const;

/** Change only this object to revise future moon-phase thresholds or copy. */
export const MOON_PHASES = [
  {
    id: "new_moon",
    name: "新月期",
    min: 0,
    max: 1,
    title: "你的海外布局仍处于准备阶段",
    summary: "建议优先厘清：目标市场、主体选择及整体落地路径。"
  },
  {
    id: "first_quarter",
    name: "上弦月",
    min: 2,
    max: 3,
    title: "你的企业已经迈出关键第一步",
    summary: "但多个经营环节仍需要进一步衔接。建议重点关注公司落地、市场准入、财税、资金及人员安排。"
  },
  {
    id: "waxing_gibbous",
    name: "盈月期",
    min: 4,
    max: 5,
    title: "你的大部分海外经营环节已经逐步搭建完成",
    summary: "下一步更值得关注：补齐剩余缺口，并加强持续运营与合规。"
  },
  {
    id: "full_moon",
    name: "满月期",
    min: 6,
    max: 6,
    title: "你的主要海外经营基础已经基本形成",
    summary: "下一阶段可以重点关注长期财税、人力、年度维护以及进一步市场扩张。"
  }
] as const;

export const COMPLETION_SERVICE_MAP: Record<string, readonly string[]> = {
  entity_structure: ["entity"],
  market_access: ["market_access"],
  tax_compliance: ["tax"],
  crossborder_funds: ["funds"],
  work_permits: ["people"],
  hr_payroll: ["people"],
  local_support: ["maintenance"],
  annual_maintenance: ["maintenance"],
  multi_market: ["entity", "market_access", "tax", "funds", "people", "maintenance"],
  overall_assessment: ["entity", "market_access", "tax", "funds", "people", "maintenance"]
};

export const PAIN_POINT_SERVICE_MAP: Record<string, readonly string[]> = {
  market_fit: ["multi_market", "market_access"],
  structure: ["entity_structure"],
  licensing: ["market_access"],
  tax: ["tax_compliance"],
  people: ["work_permits", "hr_payroll"],
  funds: ["crossborder_funds"],
  maintenance: ["annual_maintenance", "local_support"],
  provider: ["overall_assessment"],
  proactive: ["overall_assessment"]
};

export const HIGH_INTENT_TIMELINES = ["urgent", "one_month"] as const;

export function getQuestion(id: QuestionConfig["id"]) {
  const question = QUESTIONS.find((item) => item.id === id);
  if (!question) throw new Error(`Unknown campaign question: ${id}`);
  return question;
}

export function getChoiceLabel(questionId: QuestionConfig["id"], choiceId: string) {
  return getQuestion(questionId).choices.find((choice) => choice.id === choiceId)?.label ?? choiceId;
}
