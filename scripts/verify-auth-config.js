const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const nativeApi = read("src/firebase/authApi.native.js");
const nativeConfig = read("src/firebase/config.native.js");
const webConfig = read("src/firebase/config.web.js");
const authService = read("src/firebase/authService.js");
const metroConfig = read("metro.config.js");
const appConfig = JSON.parse(read("app.json"));

const checks = [
  {
    name: "native auth imports the package export",
    pass: nativeApi.includes('from "@firebase/auth"'),
  },
  {
    name: "native firebase app uses the public Firebase app package",
    pass: nativeConfig.includes('from "firebase/app"'),
  },
  {
    name: "native auth does not deep-import node_modules",
    pass: !nativeApi.includes("node_modules"),
  },
  {
    name: "metro forces @firebase/auth to the React Native Auth bundle on native platforms",
    pass:
      metroConfig.includes('moduleName === "@firebase/auth"') &&
      metroConfig.includes('"android"') &&
      metroConfig.includes('"ios"') &&
      metroConfig.includes('"rn"') &&
      metroConfig.includes('"index.js"'),
  },
  {
    name: "native auth initializes with AsyncStorage persistence",
    pass:
      nativeConfig.includes("initializeAuth(app") &&
      nativeConfig.includes("getReactNativePersistence(AsyncStorage)"),
  },
  {
    name: "native auth falls back to existing auth instance only after initializeAuth",
    pass:
      nativeConfig.indexOf("initializeAuth(app") < nativeConfig.indexOf("getAuth(app)"),
  },
  {
    name: "web auth uses standard getAuth initialization",
    pass: webConfig.includes("getAuth(app)"),
  },
  {
    name: "auth service obtains auth through platform config",
    pass: authService.includes("getAuthInstance()"),
  },
  {
    name: "android build has an explicit version code for upgrade installs",
    pass: Number.isInteger(appConfig.expo?.android?.versionCode),
  },
];

const failed = checks.filter((check) => !check.pass);

if (failed.length) {
  console.error("Auth configuration verification failed:");
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log("Auth configuration verification passed.");
