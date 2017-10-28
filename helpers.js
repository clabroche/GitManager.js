const cp = require('child_process')
module.exports.bash = function (command) {
  return new Promise((resolve, reject) => {
    cp.exec(command, (err, stdout, stderr) => {
      if (err || stderr) return reject({ err, stderr })
      resolve(stdout);
    });
  });
}
