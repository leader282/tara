// google-services.json is gitignored; EAS builds receive it through the GOOGLE_SERVICES_JSON file variable.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
});
