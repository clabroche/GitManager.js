const path = require("path");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const help = require('./helpers')
const Local = function(gitLocation) {
  this.gitLocation = gitLocation;
};
// GET branch Path
// tested
Local.prototype.branch = async function() {
  const pathToHEAD = (await fs.readFileAsync(
    `${this.gitLocation}/HEAD`,
    "utf8"
  ))
    .split("/")
    .pop()
    .trim();
  return pathToHEAD;
};


// Local commit info
Local.prototype.commit = async function() {
  return (await fs.readFileAsync(
    `${this.gitLocation}/refs/heads/${await this.branch()}`,
    "utf8"
  )).trim();
};


Local.prototype.parentFromHash = async function(commitHash) {
  let parentHash;
  const parentHashCommit = (await help.bash(`cd ${this.gitLocation} && git cat-file -p ${commitHash}`)).trim();
  const parentHashLine = parentHashCommit
    .split("\n")
    .filter(line => line.includes("parent"))[0];
  if (parentHashLine) parentHash = parentHashLine.split(" ")[1];
  return parentHash;
};
module.exports = Local;
