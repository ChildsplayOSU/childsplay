"use strict";
/*
 * mini-editor.js
 * Embedded BoGL Editor in JS
 * Added in from the bogl-docs site by Benjamin Friedman
 * April 27th, 2021
*/

(function() {

  let commandInput = [];
  function setCommandInput(sci) {
    commandInput = sci;
  }

  // used to track whether we are actively reading input to complete an expression or not
  let inputState = false;
  function setInputState(sis) {
    inputState = sis;
  }

  // used to track whether or not ':t ' was used to request printing of the type as well as the output
  let reportType = false;
  function setReportType(srt) {
    reportType = srt;
  }


  // Build board from JSON
  function get_board(board) {
      let res = "";
      for (let i = 0; i < board.length; i++) {
          for (let j = 0; j < board[i].length; j++) {
              if (j) {
                  res += "\t";
              }
              res += board[i][j][1]["value"];
          }
          res += "<br/>";
      }
      return res;
  }

  // We support nested tuples, so recursion is our friend
  function get_tuple(tuple) {
      let res = "(";
      for (let i = 0; i < tuple.length; i++) {
          if (i > 0) {
              res += ",";
          }
          if (tuple[i]["type"] === "Tuple") {
              res += get_tuple(tuple[i]["value"]);
          }
          else if (tuple[i]["type"] === "Board") {
              res += "<br/><br/>";
              res += get_board(tuple[i]["value"]);
              res += "<br/>";
          }
          else
          {
              res += tuple[i]["value"].toString();
          }
      }
      res += ")";
      return res;
  }

  // Used to stop handling input
  // Used after input has been accepted to full
  // or 'clear' has been typed
  function exitInputHandling() {
    setCommandInput([]);
    setInputState(false);
  }

  // Used to parse response from back-end server
  function parse_response(responses) {
      let latest = responses[responses.length-1];
      let res = "";
      let switch_mode = "";
      let boards = "";

      // Check if inputState switched
      switch (latest["tag"]) {
          case "SpielPrompt": {
              if (inputState === false) {
                  switch_mode = "<br/> 🤖 BoGL Says: Enter input, or \"clear\" to stop. <br/>";
                  inputState = true;
              }
              latest["contents"].forEach(b => boards = boards + get_board(b["value"]) + "<br/>");
              return boards + switch_mode;
          }
          case "SpielTypeError": {
              res = latest["contents"]["message"];
              return res;
          }
          case "SpielParseError": {
              console.log("Language (Parse) Error Found: "+latest["tag"]);
              //res = latest["contents"]["message"];
              // latest["contents"][0] = LINE NUM
              // latest["contents"][1] = COLUMN NUM
              // latest["contents"][2] = FILE NAME
              // latest["contents"][3] = MESSAGE
              // extract message from 4th item
              res = "Language Error: "+latest["contents"][3];
              return res;
          }
          case "SpielRuntimeError": {
            console.log("Runtime error encountered: "+ latest["contents"]);
            res = "Runtime Error: "+latest["contents"];
            if(inputState === true) {
              // flush cmd buffer so a retry will work,
              commandInput = [];
              res += "<br/>You entered an expression of incorrect type. Please enter an expression of the correct type.";
            }
            return res;
          }
          case "SpielTypeHole": {
              res = latest["contents"]["message"];
              return res;
          }
          default: {
              // Else it's a SpielValue
              if (inputState === true) {
                  switch_mode = "<br/><br/> 🤖 BoGL Says: Done reading input. <br/>";
                  exitInputHandling();
                  inputState = false;
              }
              break;
          }
      }


      // Parse response type
      switch (latest["contents"][1]["type"]) {
          case "Board": {
              res = get_board(latest["contents"][1]["value"]);
              break;
          }
          case "Tuple": {
              res = get_tuple(latest["contents"][1]["value"]);
              break;
          }
          default: {
              res = latest["contents"][1]["value"];
              break;
          }
      }

      // uppercase Javascript boolean values to match True/False in BoGL
      if(typeof res === "boolean" && res) {
        res = "True";
      } else if (typeof res === "boolean" && !res) {
        res = "False";
      }


      if(reportType) {
        // report this type, if marked with ':t ' from the cmd line
        let typ = latest["contents"][1]["type"];
        // get first letter in lowercase
        let fl = typ[0].toLowerCase();
        res += " is";

        if(fl === 'a' || fl === 'e' || fl === 'i' || fl === 'o' || fl === 'u') {
          // vowel sub y, use 'an'
          res += " an ";

        } else {
          // consonant
          res += " a ";

        }
        res += typ;

        // clear reporting
        setReportType(false);
        reportType = false;

      }


      latest["contents"][0].forEach(b => extendBoardsString(b, res, boards));
      return boards + res + switch_mode;
  }

  // an expression like place(1,b,(1,1)) evaluates to a board and it also adds the same board to
  // the print buffer. This makes sure we do not print duplicate boards.
  // an expression could modify two boards to be identical, in that case it may be confusing to
  // only print one board, but that is a much less common use case that the first one.
  function extendBoardsString(board, value, boards) {
      var boardStr = get_board(board["value"]);
      if (boardStr !== value) boards = boards + boardStr + value + "<br/>";
  }


  // Pushes item to command's input
  function input(next) {
      //commandInput.push({"input":next});
      commandInput.push(next);
      return;
  }

  // Clear input and state
  function clear() {
      exitInputHandling();
      return " 🤖 BoGL Says: Ok, skipping input. ";
  }

  function updateResults(resultElm, content) {
    resultElm.innerHTML += "> " + content + "<br/><br/>";
    // force scroll to new results, if any
    resultElm.scrollTop = resultElm.scrollHeight;
    resultElm.parentElement.scrollTop = resultElm.parentElement.scrollHeight;
  }

  function updatePlainResult(resultElm,content) {
    resultElm.innerHTML += content + "<br/><br/>";
    // force scroll to new results, if any
    resultElm.scrollTop = resultElm.scrollHeight;
    resultElm.parentElement.scrollTop = resultElm.parentElement.scrollHeight;
  }

  // retrieves the raw code from an element
  function getRawCode(elm) {
    let code = elm.innerHTML;
    // replace <br> with linebreaks
    code = code.replaceAll(/<div><br><\/div>/gi, '\n');
    // replace <div> and </div> with nothing!
    code = code.replaceAll(/(?:<div>)|(?:<\/div>)/gi, '\n');
    // cleanup leftover <br> tags
    code = code.replaceAll(/<br>/gi, '\n');
    // replace &gt; and &lt; w/ > & < respectively
    code = code.replaceAll(/&gt;/gi, '>');
    code = code.replaceAll(/&lt;/gi, '<');
    // update &amp; -> &
    code = code.replaceAll(/&amp;/gi, '&');
	// replace &nbsp; with spaces
    code = code.replaceAll(/&nbsp;/gi, ' ');
    return code;
  }

  // Runs bogl code on the server, returns the result as JSON
  function runBOGL(name,code,cmd,commandInput,elm,callback) {
    let respStatus = 0;

    fetch(
        "https://bogl.engr.oregonstate.edu/api_1/runCode"
        ,{
            method: "POST",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Allow': '*'
            },
            body: JSON.stringify({
                file    : code,
                prelude : "", // no prelude for these examples...
                input   : cmd,
                buffer  : commandInput,
                programName: name
            })
    }).then(function(res) {
      respStatus = res.status;
      return res.json();

    }).then(function(resp) {
      if(name !== "Exercise") {
        // if not an exercise, it's okay to show the command
        updateResults(elm, cmd + "<br/><br/>" + parse_response(resp));

      } else {
        // otherwise, hide command in the response
        updateResults(elm, parse_response(resp));

      }


      callback({
        response: resp,
        status: respStatus
      });

    }).catch((error) => {
      if((error instanceof SyntaxError || (error.name && error.name === "SyntaxError")) && respStatus === 504) {
        // gateway timeout
        updateResults(elm, " 🤖 BoGL Says: Unable to finish running your program, or not currently online. Double check your code, or check back later! ");

      } else if((error instanceof SyntaxError || (error.name && error.name === "SyntaxError"))) {
        // bad parse error
        updateResults(elm, " 🤖 BoGL Says: Your program was unable to be understood. Please double check it and try again! ");

      } else if((error instanceof TypeError || (error.name && error.name === "TypeError")) && respStatus === 0) {
        // likely JS disabled
        updateResults(elm, " 🤖 BoGL Says: Unable to execute your program. Make sure that Javascript is enabled and try again! ");

      } else if((error instanceof TypeError || (error.name && error.name === "TypeError"))) {
        // something else?
        console.error(error);
        updateResults(elm, " 🤖 BoGL Says: Unable to execute your program, please double check your code and try again. ");

      } else {
        // general error
        updateResults(elm, " 🤖 BoGL Says: An error occurred: " + error + " ");

      }
    });
  }

  // apply a function over an array
  const fapply = f => ls => {
    for(let x = 0; x < ls.length; x++) {
      f(ls[x])
    }
  }

  const map = f => ls => {
    for(let x = 0; x < ls.length; x++) {
      ls[x] = f(ls[x])
    }
    return ls;
  }

  // wrappers for get
  const getByClass = n => document.getElementsByClassName(n);
  const getById = n => document.getElementById(n);

  // onkeydown
  const onKeyDown = f => e => e.addEventListener("keydown", f);
  const onClick = f => e => e.addEventListener("click", f);

  // repeats 'f' 'x' times into an array...repeat (5) (3) == [5,5,5]
  const repeat = f => x => [...Array(x)].map(x => f);

  /*
   * Runs the repl with an input element, a result element, bogl code element, and an event
   * Also takes in a 'lastCmd', which is effectively state from the last input. While input
   * is being processed, this will repeatedly take the value of the expression that started input,
   * until 'input' mode is cleared or finished.
   */
  const runREPL = lastCmd => inputx => resultx => codeElm => e => {

    if(e.keyCode != 13) {
      return;
    }

    // prevent bubble
    e.preventDefault();

    let code = getRawCode(codeElm);

    // store command
    let cmd = inputx.value;
    // clear input val
    inputx.value = "";

    if(cmd.replaceAll(/\s/gi, '') === "") {
      // nothing to run
      return;
    }

    // trim whitespace
    cmd = cmd.replace(/^\s+/, '').replace(/\s+$/, '');

    // speak haskell and colors change (this can be removed if it's annoying...)
    if(cmd.match(/haskell/i)) {
      codeElm.parentElement.className+= " haskell";
      updateResults(resultx, "The language that BoGL was inspired and built from, <a href=\"https://www.haskell.org/\" target=\"_blank\">https://haskell.org/</a>");
      return;

    } else if(cmd.match(/bogl/i)) {
      codeElm.parentElement.className= "bogl-embed-editor";
      updateResults(resultx, "Back to BoGL!");
      return;

    } else if(cmd.match(/help/i)) {
      updateResults(resultx, "Help<br/><br/>\
      This is a tiny version of the BoGL editor.<br/><br/>\
      - <a href=\"https://bogl.engr.oregonstate.edu/\" target=\"_blank\">Full BoGL Editor</a><br/>\
      - <a href=\"https://bogl.engr.oregonstate.edu/tutorials/\" target=\"_blank\">Tutorials</a>");
      return;

    }

    if (inputState) {
        // put it into 'input' instead
        input(cmd);
        cmd = lastCmd;

    } else {
      lastCmd = cmd;

    }

    // check to ':t ' to request an expression result type
    let regex = /^:t\s+/;
    if(cmd.match(regex)) {
      // pull off the prefaced type instruction, but note that we would like to report a type once done
      cmd = cmd.replace(regex,'');
      setReportType(true);
      reportType = true;

    } else {
      // do not report type
      setReportType(false);
      reportType = false;

    }

    if(cmd == "clear") {
      updateResults(resultx, cmd + "<br/><br/>" + clear());
      return;

    }

    runBOGL("Program",code,cmd,commandInput,resultx, (data) => {
      // ran successfully
    });
  }


  const compareResults = a => b => {
    a = a.replaceAll(/\s+/gi,' ')
    //a = a.replaceAll(/<br\/>/, '\n')

    b = b.replaceAll(/\s+/gi, ' ')
    //b = b.replaceAll(/<br\/>/, '\n')

    return a == b
  }


  // verifies each exercise test until done, then reports the results
  const verifyEachExerciseTest = checkElm => codeElm => code => checks => expects => resultElm => {
    let check = checks.pop()
    let expect = expects.pop()

    runBOGL("Exercise", code, check, commandInput, resultElm, (data) => {
      // extract the value
      let actual = parse_response(data.response);

      // check if this is a failure
      if (!compareResults(actual)(expect)) {
        // report failure
        codeElm.parentElement.className = "bogl-embed-editor bogl-exercise bogl-check-failure";
        checkElm.value = "Re-Check";
        if(data.response[data.response.length-1].tag == 'SpielValue') {
          updateResults(resultElm, "Expected:<br/>"+expect+"<br/>but got<br/>"+actual);
        }
        updatePlainResult(resultElm, " <span class='exercise-response incorrect'>❌️ Try Again.</span>");

      } else if(checks.length > 0) {
        // more to check
        verifyEachExerciseTest (checkElm) (codeElm) (code) (checks) (expects) (resultElm)

      } else {
        // nothing more to check, report a pass
        codeElm.parentElement.className = "bogl-embed-editor bogl-exercise bogl-check-pass";
        checkElm.value = "Passed";
        updatePlainResult(resultElm, " <span class='exercise-response correct'>✅️ Correct</span>");

      }
    })
  }


  // Verify an exercise
  const verifyExercise = codeElm => checkElm => resultElm => e => {
    // prevent bubble
    e.preventDefault();

    // extract checks & expects
    let checks = checkElm.getAttribute("checks").split("<br />").map(x => x.trim());
    let expects = checkElm.getAttribute("expects").split("<br />").map(x => x.trim());

    let code = getRawCode(codeElm);

    updateResults(resultElm, "checking...");

    // verify all tests pass for this exercise
    verifyEachExerciseTest (checkElm) (codeElm) (code) (checks) (expects) (resultElm)

  }


  window.onload = (function() {

    //
    // regular mini-editor
    //
    // retrieve and cleanup bogl code items
    const codeElms = getByClass("bogl-code");
    fapply (y => y.innerHTML = y.innerHTML.replaceAll(/\n/gi, '<br/>')) (codeElms);

    // get result elements
    const results = getByClass("bogl-repl-result");
    // get input elements
    const inputs = getByClass("bogl-repl-run");

    // create array of 'last' commands to retain
    let lastCmd = repeat ("") (results.length)

    // map the keydown event for each REPL
    for(let x = 0; x < results.length; x++) {
      onKeyDown(runREPL (lastCmd[x]) (inputs[x]) (results[x]) (codeElms[x])) (inputs[x]);
    }


    //
    // interactive exercises
    //
    const exerciseCodeElms = getByClass("bogl-exercise-code");
    // clean bogl code
    fapply (y => y.innerHTML = y.innerHTML.replaceAll(/\n/gi, '<br/>')) (exerciseCodeElms);

    // retrieve exercise items
    const exerciseResults = getByClass("bogl-exercise-result");
    const exerciseChecks = getByClass("bogl-exercise-check");

    // set on click listeners for exercises
    for(let x = 0; x < exerciseResults.length; x++) {
      onClick(verifyExercise (exerciseCodeElms[x]) (exerciseChecks[x]) (exerciseResults[x])) (exerciseChecks[x]);
    }

  });

  console.info("> 🤖 BoGL Embedded Editor Version 0.3.0. Last updated Jan. 7th, 2021");

})();
