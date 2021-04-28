"use strict";
(() => {

  let boglParser = null;

  // recursively highlights this node and all children
  // build a fragmented tree of everything that is either 'just a string' or a part of the actual item
  function _boglHighlight(node) {

    // interpret the node types
    function interpretNodeType(nodeType) {
      switch(nodeType) {
        case ':':
        case '=':
        case 'type':
        case '&':
        case 'of':
        case '!':
        case '#':
        case '->':
        case 'let':
        case 'in':
        case 'while':
        case 'do':
        case 'if':
        case 'then':
        case 'else':
          return 'keyword';
        case 'Array':
        case 'Board':
        case 'Input':
        case 'Content':

        case 'not':
        case 'and':
        case 'or':
        case 'input':
        case 'place':
        case 'countBoard':
        case 'countCol':
        case 'countRow':
        case 'countDiag':
        case 'isFull':
        case 'inARow':

          return 'builtin';
        default:
          return nodeType;
      }
    }

    let nType = interpretNodeType(node.type);
    const a = "<span class='bogl-code "+nType+"'>";
    const b = "</span>";
    let currentText = node.text;

    if(node.childCount == 0) {
      // no children...wrap this text in it's own type
      return a + currentText + b;

    } else {
      let indexOffset = 0;

      // replace children in OG text in reverse order
      for(let x = 0; x < node.children.length; x++) {
        let child = node.children[x];
        const sIndex = child.startIndex - node.startIndex;
        const eIndex = child.endIndex - node.startIndex;
        const hlc = _boglHighlight(child);
        currentText = currentText.substring(0,sIndex+indexOffset) + hlc + currentText.substring(eIndex+indexOffset);
        indexOffset += (hlc.length - child.text.length);
      }

      return a + currentText + b;

    }
  }

  const init = () => {
    const Parser = window.TreeSitter;
    return Parser.init().then(() => {
      return Parser.Language.load('js/tree-sitter-bogl.wasm');
    }).then((Bogl) => {
      boglParser = new Parser();
      boglParser.setLanguage(Bogl);
      // indicate we're good to go now
      return new Promise((resolve,reject) => {
        resolve();
      });
    })
  }

  const highlight = ((code) => {
    if(boglParser) {
      // attempt to parse this program
      const tree = boglParser.parse(code);
      const g = tree.rootNode;
      //console.log(g);
      return _boglHighlight(g);
      //console.log(g.child(0).child(0));

    } else {
      // unavailable, just return the code as is
      return code;
    }

  });

  window.TreeSitterBogl = {
    init: init,
    highlight: highlight
  };

})()
