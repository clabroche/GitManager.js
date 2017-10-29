const cp = require("child_process");
const path = require("path");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));

// tested
const GitManager = function(gitLocation = path.resolve("./")) {
  this.gitLocation = path.resolve(gitLocation);
  if (!fs.existsSync(path.resolve(this.gitLocation, ".git")))
    throw new Error("can't find .git repository");
  this.local = new (require("./_local"))(this.gitLocation);
  this.remote = new (require("./_remote"))({
    gitLocation: this.gitLocation,
    localFunction: this.local
  });
};

module.exports = GitManager;
