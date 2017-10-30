const cp = require("child_process");
const path = require("path");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));

/**
 * @constructor 
 * @param {String} gitLocation path to a repository
 */
function GitManager(gitLocation = path.resolve("./")) {
  this.gitLocation = path.resolve(gitLocation);
  if (!fs.existsSync(path.resolve(this.gitLocation, ".git")))
    throw new Error("can't find .git repository");
  this.local = new (require("./lib/local"))(this.gitLocation);
  this.remote = new (require("./lib/remote"))({
    gitLocation: this.gitLocation,
    localFunction: this.local
  });
};

module.exports = GitManager;
