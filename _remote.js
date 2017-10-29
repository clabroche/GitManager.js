const path = require("path");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const help = require("./helpers");
const Remote = function(options) {
  this.gitLocation = options.gitLocation;
  this.local = options.localFunction;
};

Remote.prototype.branch = async function(remote = "origin") {
  await this.fetch();
  const branchName = (await this.local.branch()).split("/").pop();
  return branchName; // evolve to Remote branch from file
};

Remote.prototype.commit = async function(remote = "origin") {
  await this.fetch();
  return (await fs.readFileAsync(
    path.resolve(
      this.gitLocation,
      ".git",
      "refs",
      "remotes",
      remote,
      await this.branch(remote)
    ),
    "utf8"
  )).trim();
};

Remote.prototype.fetch = function() {
  return help
    .bash(`cd ${path.resolve(this.gitLocation)} && git fetch`)
    .catch(err => {
      if (!err.stderr.includes("->"))
        throw new Error("git fetch seems not working");
    });
};

Remote.prototype.status = async function() {
  await this.fetch();
  const log = await this.local.logs();
  const originCommit = await this.commit();
  const localCommit = await this.local.commit();
  if (localCommit === originCommit) return 0;
  if (log.hasOwnProperty(originCommit)) return 1;
  if (!log.hasOwnProperty(originCommit)) return -1;
};

Remote.prototype.pull = async function branch(branch, remote = "origin") {
  if ((await this.status()) === 0) return 1;
  await help
    .bash(`cd ${this.gitLocation} && git pull ${remote} ${branch}`)
    .catch(err => {});
  if ((await this.status()) === 0) return 1;
  else return 0;
};

Remote.prototype.push = async function(branch) {
  if ((await this.status()) === -1) return 0;
  if ((await this.status()) === 0) return 0;
  await help
    .bash(`cd ${this.gitLocation} && git push origin ${branch}`)
    .catch(err => {});
  if ((await this.status()) == 0) return 1;
};

module.exports = Remote;
