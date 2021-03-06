#!/usr/bin/env -S deno run --allow-read --allow-net
// Script prints paths that are in YAML files. The main purpose it so quickly
// fetch the correct path to create a JSON Patch in kustomize.
// Usage:
// cat myfile.yaml | print-yaml-paths
// print-yaml-paths myfile.yaml

import { parseAll } from "https://deno.land/std@0.103.0/encoding/yaml.ts";
import { readAllSync } from "https://deno.land/std@0.103.0/io/util.ts";
import S from "https://cdn.skypack.dev/sanctuary";
// import * as l from "https://cdn.skypack.dev/fluture-sanctuary-types";
// import { chain } from "https://cdn.skypack.dev/fluture";
// let S = sanctuary.create({
//   checkTypes: false,
//   env: sanctuary.env.concat(l.env),
// });

// const log = (msg) => (o) => {
//   console.log(msg, o);
//   return o;
// };

const objectToPath = (path) =>
  (o) => {
    // console.log(S.type(o).name);
    if (S.equals(S.type(o).name)("Object")) {
      S.pipe([
        S.pairs,
        S.map((p) =>
          objectToPath(S.append(new String(S.fst(p)))(path))(S.snd(p))
        ),
      ])(o);
    } else if (S.equals(S.type(o).name)("Array")) {
      S.pipe([
        (a) => S.zip(S.range(0)(a.length))(a),
        S.map((p) =>
          objectToPath(S.append(new String(S.fst(p)))(path))(S.snd(p))
        ),
      ])(o);
    } else {
      const path_sep = "/";
      const str = new String(o);
      console.log(
        `${path_sep}${S.joinWith(path_sep)(path)} # ${str.slice(0, 20) +
          (str.length >= 20 ? "..." : "")}`,
      );
    }
  };

S.pipe([
  S.ifElse((a) => S.size(a) === 0)(() => [S.Pair("stdin")(Deno.stdin)])(
    S.map((filename) =>
      S.Pair(filename)(Deno.openSync(filename, { read: true }))
    ),
  ),
  S.map((p) => {
    const contents = readAllSync(S.snd(p));
    if (S.snd(p).rid) {
      Deno.close(S.snd(p).rid);
    }
    return S.Pair(S.fst(p))(parseAll(new TextDecoder().decode(contents)));
  }),
  S.map((p) => {
    console.log(`# file: ${S.fst(p)}`);
    // objectToPath([])(S.snd(p));
    return S.zip(S.range(1)(S.snd(p).length + 1))(S.snd(p));
  }),
  S.join,
  S.map((p) => {
    console.log(`## inner file: ${S.fst(p)}`);
    objectToPath([])(S.snd(p));
  }),
])(Deno.args);

// vi: ft=javascript:tw=80:sw=2:ts=2:sts=2:et
