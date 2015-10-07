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
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }

function replaceStringInFile(path, find, replace) {
  fs.readFile(__dirname + '/' + path, 'utf8', function(error, data) {
    if (err) {
      throw new Error('Error reading file ' + __dirname + '/' + path + ': ' + error);
    }

    var replacedFile = data.replace(find, replace);

    fs.writeFile(__dirname + '/' + path, replacedFile, function(error) {
      if (err) {
        throw new Error('Error writing file ' + __dirname + '/' + path + ': ' + error);
      }
    });
  });
}

function main() {
  // Namespace renaming
  var args = process.argv.slice(2);
  var name = args[0];
  if (name) {
    replaceStringInFile('./js/app.js', /<YOUR-FIREBASE-APP>/g, name);
    replaceStringInFile('./html/index.html', /<YOUR-FIREBASE-APP>/g, name);
    replaceStringInFile('./bower.json', /<YOUR-FIREBASE-APP>/g, name);
  }

  // bower install
  exec("bower install", puts);
}

main();
