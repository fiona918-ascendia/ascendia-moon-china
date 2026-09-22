import cloudbase from "@cloudbase/js-sdk";

let app: ReturnType<typeof cloudbase.init> | null = null;

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getCloudBaseApp() {
  if (!app) {
    app = cloudbase.init({
      env: required("CLOUDBASE_ENV_ID"),
      accessKey: required("CLOUDBASE_API_KEY")
    });
  }
  return app;
}

export function getCloudBaseDatabase() {
  return getCloudBaseApp().rdb();
}

export function useCloudBase() {
  return process.env.BACKEND_PROVIDER === "cloudbase";
}
