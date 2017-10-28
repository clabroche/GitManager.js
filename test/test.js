"use strict";

const GitManager = require("../index");

const Promise = require("bluebird");
const fs = require("fs-extra");
const pkg = require("../package.json");
const chai = require("chai");
const expect = chai.expect;
const should = chai.should();
const ncp = require("ncp");
describe(`test`, function() {
  before(done => {
    fs
      .copy("test/remoteRepository_dist", "test/remoteRepository")
      .then(_ => {
        return fs.copy(
          "test/localRepository/.git_dist",
          "test/localRepository/.git"
        );
      })
      .then(_ => {
        return fs.copy(
          "test/localRepositoryEmpty/.git_dist",
          "test/localRepositoryEmpty/.git"
        );
      })
      .then(_ => {
        return fs.copy(
          "test/localRepositoryWithoutRemote/.git_dist",
          "test/localRepositoryWithoutRemote/.git"
        );
      })
      .then(done);
  });
  describe(`${pkg.name}/index.js`, function() {
    describe("#init", function() {
      it("should return error when git is not found", async function() {
        expect(
          _ => new GitManager("path/to/an/inexistant/repository/.git")
        ).to.throw();
      });
      it("should be initialized whend a repository is found", async function() {
        expect(_ => new GitManager("test/localRepository/.git")).to.not.throw();
      });
    });
  });

  describe(`${pkg.name}/_local.js`, function() {
    describe("#branch", function() {
      const gitmanager = new GitManager("test/localRepository/.git");
      it("should return the current branch", async function() {
        expect(await gitmanager.local.branch()).equal("master");
      });
    });
    describe("#commit", function() {
      const gitmanagerWithRemote = new GitManager("test/localRepository/.git");
      it("should return the last commit hash", async function() {
        expect(await gitmanagerWithRemote.local.commit()).equal(
          "f497957c70716ae91fc03319b9daeadb16940775"
        );
      });
    });
    describe("#getParentFromHash", function() {
      const git = new GitManager("test/localRepository/.git");
      it("should return the parent of the commit", async function() {
        expect(
          await git.local.parentFromHash(
            "f497957c70716ae91fc03319b9daeadb16940775"
          )
        ).equal("9d1fb8e405e261100bb227b4c7fceeb5d961a905");
      });
    });
  });

  describe(`${pkg.name}/_remote.js`, function() {
    describe("#remoteBranch", function() {
      const gitmanagerWithRemote = new GitManager("test/localRepository/.git");
      it("should return the current branch on the remote", async function() {
        expect(await gitmanagerWithRemote.remote.remoteBranch("origin")).equal(
          "master"
        );
      });
      const gitmanagerWithoutRemote = new GitManager(
        "test/localRepositoryWithoutRemote/.git"
      );
      it("should throw error when repository don't have remote", function(done) {
        gitmanagerWithoutRemote.remote
          .remoteBranch("origin")
          .catch(err => done());
      });
    });
    describe("#remoteCommit", function() {
      const gitmanagerWithRemote = new GitManager("test/localRepository/.git");
      it("should return the last commit hash on remote", async function() {
        expect(await gitmanagerWithRemote.remote.remoteCommit("origin")).equal(
          "f497957c70716ae91fc03319b9daeadb16940775"
        );
      });
    });
  });
});
