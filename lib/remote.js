const path = require("path");
const Promise = require("bluebird");
const fs = require('fs-extra')
const help = require("./helpers");

/**
 * All function related to distant repository
 * @name GitManager.remote
 * @constructor
 */
const Remote = function(options) {
  this.gitLocation = options.gitLocation;
  this.local = options.localFunction;
};

/**
 * @name GitManager.remote.branch
 * @function
 * @description Get name of branch of the remote
 * @return {{String}} branch name
 */
Remote.prototype.branch = async function(remote = "origin") {
  await this.fetch();
  const branchName = (await this.local.branch()).split("/").pop();
  return branchName; // evolve to Remote branch from file
};

/**
 * @name GitManager.remote.commit
 * @function
 * @description Get the latest Hash commit from remote 
 * @return {{String}} hash
 */
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

/**
 * @name GitManager.remote.fetch
 * @function
 * @description Wrapper of fetch command 
 */
Remote.prototype.fetch = function() {
  return help
    .bash(`cd ${path.resolve(this.gitLocation)} && git fetch`)
    .catch(err => {
      if (!err.stderr.includes("->"))
        throw new Error("git fetch seems not working");
    });
};

/**
 * @name GitManager.remote.status
 * @function
 * @description Check if repository isupdate, behind or after the remote 
 * @return {{Number}} -1: pull, 0: update, 1: push
 */
Remote.prototype.status = async function() {
  await this.fetch();
  const log = await this.local.logs();
  const originCommit = await this.commit();
  const localCommit = await this.local.commit();
  if (localCommit === originCommit) return 0;
  if (log.hasOwnProperty(originCommit)) return 1;
  if (!log.hasOwnProperty(originCommit)) return -1;
};

/**
 * @name GitManager.remote.pull
 * @function
 * @description Wrapper to pull function 
 * @return {{Number}} 0: fail, 1: success
 */
Remote.prototype.pull = async function branch(branch, remote = "origin") {
  await this.fetch();
  if ((await this.status()) === 0) return 1;
  await help
    .bash(`cd ${this.gitLocation} && git pull ${remote} ${branch}`)
    .catch(err => {});
  if ((await this.status()) === 0) return 1;
  else return 0;
};

/**
 * @name GitManager.remote.push
 * @function
 * @description Wrapper to push function 
 * @return {{Number}} 0: fail, 1: success
 */
Remote.prototype.push = async function(branch, remote = "origin") {
  await this.fetch();  
  if ((await this.status()) === -1) return 0;
  if ((await this.status()) === 0) return 0;
  await help
    .bash(`cd ${this.gitLocation} && git push origin ${branch}`)
    .catch(err => {});
  if ((await this.status()) == 0) return 1;
};

/**
 * @name GitManager.remote.branches
 * @function
 * @description Get list of local branches
 * @return {{Array.<String>}} Array og branches name
 */
Remote.prototype.branches = async function(remote = "origin") {
  await this.fetch();
  return fs.readdir(`${this.gitLocation}/.git/refs/remotes/${remote}`)
};

module.exports = Remote;
