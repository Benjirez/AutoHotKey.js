const fs = require('fs');
const path = require('path');

const Script = function () {
  this.text = '';
  this.name = '';
  this.getText = function () {
    return this.text;
  };
  this.setText = function (str) {
    this.text = str;
  };
  this.getName = function () {
    return this.name;
  };
  this.setName = function (str) {
    this.name = str;
  };
};

var nameStr = '';
const commands = {};
var prefixStr = '';
var indentLevel = 0;
var script = null;

function getPrefix() {
  var indentStr = '';
  for (i = 0; i < indentLevel; i++) {
    indentStr = indentStr + '  ';
  }
  return prefixStr + indentStr;
}

function write(str) {
  if (!script || (script && !(script instanceof Script))) {
    fs.appendFileSync(path.dirname(require.main.filename) + '/' + nameStr, getPrefix() + str + '\n');
  } else {
    script.setText(script.getText() + getPrefix() + str + '\n');
  }
}

const commandsJson = require('./commands.json');
for (let x in commandsJson) {
  commands[x] = function (str) {
    write(commandsJson[x].replace(new RegExp('%', 'g'), str));
  };
}

commands.on = function (key, callback) {
  write(key + '::');
  indentLevel++;
  callback();
  indentLevel--;
  write('Return');
}

commands.If = function (condition, callback) {
  if (indentLevel > 0) {
    write('if (' + condition + ') {');
    indentLevel++;
  } else {
    write('#If (' + condition + ')');
  }
  callback();
  if (indentLevel > 0) {
    indentLevel--;
    write('}');
    return {
      Else: function (callback) {
        write('else {');
        indentLevel++;
        callback();
        indentLevel--;
        write('}');
      }
    };
  } else {
    write('#If');
  }
}

commands.WinExist = function (str) {
  return 'WinExist("' + str + '")';
}

commands.set = function (key, value) {
  write(key + ' := ' + value);
};

function createGet(current) {
  var get = function (str) {
    var term = current + '.' + str;
    term.get = createGet(term);
    term.run = function (...args) {
      write(term + '(' + args.join(', ') + ')');
    };
    term.runInline = function (...args) {
      return term + '(' + args.join(', ') + ')';
    };
  };
  return get;
}

commands.get = createGet('');

module.exports = {
  init: function (name, scriptObj) {
    script = null;
    if (scriptObj && scriptObj instanceof Script) {
      script = scriptObj;
    }
    indentLevel = 0;
    prefixStr = '';
    nameStr = name + '.ahk';
    Object.assign(global, commands);
    if (!scriptObj) {
      fs.writeFileSync(path.dirname(require.main.filename) + '/' + nameStr, '');
    } else {
      script.setText('');
      script.setName(nameStr);
    }
  },
  Script: Script
};
