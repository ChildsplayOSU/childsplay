---
title: "Programming"
date: 2021-04-06T19:06:33-07:00
draft: true
coverimage: "../img/favicon.ico"
---

### Introduction

In this curriculum, we use BoGL, a domain specific teaching language developed by Professor Martin Erwig and Oregon State University students. It is designed to be easy to use, and easy to teach. BoGL is completely accessible in an [online web tool](https://bogl.engr.oregonsttae.edu), removing the need to install anything to get started. Support and materials for the language are available online in the form of tutorials and documentation. For instructors that are interested in using BoGL as part of their curriculum, see the [Educator Material page for more info](../educatormaterial/).

{{< center-img src="../img/bogl.png" width="600" >}}

### Why BoGL?

There are numerous languages that used for teaching Computer Science to students. Many of these languages are what we call *General Purpose Programming Languages*. These languages are full-fledged, contain enough features to do just about everything, and have a *lot* of syntax to memorize. These languages can be daunting for students, and teachers. Not only is it difficult to find where to get started in these languages, but it's equally easy to get lost.

With BoGL, the language is designed for one purpose, to help introduce computer science concepts. It's not designed generally, and it's not designed to do everything. By keeping the purpose of this language focused, the language itself is also much simpler. Instructors can learn the syntax quickly, and without having to worry about 'what comes next'.

There are many other introductory languages out there as well, such as Scratch and Blockly, which provide introductions to programming in a block-based style. Like BoGL, these languages keep their syntax simple and straight-forward to work with, avoiding the complexity of most general languages. However, unlike BoGL, these languages do not allow for errors to be made in syntax. This is a *significant* part of the process. Learning to work with mistakes is a part of growing one's understanding, and BoGL provides just enough syntax to learn how to work with errors in a controlled environment. No installing local programs, no fiddling with tools or trying to diagnose problems with students' computers, just programming and learning with BoGL.

### How do I use it?

You can get started right now by [reading the first tutorial](https://bogl.engr.oregonstate.edu/tutorials/GettingStarted.html). From there, you can work along in our [online tool](https://bogl.engr.oregonstate.edu/) to write and run programs. You can even write programs in the tutorials using our miniature editor, which is provided below. These mini-editors show up throughout our tutorials, allowing you to quickly check your understanding with little exercises. You can try out the one below by typing in **getMsg** into the prompt on the right.
{{< bogl-repl >}}
-- an example BoGL program!
game Example

type Msg = {Lets_Use_BoGL}

-- type 'getMsg' and hit enter
-- on the right ->
getMsg : Msg
getMsg = Lets_Use_BoGL
{{< /bogl-repl >}}

If you are curious about using BoGL, and how it relates to our curriculum. Please reach out to us on the [Educator Material page](../educatormaterial/). We're happy to answer any questions you may have.
