const cp = require("child_process");
const path = require("path");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));

// tested
const GitManager = function(gitLocation = ".git") {
  this.gitLocation = path.resolve(gitLocation);
  if (!fs.existsSync(this.gitLocation)) throw new Error("can't find .git repository")
  this.local = new (require("./_local"))(this.gitLocation);
  this.remote = new (require('./_remote'))({gitLocation: this.gitLocation, localFunction: this.local})
};


GitManager.prototype.logs = async function() {
  const currentBranch = (await fs.readFileAsync(
    `${this.gitLocation}/HEAD`,
    "utf8"
  ))
    .split(" ")[1]
    .trim();
  const currentCommitHash = (await fs.readFileAsync(
    `${this.gitLocation}/${currentBranch}`,
    "utf8"
  )).trim();
  const history = {};
  history[currentCommitHash] = {
    parent: false,
    hash: currentCommitHash
  };
  let i = 0;
  let hash = currentCommitHash;
  while (hash !== undefined) {
    const parent = await getParentFromCommitHash(hash);
    history[String(hash)] = { parent, hash: String(hash) };
    hash = parent;
    i++;
  }
  this.history = history;
  return history;
};


// actions
GitManager.prototype.pull = async function branch(branch) {
  await bash(`git pull origin ${branch}`).catch(err => {});
  if ((await this.status()) === 0) return 1;
  else return 0;
};
GitManager.prototype.push = branch => bash(`git push origin ${branch}`);


GitManager.prototype.status = async function() {
  await this.fetch();
  const log = await this.logs();
  const originCommit = await this.currentOriginCommit();
  const localCommit = await this.currentLocalCommit();
  if (!log.hasOwnProperty(localCommit)) return console.log("detached");
  if (localCommit === originCommit) return 0;
  if (log.hasOwnProperty(originCommit)) return 1;
  if (!log.hasOwnProperty(originCommit)) return -1;
};
module.exports = GitManager;
