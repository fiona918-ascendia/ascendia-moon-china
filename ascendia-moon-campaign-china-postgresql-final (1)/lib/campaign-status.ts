export function campaignIsEnabled() {
  return process.env.CAMPAIGN_ENABLED !== "false";
}
