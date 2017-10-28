const path = require("path");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const help = require('./helpers')
const Remote = function(options) {
  this.gitLocation = options.gitLocation;
  this.local = options.localFunction;
};

Remote.prototype.remoteBranch = async function(remote = 'origin') {
  if (!fs.existsSync(`${this.gitLocation}/refs/remotes/${remote}`))
    throw new Error("The remote doesn't exist");
  const branchName = (await this.local.branch()).split("/").pop();
  return branchName; // evolve to Remote branch from file
};

Remote.prototype.remoteCommit = async function(remote = 'origin') {
  return (await fs.readFileAsync(
    `${this.gitLocation}/refs/remotes/${remote}/${await this.remoteBranch(
      remote
    )}`,
    "utf8"
  )).trim();
};


Remote.prototype.fetch = _ => bash("git fetch");

module.exports = Remote;
