/* */ 
"use strict";
exports.__esModule = true;
exports.File = File;
exports.Program = Program;
exports.BlockStatement = BlockStatement;
exports.Noop = Noop;
exports.Directive = Directive;
var _types = require('./types');
Object.defineProperty(exports, "DirectiveLiteral", {
  enumerable: true,
  get: function get() {
    return _types.StringLiteral;
  }
});
function File(node) {
  this.print(node.program, node);
}
function Program(node) {
  this.printInnerComments(node, false);
  this.printSequence(node.directives, node);
  if (node.directives && node.directives.length)
    this.newline();
  this.printSequence(node.body, node);
}
function BlockStatement(node) {
  this.token("{");
  this.printInnerComments(node);
  if (node.body.length) {
    this.newline();
    this.printSequence(node.directives, node, {indent: true});
    if (node.directives && node.directives.length)
      this.newline();
    this.printSequence(node.body, node, {indent: true});
    if (!this.format.retainLines && !this.format.concise)
      this.removeLast("\n");
    this.source("end", node.loc);
    this.rightBrace();
  } else {
    this.source("end", node.loc);
    this.token("}");
  }
}
function Noop() {}
function Directive(node) {
  this.print(node.value, node);
  this.semicolon();
}