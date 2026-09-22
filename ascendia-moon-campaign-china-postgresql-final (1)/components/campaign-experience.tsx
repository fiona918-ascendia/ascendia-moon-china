"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { BrandMark } from "@/components/brand-mark";
import { MoonVisual } from "@/components/moon-visual";
import { BRAND, QUESTIONS, QuestionConfig, getChoiceLabel } from "@/lib/campaign-config";
import { CampaignAnswers, MoonReport, createMoonReport } from "@/lib/reporting";

type JourneyStep = "home" | number | "contact" | "report";
type ContactType = "wechat" | "phone";
type ContactState = {
  name: string;
  company: string;
  contactType: ContactType;
  contactValue: string;
  email: string;
  consent: boolean;
  website: string;
};

const INITIAL_ANSWERS: CampaignAnswers = {
  markets: [],
  businessStage: "",
  serviceNeeds: [],
  completedItems: [],
  painPoints: [],
  timeline: ""
};

const INITIAL_CONTACT: ContactState = {
  name: "",
  company: "",
  contactType: "wechat",
  contactValue: "",
  email: "",
  consent: false,
  website: ""
};

function newRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "lead-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function choiceList(questionId: QuestionConfig["id"], values: string[]) {
  return values.map((value) => getChoiceLabel(questionId, value));
}

export function CampaignExperience() {
  const [step, setStep] = useState<JourneyStep>("home");
  const [answers, setAnswers] = useState<CampaignAnswers>(INITIAL_ANSWERS);
  const [contact, setContact] = useState<ContactState>(INITIAL_CONTACT);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<MoonReport | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const requestIdRef = useRef(newRequestId());

  const completionCount = answers.completedItems.length;
  const previewReport = useMemo(
    () => createMoonReport(answers, Boolean(contact.name && contact.company && contact.contactValue)),
    [answers, contact]
  );
  const currentQuestion = typeof step === "number" ? QUESTIONS[step] : undefined;

  function begin() {
    startedAtRef.current = Date.now();
    setError("");
    setStep(0);
  }

  function selectChoice(question: QuestionConfig, choiceId: string) {
    setError("");
    setAnswers((current) => {
      const selected = current[question.id] as string[] | string;
      if (question.kind === "single") return { ...current, [question.id]: choiceId };

      const selectedValues = Array.isArray(selected) ? selected : [];
      const choice = question.choices.find((item) => item.id === choiceId);
      const existingChoiceIsExclusive = selectedValues.some(
        (id) => question.choices.find((item) => item.id === id)?.exclusive
      );

      if (choice?.exclusive) return { ...current, [question.id]: [choiceId] };
      if (existingChoiceIsExclusive) return { ...current, [question.id]: [choiceId] };
      if (selectedValues.includes(choiceId)) {
        return { ...current, [question.id]: selectedValues.filter((id) => id !== choiceId) };
      }
      if (question.maxSelections && selectedValues.length >= question.maxSelections) {
        setError("本题最多选择 " + question.maxSelections + " 项。");
        return current;
      }
      return { ...current, [question.id]: [...selectedValues, choiceId] };
    });
  }

  function isSelected(question: QuestionConfig, choiceId: string) {
    const answer = answers[question.id];
    return Array.isArray(answer) ? answer.includes(choiceId) : answer === choiceId;
  }

  function questionIsComplete(question: QuestionConfig) {
    const answer = answers[question.id];
    const count = Array.isArray(answer) ? answer.length : answer ? 1 : 0;
    return count >= (question.minimumSelections ?? 0);
  }

  function goNext() {
    if (!currentQuestion) return;
    if (!questionIsComplete(currentQuestion)) {
      setError(currentQuestion.minimumSelections === 0 ? "" : "请先选择一项，再继续。");
      return;
    }
    setError("");
    setStep((current) =>
      typeof current === "number" && current < QUESTIONS.length - 1 ? current + 1 : "contact"
    );
  }

  function goPrevious() {
    setError("");
    setFormError("");
    if (step === "contact") return setStep(QUESTIONS.length - 1);
    if (typeof step === "number") return setStep(step > 0 ? step - 1 : "home");
  }

  function updateContact(field: keyof ContactState, value: string | boolean) {
    setFormError("");
    setContact((current) => ({ ...current, [field]: value }));
  }

  function validateContact() {
    if (!contact.name.trim() || !contact.company.trim() || !contact.contactValue.trim()) {
      return "请完整填写姓名、公司名称和联系方式。";
    }
    if (contact.contactType === "phone" && !/^\+?[0-9][0-9\-\s]{6,18}$/.test(contact.contactValue.trim())) {
      return "请填写有效的手机号码。";
    }
    if (contact.contactType === "wechat" && !/^[A-Za-z][A-Za-z0-9_-]{4,39}$/.test(contact.contactValue.trim())) {
      return "请填写有效的微信号。";
    }
    if (contact.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      return "请填写有效的邮箱地址，或留空。";
    }
    if (!contact.consent) return "请先阅读并同意信息使用说明。";
    return "";
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const clientError = validateContact();
    if (clientError) {
      setFormError(clientError);
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestIdRef.current,
          startedAt: startedAtRef.current ?? Date.now() - 4000,
          answers,
          contact
        })
      });
      const data = (await response.json()) as { error?: string; report?: MoonReport };
      if (!response.ok || !data.report) throw new Error(data.error || "提交未成功，请稍后重试。");
      setSubmittedReport(data.report);
      setStep("report");
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error ? submissionError.message : "提交未成功，请稍后重试。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function restart() {
    setAnswers(INITIAL_ANSWERS);
    setContact(INITIAL_CONTACT);
    setSubmittedReport(null);
    setError("");
    setFormError("");
    requestIdRef.current = newRequestId();
    startedAtRef.current = null;
    setStep("home");
  }

  return (
    <main className="campaign-shell">
      <div className="campaign-skyline" aria-hidden="true">
        <svg viewBox="0 0 430 170" preserveAspectRatio="none">
          <path d="M0 144h16v-21h11v-37h12v58h12v-25h13v25h18v-66h11v66h12v-34h13v34h15v-49h10v-13h12v62h16v-39h12v-22h13v61h15v-88h11v88h13v-47h10v-15h15v62h16v-26h17v26h13v-55h12v55h18v-34h13v34h17" />
          <path d="M0 157h430" />
        </svg>
      </div>
      <div className="campaign-stars" aria-hidden="true" />
      <header className="campaign-header">
        <BrandMark compact />
        {step !== "home" && step !== "report" ? (
          <span className="header-step">{String((step as number) + 1).padStart(2, "0")} / 06</span>
        ) : (
          <span className="header-flag">2026 双节企划</span>
        )}
      </header>

      {step === "home" && <HomeScreen onBegin={begin} />}
      {currentQuestion && (
        <QuestionScreen
          question={currentQuestion}
          index={step as number}
          count={completionCount}
          error={error}
          isSelected={isSelected}
          onSelect={selectChoice}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      )}
      {step === "contact" && (
        <ContactScreen
          contact={contact}
          count={completionCount}
          error={formError}
          isSubmitting={isSubmitting}
          onChange={updateContact}
          onPrevious={goPrevious}
          onSubmit={submitLead}
        />
      )}
      {step === "report" && (
        <ReportScreen answers={answers} report={submittedReport ?? previewReport} onRestart={restart} />
      )}

      <footer className="campaign-footer">
        <p>Ascendia Partners｜信宏咨询</p>
        <p>{BRAND.slogan}</p>
      </footer>
    </main>
  );
}

function HomeScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="campaign-screen campaign-screen--home" aria-labelledby="campaign-title">
      <div className="home-copy">
        <p className="eyebrow"><span />中秋 × 国庆特别企划<span /></p>
        <h1 id="campaign-title">月圆国庆至，<br />你的海外布局<span>“圆”</span>了吗？</h1>
        <p className="home-subtitle">6 个问题 · 60 秒<br />看看你的企业现在走到哪一轮「出海月相」</p>
      </div>
      <div className="home-moon-stage">
        <span className="home-orbit" aria-hidden="true" />
        <MoonVisual completionCount={6} size="hero" />
        <p>从市场选择，到公司设立、财税、人员与持续合规，<br />看看你的海外布局还差哪一块。</p>
      </div>
      <button className="primary-button home-action" type="button" onClick={onBegin}>
        开始测试 <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}

type QuestionScreenProps = {
  question: QuestionConfig;
  index: number;
  count: number;
  error: string;
  isSelected: (question: QuestionConfig, choiceId: string) => boolean;
  onSelect: (question: QuestionConfig, choiceId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

function QuestionScreen({ question, index, count, error, isSelected, onSelect, onPrevious, onNext }: QuestionScreenProps) {
  const isMoonQuestion = question.id === "completedItems";
  return (
    <section className="campaign-screen campaign-screen--question" aria-labelledby={"question-" + question.id}>
      <div className="question-topline">
        <button className={"text-button " + (index === 0 ? "text-button--hidden" : "")} type="button" onClick={onPrevious}>← 上一题</button>
        <div className="progress-wrap" aria-label={"第 " + (index + 1) + " 题，共 6 题"}>
          <span className="progress-label">{String(index + 1).padStart(2, "0")} / 06</span>
          <span className="progress-track"><span style={{ width: ((index + 1) / 6) * 100 + "%" }} /></span>
        </div>
      </div>

      <div className={"question-moon " + (isMoonQuestion ? "question-moon--focus" : "")}>
        <MoonVisual completionCount={count} size={isMoonQuestion ? "question" : "mini"} labelled={isMoonQuestion} />
        {isMoonQuestion && <p className="illumination-count">已点亮 <b>{count}</b> / 6</p>}
      </div>

      <div className="question-copy">
        <p className="question-index">Q{index + 1}｜{question.shortTitle}</p>
        <h2 id={"question-" + question.id}>{question.title}</h2>
        {question.helper && <p className="question-helper">{question.helper}</p>}
      </div>

      <div className={"choice-grid " + (question.kind === "single" ? "choice-grid--single" : "")} role={question.kind === "single" ? "radiogroup" : "group"} aria-label={question.title}>
        {question.choices.map((choice) => {
          const selected = isSelected(question, choice.id);
          return (
            <button
              className={"choice-button " + (selected ? "is-selected" : "")}
              key={choice.id}
              type="button"
              role={question.kind === "single" ? "radio" : "checkbox"}
              aria-checked={selected}
              onClick={() => onSelect(question, choice.id)}
            >
              <span className="choice-mark" aria-hidden="true">{selected ? "✓" : ""}</span>
              <span>{choice.label}</span>
            </button>
          );
        })}
      </div>
      <p className="form-message form-message--question" aria-live="polite">{error}</p>
      <button className="primary-button question-next" type="button" onClick={onNext}>
        {index === 5 ? "生成我的月相" : "下一题"} <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}

type ContactScreenProps = {
  contact: ContactState;
  count: number;
  error: string;
  isSubmitting: boolean;
  onChange: (field: keyof ContactState, value: string | boolean) => void;
  onPrevious: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ContactScreen({ contact, count, error, isSubmitting, onChange, onPrevious, onSubmit }: ContactScreenProps) {
  return (
    <section className="campaign-screen campaign-screen--contact" aria-labelledby="contact-title">
      <div className="contact-topline"><button className="text-button" type="button" onClick={onPrevious}>← 返回测试</button></div>
      <div className="contact-moon"><MoonVisual completionCount={count} size="question" /></div>
      <div className="contact-copy">
        <p className="eyebrow eyebrow--center"><span />你的企业月相已经生成<span /></p>
        <h2 id="contact-title">留下联系方式，<br />查看完整企业出海月相报告</h2>
      </div>
      <form className="lead-form" noValidate onSubmit={onSubmit}>
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">不要填写此字段</label>
          <input id="website" tabIndex={-1} autoComplete="off" value={contact.website} onChange={(event) => onChange("website", event.target.value)} />
        </div>
        <label>姓名 / 称呼<input required maxLength={80} value={contact.name} onChange={(event) => onChange("name", event.target.value)} autoComplete="name" /></label>
        <label>公司名称<input required maxLength={120} value={contact.company} onChange={(event) => onChange("company", event.target.value)} autoComplete="organization" /></label>
        <fieldset className="contact-type-field"><legend>联系方式</legend><div className="contact-type-switch">
          <button type="button" className={contact.contactType === "wechat" ? "is-active" : ""} onClick={() => onChange("contactType", "wechat")}>微信号</button>
          <button type="button" className={contact.contactType === "phone" ? "is-active" : ""} onClick={() => onChange("contactType", "phone")}>手机号码</button>
        </div>
          <input required aria-label={contact.contactType === "wechat" ? "微信号" : "手机号码"} placeholder={contact.contactType === "wechat" ? "请输入微信号" : "请输入手机号码"} maxLength={40} value={contact.contactValue} onChange={(event) => onChange("contactValue", event.target.value)} autoComplete={contact.contactType === "phone" ? "tel" : "off"} />
        </fieldset>
        <label>邮箱 <em>选填</em><input type="email" maxLength={160} value={contact.email} onChange={(event) => onChange("email", event.target.value)} autoComplete="email" /></label>
        <label className="consent-row"><input type="checkbox" checked={contact.consent} onChange={(event) => onChange("consent", event.target.checked)} /><span>我已阅读并同意上述信息使用说明</span></label>
        <p className="privacy-note">您提交的信息仅用于本次企业出海需求沟通、活动权益确认及相关服务联系。</p>
        <p className="form-message" role="alert">{error}</p>
        <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "正在生成报告…" : "生成我的专属报告"} <span aria-hidden="true">→</span></button>
      </form>
    </section>
  );
}

function ReportScreen({ answers, report, onRestart }: { answers: CampaignAnswers; report: MoonReport; onRestart: () => void }) {
  return (
    <section className="campaign-screen campaign-screen--report" aria-labelledby="report-title">
      <div className="report-topline"><p className="eyebrow eyebrow--center"><span />企业出海月相报告<span /></p><button className="restart-button" type="button" onClick={onRestart}>重新测试</button></div>
      <div className="report-hero">
        <MoonVisual completionCount={report.completionCount} size="report" labelled />
        <p className="phase-label">{report.phase.name}</p>
        <h2 id="report-title">你的企业正处于<br />「{report.phase.name}」</h2>
        <p className="report-count">海外布局完成度 <b>{report.completionCount}</b> / 6</p>
        <p className="report-summary">{report.phase.summary}</p>
      </div>
      <div className="report-stack">
        <ReportGroup title="你目前关注的市场" items={choiceList("markets", answers.markets)} tone="gold" />
        <ReportGroup title="已经点亮" items={report.completedLabels} icon="✓" emptyText="你可以先从整体路径开始梳理。" />
        <ReportGroup title="还待点亮" items={report.remainingLabels} icon="○" accent emptyText="六个关键经营环节已全部点亮。" />
        <p className="distance-line">距离「月圆」还有 <b>{6 - report.completionCount}</b> 块</p>
        <section className="priority-card"><p>根据你的选择，目前更值得优先关注</p><div>{report.serviceRecommendations.map((item) => <span key={item}>{item}</span>)}</div></section>
      </div>
      <CampaignBenefits />
      <p className="legal-note">本测试仅用于企业海外布局的初步梳理，不构成法律、税务、投资或其他专业意见。</p>
    </section>
  );
}

function ReportGroup({ title, items, icon, accent, emptyText, tone }: { title: string; items: string[]; icon?: string; accent?: boolean; emptyText?: string; tone?: "gold" }) {
  return <section className={"report-group " + (accent ? "report-group--accent " : "") + (tone === "gold" ? "report-group--gold" : "")}><h3>{title}</h3>{items.length ? <ul>{items.map((item) => <li key={item}><span>{icon ?? "•"}</span>{item}</li>)}</ul> : <p className="report-empty">{emptyText}</p>}</section>;
}

function CampaignBenefits() {
  return <div className="campaign-benefits">
    <section className="benefit-card benefit-card--consultation">
      <p className="benefit-kicker">中秋 × 国庆双节礼遇</p>
      <h3>免费企业出海初步咨询</h3>
      <p>关注「信宏出海」公众号，扫码关注后回复「月圆」，即可领取 1 次企业出海免费初步咨询。</p>
      <Image className="wechat-qr" src="/assets/ascendia/qrcode_for_gh_3854a77f8dbc_344.jpg" width={162} height={162} unoptimized alt="信宏出海微信公众号二维码，长按识别二维码关注" />
      <small>长按识别二维码｜关注信宏出海</small>
    </section>
    <section className="benefit-card">
      <p className="benefit-kicker">双节限时礼遇</p>
      <h3>2026 年 10 月 7 日前下单</h3>
      <p>符合活动规则的适用服务，享 <b>8 折优惠</b>。</p>
    </section>
    <section className="benefit-card benefit-card--moon-gift">
      <p className="benefit-kicker">月满中秋 · 礼遇同行</p>
      <h3>满 ¥20,000，同时享受</h3>
      <p>2026 年 10 月 7 日前，单笔订单金额达到人民币 ¥20,000 及以上，可同时获得 <b>8 折优惠</b> ＋ <b>香港月饼礼盒 1 盒</b>。</p>
    </section>
    <details className="rules-panel"><summary>活动规则 <span>＋</span></summary><div><p>活动时间：即日起至 2026 年 10 月 7 日。</p><p>活动期间，符合本活动要求并在规定时间内完成下单的客户，可享适用服务 8 折优惠。</p><p>单笔订单金额达到人民币 20,000 元及以上的客户，在符合活动规则的情况下，可同时享受 8 折优惠及香港月饼礼盒 1 盒。</p><p>优惠及礼品不可兑换现金。具体适用服务、订单认定方式、优惠使用条件、礼品安排及其他未尽事项，以信宏咨询工作人员确认为准。</p><strong>本活动最终解释权归信宏咨询（Ascendia Partners）所有。</strong></div></details>
    <section className="final-cta"><h3>月会圆，<br />布局也可以更完整。</h3><p>你的企业还差哪一块？</p><BrandMark compact /><p>关注「信宏出海」<br />回复「月圆」领取企业出海免费初步咨询</p></section>
  </div>;
}
