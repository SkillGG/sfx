import type { SearchOptions, SearchParams } from "./utils";

export type SearchQuery = Exclude<SearchOptions, "list"> & {
  /** Stop querying flag */
  stop: boolean;
  /** Was this query made from a SFXLink */
  linked?: boolean;
};

/** SearchParam to string (due to its complicated type) */
export const getParamAsString = (
  q: Awaited<SearchParams>[string],
  {
    /** array to string mapper in case Param is an array */
    ifArray,
    /** The value if param is not set */
    defaultValue,
    /** Prefix to add before the result */
    prefix,
  }: {
    ifArray?: (t: string[]) => string;
    defaultValue?: string;
    prefix?: string;
  },
): string => {
  const def = defaultValue ?? "";
  const dearr = ifArray ?? ((s) => s.join(","));
  return !q
    ? def
    : Array.isArray(q)
      ? `${prefix ?? ""}${dearr(q)}`
      : `${prefix ?? ""}${q}`;
};

/** Parse {@link SearchParams} as {@link SearchQuery} */
export const searchParamsToQuery = (
  params?: Awaited<SearchParams>,
): SearchQuery | null => {
  const q = getParamAsString(params?.q, {});
  const id = getParamAsString(params?.id, { prefix: "id:" });
  const l = getParamAsString(params?.l, { prefix: "lang:" });
  const query = `${q}${q ? " " : ""}${id}${(q ?? id) ? " " : ""}${l}`;

  return strToSearchQuery(query);
};

/** Parse a query string to {@link SearchQuery} */
export const strToSearchQuery = (query?: string): SearchQuery | null => {
  if (query === "") return { stop: false };
  if (!query) return null;

  const langRegex = /lang:(?<langs>(?:[a-z]{2,4},?)+)/gi;

  const langs: string[] = [];

  for (
    let match = langRegex.exec(query);
    !!match;
    match = langRegex.exec(query)
  ) {
    if (match.groups?.langs) {
      langs.push(...match.groups.langs.split(","));
    }
  }

  const idRegex = /id:(?<id>\d+)/gi;
  const idMatch = idRegex.exec(query);

  const id = Number(idMatch?.groups?.id) || 0;

  const value = query.replace(langRegex, "").replace(idRegex, "").trim();

  return { query: value, langs, stop: false, id: id > 0 ? id : 0 };
};

/** Convert {@link SearchQuery} to {@link SearchParams} */
export const searchQueryToParams = (
  query: SearchQuery | null,
): Awaited<SearchParams> | null => {
  if (!query) return query;
  const searchParams: Awaited<SearchParams> = {};
  if (query.query) searchParams.q = query.query;
  if (query.id) searchParams.id = `${query.id}`;
  if (query.langs?.length) searchParams.l = `${query.langs.join(",")}`;
  return searchParams;
};

/** Convert {@link SearchQuery} to string */
export const searchQueryToString = (
  query: SearchQuery | null,
): string | null => {
  if (!query) return null;

  const qStr = query.query ?? "";

  const langs = query.langs?.join(",") ?? "";

  const langQ = langs.length > 0 ? `lang:${langs}` : "";

  const idStr = `${(query.id ?? 0) > 0 ? `id:${query.id}` : ""}`;

  const space1 = !!qStr ? " " : "";
  const space2 = !!qStr || !!langs.length ? " " : "";

  return `${qStr}${!!langQ ? space1 + langQ : ""}${!!idStr ? space2 + idStr : ""}`;
};

/** Check if a {@link SearchQuery}'s searchh his valid and should be sent to the server
 *
 * @param search The query
 * @param invalidStrings return false if search.query contains one of the following strings
 */
export const isValidSearch = (
  search?: SearchQuery | null,
  invalidStrings: string[] = [],
): search is SearchQuery => {
  if (!search) return false;
  const qLength = search.query?.length ?? 0;
  const lLength = search.langs?.length ?? 0;
  const id = search.id ?? 0;

  if (invalidStrings.some((str) => !!search.query?.includes(str))) return false; // has invalid strings
  if (search.stop) return false; // stop flag is set
  return qLength >= 3 || qLength === 0 || lLength > 0 || id > 0;
};
