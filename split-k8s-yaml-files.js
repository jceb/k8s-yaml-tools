#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net
// Script prints paths that are in YAML files. The main purpose it so quickly
// fetch the correct path to create a JSON Patch in kustomize.
// Usage:
// cat myfile.yaml | print-yaml-paths
// print-yaml-paths myfile.yaml

import {
  parseAll,
  stringify,
} from "https://deno.land/std@0.103.0/encoding/yaml.ts";
import {
  readAllSync,
  writeAllSync,
} from "https://deno.land/std@0.103.0/io/util.ts";
import S from "https://cdn.skypack.dev/sanctuary";
import $ from "https://cdn.skypack.dev/sanctuary-def";
import { printf } from "https://cdn.skypack.dev/fast-printf";

// import * as l from "https://cdn.skypack.dev/fluture-sanctuary-types";
// import { chain } from "https://cdn.skypack.dev/fluture";
// let S = sanctuary.create({
//   checkTypes: false,
//   env: sanctuary.env.concat(l.env),
// });

const log = (msg) =>
  (o) => {
    console.log(msg, o);
    return o;
  };

S.pipe([
  S.ifElse((a) => S.size(a) === 0)(() => [S.Pair("stdin")(Deno.stdin)])(S.map(
    (filename) => S.Pair(filename)(Deno.openSync(filename, { read: true })),
  )),
  S.map((p) => {
    const contents = readAllSync(S.snd(p));
    if (S.snd(p).rid) {
      Deno.close(S.snd(p).rid);
    }
    return S.Pair(S.fst(p))(parseAll(new TextDecoder().decode(contents)));
  }),
  S.map((p) => {
    console.log(`# file: ${S.fst(p)}`);
    return S.zip(S.range(1)(S.snd(p).length + 1))(S.snd(p));
  }),
  S.join,
  S.map((p) => {
    S.pipe([
      (c) =>
        S.map((f) => f(c))([
          S.gets(S.is($.String))(["metadata", "name"]),
          S.gets(S.is($.String))(["kind"]),
        ]),
      S.ifElse(S.all(S.isJust))(S.pipe([
        S.justs,
        S.joinWith("-"),
        (fn) => `generated/${printf("%03d", S.fst(p))}-${fn}.yaml`,
        log("Writing file:"),
        (fn) => {
          Deno.mkdirSync("generated/", { recursive: true });
          return Deno.createSync(
            fn,
            { write: true },
          );
        },
        (w) => {
          writeAllSync(w, new TextEncoder().encode(stringify(S.snd(p))));
          return w;
        },
        (w) => Deno.close(w.rid),
      ]))((_) => console.warn("Ignoring non-kubernetes yaml file")),
    ])(S.snd(p));
  }),
])(Deno.args);

// vi: ft=javascript:tw=80:sw=2:ts=2:sts=2:et
