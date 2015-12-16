/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require('fs');
var exec = require('child_process').exec;
var os = require('os');

const TMP_DIR = os.tmpdir() + "/fb_bootstrap";

function main(RSVP, name, dest) {
  /* Utility Methods */
  function replaceStringInFile(path, find, replace) {
    return new RSVP.Promise(function (resolve, reject) {
      fs.readFile(dest + '/' + path, 'utf8', function(error, data) {
        if (error) {
          reject('Error reading file ' + dest + '/' + path + ': ' + error);
        }

        var replacedFile = data.replace(find, replace);

        fs.writeFile(dest + '/' + path, replacedFile, function(error) {
          if (error) {
            reject('Error writing file ' + dest + '/' + path + ': ' + error);
          } else {
            resolve();
          }
        });
      });
    });
  }

  function promisedExec(command) {
    return new RSVP.Promise(function (resolve, reject) {
      exec(command, function (err, stdout, stderr) {
        if (err) reject(err);
        else resolve(stdout);
      });
    });
  }

  /* Repo Specific Methods */
  function checkForBower() {
    console.log("Looking for local Bower...");
    return new RSVP.Promise(function (resolve, reject) {
      exec("bower -v", function (err, stdout, stderr) {
        if (err) {
          console.log("Temporarily install Bower...");
          promisedExec("npm install bower --prefix " + TMP_DIR)
            .then(resolve.bind(resolve, "temporary"))
            .catch(reject);
        } else {
          resolve("local");
        }
      })
    });
  }

  function installBowerDependencies(location) {
    console.log("Installing Bower dependecies...");
    var bower_path, command;

    if (location == "temporary") {
      bower_path = TMP_DIR + "/node_modules/.bin/bower";
    } else {
      bower_path = "bower";
    }

    command = [bower_path, "install", "--config.cwd="+ dest].join(" ");

    return promisedExec(command);
  }

  function renameToFirebaseApp() {
    console.log("Renaming application...");
    return RSVP.all(['./js/app.js', './html/index.html', './bower.json'].map(function (file) {
      return replaceStringInFile(file, /<YOUR-FIREBASE-APP>/g, name);
    }));
  }

  /* Bootstrap */
  return new RSVP.Promise(function (resolve, reject) {
    checkForBower()
      .then(installBowerDependencies)
      .then(renameToFirebaseApp)
      .then(resolve)
      .catch(reject);
  });
}

function getNodeModule(moduleName, cb) {
  exec("npm install " + moduleName + " --prefix " + os.tmpdir() + "/fb_bootstrap", function (err, stdout, stderr) {
    if (err)
      cb(err);
    else
      cb(null, require(TMP_DIR + "/node_modules/" + moduleName));
  });
}

module.exports = {
  setup: main
}

if (require.main === module) {
  getNodeModule("rsvp", function (err, RSVP) {
    if (err) {
      throw new Error(err);
    } else {
      main
        .apply(this, [RSVP].concat(process.argv.slice(2)))
        .then(function () {
          console.log("Bootstrapped!");
        })
        .catch(function () {
          console.error("Something went wrong!");
        })
    }
  });
}
