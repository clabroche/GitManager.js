"use strict";

const GitManager = require("../index");

const Promise = require("bluebird");
const fs = require("fs-extra");
const pkg = require("../package.json");
const chai = require("chai");
const expect = chai.expect;
const should = chai.should();
const ncp = require("ncp");
const unzip = require("unzip");
const path = require("path");

const localRepositoriesPath = path.resolve("test", "localRepositories");
describe(`test`, function() {
  before(done => {
    prepareTest().then(_ => done());
  });

  after(done => {
    removeSession().then(_ => done());
  });

  describe(`${pkg.name}/index.js`, function() {
    describe("#init", function() {
      it("should return error when git is not found", function() {
        expect(_ => new GitManager("inexistant/repository")).to.throw();
      });
      it("should be initialized when a repository is found", function() {
        expect(
          _ => new GitManager(`${localRepositoriesPath}/common`)
        ).to.not.throw();
      });
      it("should take current directory when no argument specified", function() {
        try {
          const git = new GitManager();
          expect(git.gitLocation).equal(path.resolve("./"));
        } catch (error) {}
      });
    });
  });

  describe(`${pkg.name}/_local.js`, function() {
    describe("#branch", function() {
      it("should return the current branch", async function() {
        const gitmanager = new GitManager(`${localRepositoriesPath}/common`);
        expect(await gitmanager.local.branch()).equal("master");
      });
    });
    describe("#commit", function() {
      it("should return the last commit hash", async function() {
        const gitmanagerWithRemote = new GitManager(
          `${localRepositoriesPath}/common`
        );
        expect(await gitmanagerWithRemote.local.commit()).equal(
          "f497957c70716ae91fc03319b9daeadb16940775"
        );
      });
    });
    describe("#getParentFromHash", function() {
      it("should return the parent of the commit", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(
          await git.local.parentFromHash(
            "f497957c70716ae91fc03319b9daeadb16940775"
          )
        ).equal("9d1fb8e405e261100bb227b4c7fceeb5d961a905");
      });
    });
    describe("#branchs", function() {
      it("should return list of local branchs", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.remote.branches("origin")).to.deep.equal([
          "master",
          "secondBranch"
        ]);
      });
    });
    describe("#checkout", function() {
      it("should create a branch", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.local.checkout("thirdBranch")).equal(1);
      });
      it("should checkout master", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.local.checkout("master")).equal(1);
      });
    });
  });

  describe(`${pkg.name}/_remote.js`, function() {
    describe("#branch", function() {
      it("should return the current branch on the remote", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.remote.branch("origin")).equal("master");
      });
      it("should take origin remote", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.remote.branch()).equal("master");
      });
      it("should throw error when no remote", function(done) {
        const git = new GitManager(`${localRepositoriesPath}/withoutRemote`);
        git.remote.branch("origin").catch(err => done());
      });
    });
    describe("#commit", function() {
      it("should return the last commit hash on remote", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.remote.commit("origin")).equal(
          "f497957c70716ae91fc03319b9daeadb16940775"
        );
      });
    });
    describe("#fetch", function() {
      it("should fetch", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.remote.fetch()).equal("");
      });
      it("should return error when no remote", function(done) {
        const git = new GitManager(`${localRepositoriesPath}/withoutRemote`);
        git.remote.fetch().catch(err => done());
      });
    });
    describe("#status", function() {
      it("should say update", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.remote.status()).equal(0);
      });
      it("should say to pull", async function() {
        const git = new GitManager(`${localRepositoriesPath}/pull`);
        expect(await git.remote.status()).equal(-1);
      });
      it("should say to push", async function() {
        const git = new GitManager(`${localRepositoriesPath}/push`);
        expect(await git.remote.status()).equal(1);
      });
    });
    describe("#pull", function() {
      it("should say to pull", async function() {
        const git = new GitManager(`${localRepositoriesPath}/pull`);
        expect(await git.remote.status()).equal(-1);
      });
      it("should pull the repository", async function() {
        const git = new GitManager(`${localRepositoriesPath}/pull`);
        expect(await git.remote.pull("master")).equal(1);
      });
      it("should pull the repository when update", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.remote.pull("master")).equal(1);
      });
      it("should not pull when repo is in conflict", async function() {
        const git = new GitManager(`${localRepositoriesPath}/cannotPull`);
        expect(await git.remote.pull("master")).equal(0);
      });
    });
    describe("#push", function() {
      it("should say to push", async function() {
        const git = new GitManager(`${localRepositoriesPath}/push`);
        expect(await git.remote.status()).equal(1);
      });
      it("should push on repository", async function() {
        const git = new GitManager(`${localRepositoriesPath}/push`);
        expect(await git.remote.push("master")).equal(1);
      });
      it("should not push on repository when conflict", async function() {
        const git = new GitManager(`${localRepositoriesPath}/cannotPush`);
        expect(await git.remote.push("master")).equal(0);
      });
    });
    describe("#branchs", function() {
      it("should return list of remote branchs", async function() {
        const git = new GitManager(`${localRepositoriesPath}/common`);
        expect(await git.remote.branches()).to.deep.equal(["master", "secondBranch"]);
      });
    });
  });
});

function prepareTest() {
  return new Promise((resolve, reject) => {
    fs
      .createReadStream("test/repositories.zip")
      .pipe(unzip.Extract({ path: "test" }))
      .on("close", _ => resolve());
  });
}

function removeSession() {
  return Promise.join(
    fs.remove("test/localRepositories"),
    fs.remove("test/remoteRepository")
  );
}
