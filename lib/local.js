const path = require("path");
const Promise = require("bluebird");
const fs = require("fs-extra");
const help = require("./helpers");
/**
 * All function related to local repository
 * @constructor
 * @name GitManager.local
 */
const Local = function(gitLocation) {
  this.gitLocation = gitLocation;
};

/**
 * @name GitManager.local.branch
 * @function
 * @return {{String}} branch name for the current branch
 */
Local.prototype.branch = async function() {
  const pathToHEAD = (await fs.readFileAsync(
    path.resolve(this.gitLocation, ".git", "HEAD"),
    "utf8"
  ))
    .split("/")
    .pop()
    .trim();
  return pathToHEAD;
};

/**
 * @name GitManager.local.logs
 * @description Build tree of commit
 * @function
 * @return {{Object}} tree: {id:{parent:..., path:...},...}
 */
Local.prototype.logs = async function() {
  const currentBranch = await this.branch();
  const currentCommitHash = await this.commit();
  const history = {};
  history[currentCommitHash] = {
    parent: false,
    hash: currentCommitHash
  };
  let i = 0;
  let hash = currentCommitHash;
  while (hash !== undefined) {
    const parent = await this.parentFromHash(hash);
    history[String(hash)] = { parent, hash: String(hash) };
    hash = parent;
    i++;
  }
  this.history = history;
  return history;
};

/**
 * @name GitManager.local.commit
 * @function
 * @description Get the last local commit hash
 * @return {{String}} Hash
 */
Local.prototype.commit = async function() {
  return (await fs.readFileAsync(
    path.resolve(
      this.gitLocation,
      ".git",
      "refs",
      "heads",
      await this.branch()
    ),
    "utf8"
  )).trim();
};

/**
 * @name GitManager.local.parentFromHash
 * @function
 * @description Get the hash from a commit hash
 * @return {{String}} Hash
 */
Local.prototype.parentFromHash = async function(commitHash) {
  let parentHash;
  const parentHashCommit = (await help.bash(
    `cd ${this.gitLocation} && git cat-file -p ${commitHash}`
  )).trim();
  const parentHashLine = parentHashCommit
    .split("\n")
    .filter(line => line.includes("parent"))[0];
  if (parentHashLine) parentHash = parentHashLine.split(" ")[1];
  return parentHash;
};

/**
 * @name GitManager.local.branches
 * @function
 * @description Get all local branches name
 * @return {{Array.<String>}} branches name 
 */
Local.prototype.branches = function() {
  return fs.readdir(`${this.gitLocation}/.git/refs/heads/`);
};

/**
 * @name GitManager.local.checkout
 * @function
 * @description Get all local branches name
 * @return {{Array.<String>}} branches name 
 */
Local.prototype.checkout = async function(branch) {
  const branchesName = await this.branches();
  if (branchesName.includes(branch))
    await help.bash(`cd ${this.gitLocation} && git checkout ${branch}`).catch(err=>{});
  else 
    await help.bash(`cd ${this.gitLocation} && git checkout -b ${branch}`).catch(err=>{}); 
  if (await this.branch() === branch) return 1
  else return -1
};

module.exports = Local;
