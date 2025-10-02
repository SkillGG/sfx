
export const multiRXExtract = (str: string, rxs: RegExp[]) => {
  const ret: { out: string; matches: Record<string, string[]> } = {
    out: str,
    matches: {},
  };

  for(const rx of rxs){
    const val = rxExtract(ret.out, rx);

    if(!val) continue;

    ret.out = val.out;
    console.log(val.out);
    for(const [k, v] of Object.entries(val.matches)){
        if(ret.matches[k]){
            ret.matches[k] = [...ret.matches[k], ...v];
        }else {
            ret.matches[k] = v;
        }
    }
  }

  if(ret.out === str) return null;

  return ret;
};

export const rxExtract = (
  str: string,
  rx: RegExp,
): { out: string; matches: Record<string, string[]> } | null => {
  if (!str) return null;

  let match = rx.exec(str);

  const found: { name: string; value: string }[] = [];

  let out = str;

  while (match) {
    found.push(
      ...Object.entries(match.groups ?? {}).map((q) => ({
        name: q[0],
        value: q[1],
      })),
    );

    const ostrarr = [...out];

    console.log(match);

    console.log(match.index, match[0].length);
    const front = ostrarr.slice(0, match.index);
    const back = ostrarr.slice(match.index + match[0].length);

    console.log(out);
    console.log(front, back);

    out = [...front, ...back].join("");
    rx.lastIndex = 0;
    match = rx.exec(out);
  }

  console.log(found);
  console.log(out);

  const matches = Object.fromEntries(
    Object.entries(found)
      .map((q) => {
        return [q[1].name, q[1].value];
      })
      .reduce<[string, string[]][]>((p, n) => {
        if (!n[0] || !n[1]) return p;

        const prev = p.find((q) => q[0] === n[0]);

        if (!prev) {
          return [...p, [n[0], [n[1]]]];
        }

        prev[1] = [...prev[1], n[1]];

        return p;
      }, []),
  );

  console.log(matches);

  return {
    out,
    matches,
  };
};
