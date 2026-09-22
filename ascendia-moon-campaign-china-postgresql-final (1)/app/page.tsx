import { CampaignExperience } from "@/components/campaign-experience";
import { BrandMark } from "@/components/brand-mark";
import { campaignIsEnabled } from "@/lib/campaign-status";

// CAMPAIGN_ENABLED is an operational kill switch and must be read at request time.
export const dynamic = "force-dynamic";

export default function HomePage() {
  if (!campaignIsEnabled()) {
    return <main className="campaign-closed"><BrandMark compact /><h1>本期活动已结束</h1><p>感谢你的关注。企业出海咨询请关注「信宏出海」公众号。</p></main>;
  }
  return <CampaignExperience />;
}
