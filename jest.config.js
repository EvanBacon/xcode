const path = require("path");

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "/__tests__/.*(test|spec)\\.[jt]sx?$",
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
  rootDir: path.resolve(__dirname),
  displayName: require("./package").name,
  roots: ["__mocks__", "src"],
};
