/* */ 
(function(Buffer) {
  "use strict";
  exports.__esModule = true;
  var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');
  var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
  var _repeat = require('lodash/repeat');
  var _repeat2 = _interopRequireDefault(_repeat);
  var _trimEnd = require('lodash/trimEnd');
  var _trimEnd2 = _interopRequireDefault(_trimEnd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  var Buffer = function() {
    function Buffer(position, format) {
      (0, _classCallCheck3.default)(this, Buffer);
      this.printedCommentStarts = {};
      this.parenPushNewlineState = null;
      this.position = position;
      this._indent = format.indent.base;
      this.format = format;
      this.buf = "";
      this.last = "";
      this.map = null;
      this._sourcePosition = {
        line: null,
        column: null,
        filename: null
      };
      this._endsWithWord = false;
    }
    Buffer.prototype.catchUp = function catchUp(node) {
      if (node.loc && this.format.retainLines && this.buf) {
        while (this.position.line < node.loc.start.line) {
          this.push("\n");
        }
      }
    };
    Buffer.prototype.get = function get() {
      return (0, _trimEnd2.default)(this.buf);
    };
    Buffer.prototype.getIndent = function getIndent() {
      if (this.format.compact || this.format.concise) {
        return "";
      } else {
        return (0, _repeat2.default)(this.format.indent.style, this._indent);
      }
    };
    Buffer.prototype.indentSize = function indentSize() {
      return this.getIndent().length;
    };
    Buffer.prototype.indent = function indent() {
      this._indent++;
    };
    Buffer.prototype.dedent = function dedent() {
      this._indent--;
    };
    Buffer.prototype.semicolon = function semicolon() {
      this.token(";");
    };
    Buffer.prototype.rightBrace = function rightBrace() {
      this.newline(true);
      if (this.format.minified && !this._lastPrintedIsEmptyStatement) {
        this._removeLast(";");
      }
      this.token("}");
    };
    Buffer.prototype.keyword = function keyword(name) {
      this.word(name);
      this.space();
    };
    Buffer.prototype.space = function space() {
      if (this.format.compact)
        return;
      if (this.buf && !this.endsWith(" ") && !this.endsWith("\n")) {
        this.push(" ");
      }
    };
    Buffer.prototype.word = function word(str) {
      if (this._endsWithWord)
        this.push(" ");
      this.push(str);
      this._endsWithWord = true;
    };
    Buffer.prototype.token = function token(str) {
      if (str === "--" && this.last === "!" || str[0] === "+" && this.last === "+" || str[0] === "-" && this.last === "-") {
        this.push(" ");
      }
      this.push(str);
    };
    Buffer.prototype.removeLast = function removeLast(cha) {
      if (this.format.compact)
        return;
      return this._removeLast(cha);
    };
    Buffer.prototype._removeLast = function _removeLast(cha) {
      if (!this.endsWith(cha))
        return;
      this.buf = this.buf.slice(0, -1);
      this.last = this.buf[this.buf.length - 1];
      this.position.unshift(cha);
    };
    Buffer.prototype.startTerminatorless = function startTerminatorless() {
      return this.parenPushNewlineState = {printed: false};
    };
    Buffer.prototype.endTerminatorless = function endTerminatorless(state) {
      if (state.printed) {
        this.dedent();
        this.newline();
        this.token(")");
      }
    };
    Buffer.prototype.newline = function newline(i, removeLast) {
      if (this.format.retainLines || this.format.compact)
        return;
      if (this.format.concise) {
        this.space();
        return;
      }
      if (this.endsWith("\n\n"))
        return;
      if (typeof i === "boolean")
        removeLast = i;
      if (typeof i !== "number")
        i = 1;
      i = Math.min(2, i);
      if (this.endsWith("{\n") || this.endsWith(":\n"))
        i--;
      if (i <= 0)
        return;
      if (removeLast) {
        this.removeLast("\n");
      }
      this.removeLast(" ");
      this._removeSpacesAfterLastNewline();
      for (var j = 0; j < i; j++) {
        this.push("\n");
      }
    };
    Buffer.prototype._removeSpacesAfterLastNewline = function _removeSpacesAfterLastNewline() {
      var lastNewlineIndex = this.buf.lastIndexOf("\n");
      if (lastNewlineIndex >= 0 && this.get().length <= lastNewlineIndex) {
        var toRemove = this.buf.slice(lastNewlineIndex + 1);
        this.buf = this.buf.substring(0, lastNewlineIndex + 1);
        this.last = "\n";
        this.position.unshift(toRemove);
      }
    };
    Buffer.prototype.source = function source(prop, loc) {
      if (prop && !loc)
        return;
      var pos = loc ? loc[prop] : null;
      this._sourcePosition.line = pos ? pos.line : null;
      this._sourcePosition.column = pos ? pos.column : null;
      this._sourcePosition.filename = loc && loc.filename || null;
    };
    Buffer.prototype.withSource = function withSource(prop, loc, cb) {
      if (!this.opts.sourceMaps)
        return cb();
      var originalLine = this._sourcePosition.line;
      var originalColumn = this._sourcePosition.column;
      var originalFilename = this._sourcePosition.filename;
      this.source(prop, loc);
      cb();
      this._sourcePosition.line = originalLine;
      this._sourcePosition.column = originalColumn;
      this._sourcePosition.filename = originalFilename;
    };
    Buffer.prototype.push = function push(str) {
      if (!this.format.compact && this._indent && str[0] !== "\n") {
        if (this.endsWith("\n"))
          str = this.getIndent() + str;
      }
      var parenPushNewlineState = this.parenPushNewlineState;
      if (parenPushNewlineState) {
        for (var i = 0; i < str.length; i++) {
          var cha = str[i];
          if (cha === " ")
            continue;
          this.parenPushNewlineState = null;
          if (cha === "\n" || cha === "/") {
            str = "(" + str;
            this.indent();
            parenPushNewlineState.printed = true;
          }
          break;
        }
      }
      if (this.opts.sourceMaps && str[0] !== "\n")
        this.map.mark(this._sourcePosition);
      this.position.push(str);
      this.buf += str;
      this.last = str[str.length - 1];
      this._endsWithWord = false;
    };
    Buffer.prototype.endsWith = function endsWith(str) {
      var _this = this;
      if (Array.isArray(str))
        return str.some(function(s) {
          return _this.endsWith(s);
        });
      if (str.length === 1) {
        return this.last === str;
      } else {
        return this.buf.slice(-str.length) === str;
      }
    };
    return Buffer;
  }();
  exports.default = Buffer;
  module.exports = exports["default"];
})(require('buffer').Buffer);
