//Imports
import {aggregate} from "../../plugins/core/index.mjs"
import {render, statistics} from "../../plugins/isocalendar/index.mjs"
import {format} from "../../plugins/languages/index.mjs"
import {history} from "../../plugins/lines/index.mjs"

/**Plugins whose output is merged across accounts (every other plugin is computed for the primary account only) */
export const MERGED = ["isocalendar", "calendar", "languages", "followup", "lines"]

/**GitHub's default calendar palette. Merged calendars are re-bucketed as level = quartile of the merged daily maximum, an approximation of GitHub's per-user quantiles */
const PALETTE = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]

/**Null/NaN safe addition (organization clones serialize NaN counters as null) */
const sum = (a, b) => (Number(a) || 0) + (Number(b) || 0)

/**Repository identity */
const key = node => `${node.owner?.login}/${node.name}`

/**Flattened repository lists deduplicated by key, first occurrence wins (primary first) */
function union(...lists) {
  const seen = new Map()
  for (const node of lists.flat()) {
    if ((node) && (!seen.has(key(node))))
      seen.set(key(node), node)
  }
  return [...seen.values()]
}

/**Number of nodes of b whose key exists in a */
function overlap(a, b) {
  const keys = new Set(a.map(key))
  return b.filter(node => keys.has(key(node))).length
}

/**Flatten calendar weeks into days */
const days = weeks => weeks.flatMap(({contributionDays}) => contributionDays)

/**Add secondary daily counts to primary days in place (restricted to primary dates, secondary-only dates are dropped) */
function dateSum(primary, secondary) {
  const counts = new Map(secondary.map(({date, contributionCount}) => [date, contributionCount]))
  for (const day of primary) {
    if (counts.has(day.date))
      day.contributionCount = sum(day.contributionCount, counts.get(day.date))
  }
}

/**Recolor days by quartile of the merged daily maximum */
function recolor(list) {
  const max = Math.max(0, ...list.map(day => day.contributionCount || 0))
  for (const day of list)
    day.color = PALETTE[day.contributionCount ? Math.min(4, Math.ceil(4 * day.contributionCount / max)) : 0]
}

/**Recursive sum of numeric leaves, keeping a's shape (keys missing in b keep a's value) */
function sumLeaves(a, b) {
  if ((Number.isFinite(a)) && (Number.isFinite(b)))
    return a + b
  if ((a) && (b) && (typeof a === "object") && (typeof b === "object") && (!Array.isArray(a)) && (!Array.isArray(b)))
    return Object.fromEntries(Object.keys(a).map(k => [k, k in b ? sumLeaves(a[k], b[k]) : a[k]]))
  return a
}

/**Whether property is defined through a getter (followup counters derived from computed.repositories are never assigned) */
const isGetter = (object, k) => Boolean(Object.getOwnPropertyDescriptor(object, k)?.get)

/**Sum data properties of source into target for given keys, skipping getters and missing keys */
function add(target, source, keys) {
  for (const k of keys) {
    if ((target) && (k in target) && (!isGetter(target, k)))
      target[k] = sum(target[k], source?.[k])
  }
}

/**
 * Merge a secondary account's JSON clone into the primary account's live data (mutates data, returns nothing).
 * Rules: counters are SUMMED, repository lists are UNIONED transiently (never stored on data, so no secondary repository
 * name or owner ever reaches the output), everything not whitelisted stays PRIMARY.
 */
export default function merge(data, clone, {imports, q, login}) {
  const secondary = clone.user.login

  //SUM: user counters
  for (const k of ["packages", "starredRepositories", "watching", "sponsorshipsAsSponsor", "sponsorshipsAsMaintainer", "followers", "following", "issueComments", "organizations", "repositories"]) {
    if (data.user[k])
      data.user[k].totalCount = sum(data.user[k].totalCount, clone.user[k]?.totalCount)
  }
  if (data.user.repositories)
    data.user.repositories.totalDiskUsage = sum(data.user.repositories.totalDiskUsage, clone.user.repositories?.totalDiskUsage)
  if (data.user.contributionsCollection) {
    for (const k of ["totalCommitContributions", "restrictedContributionsCount", "totalIssueContributions", "totalPullRequestContributions", "totalPullRequestReviewContributions"])
      data.user.contributionsCollection[k] = sum(data.user.contributionsCollection[k], clone.user.contributionsCollection?.[k])
  }

  //UNION (transient): repositories deduplicated by owner/name, primary first
  //Overlap beyond the fetched nodes is unknown, so totals are only corrected for repositories present in both node lists (approximation)
  const cnodes = clone.user.repositories?.nodes ?? [], rnodes = data.user.repositories?.nodes ?? []
  const repos = union(rnodes, cnodes)
  const contributed = union(data.user.repositoriesContributedTo?.nodes ?? [], clone.user.repositoriesContributedTo?.nodes ?? [])
  if (data.user.repositoriesContributedTo) {
    const a = data.user.repositoriesContributedTo, b = clone.user.repositoriesContributedTo ?? {}
    a.totalCount = sum(a.totalCount, b.totalCount) - overlap(a.nodes ?? [], b.nodes ?? [])
  }
  if (data.user.contributionsCollection)
    data.user.contributionsCollection.totalRepositoriesWithContributedCommits = sum(data.user.contributionsCollection.totalRepositoriesWithContributedCommits, clone.user.contributionsCollection?.totalRepositoriesWithContributedCommits) - overlap(rnodes, cnodes)

  //SUM: header calendar (mirrors computed.calendar in core)
  const strip = days(data.user.calendar?.contributionCalendar?.weeks ?? [])
  dateSum(strip, days(clone.user.calendar?.contributionCalendar?.weeks ?? []))
  recolor(strip)
  data.computed.calendar = strip.slice(-14)

  //Recompute repositories-derived metrics over the union (shallow wrapper: data.user keeps only primary nodes)
  aggregate({data: {...data, user: {...data.user, repositories: {...data.user.repositories, nodes: repos}}}, computed: data.computed, imports})

  //Plugins: merged only when both sides computed successfully
  const ready = name => (data.plugins[name]) && (!data.plugins[name].error) && (clone.plugins[name]) && (!clone.plugins[name].error)
  const mergeable = name => {
    if (ready(name))
      return true
    if (q[name])
      console.debug(`metrics/compute/${login} > merge > ${name} skipped for ${secondary} (missing or error)`)
    return false
  }

  //isocalendar: SUM daily counts, recolor, recompute streaks and svg
  if (mergeable("isocalendar")) {
    const iso = data.plugins.isocalendar
    const list = days(iso.weeks)
    dateSum(list, days(clone.plugins.isocalendar.weeks ?? []))
    recolor(list)
    Object.assign(iso, statistics(iso.weeks), {svg: render(iso.weeks, iso.duration)})
  }

  //calendar: SUM per year (secondary-only years appended), newest first, recolor per year
  if (mergeable("calendar")) {
    const {years} = data.plugins.calendar
    for (const cy of clone.plugins.calendar.years ?? []) {
      const py = years.find(y => y.year === cy.year)
      if (py)
        dateSum(days(py.weeks), days(cy.weeks))
      else
        years.push({year: cy.year, weeks: cy.weeks})
    }
    years.sort((a, b) => b.year - a.year)
    for (const {weeks} of years)
      recolor(days(weeks))
  }

  //languages: SUM bytes and indepth counters, UNION unique languages, then re-format favorites/recent
  //stats may double count a repository visible from both accounts under non-default repositories_affiliations (approximation)
  if (mergeable("languages")) {
    const lang = data.plugins.languages, other = clone.plugins.languages
    for (const [name, bytes] of Object.entries(other.stats ?? {}))
      lang.stats[name] = sum(lang.stats[name], bytes)
    lang.total = sum(lang.total, other.total)
    for (const [name, color] of Object.entries(other.colors ?? {})) {
      if (!lang.colors[name])
        lang.colors[name] = color
    }
    lang.unique = new Set([...repos, ...contributed].flatMap(r => (r.languages?.edges ?? []).map(({node: {name}}) => name))).size
    for (const k of ["lines", "commits", "files", "missed", "verified", "elapsed"]) {
      if ((k in lang) && (k in other))
        lang[k] = sumLeaves(lang[k], other[k])
    }
    if (lang.options)
      format(lang, {...lang.options, imports, login})
  }

  //followup: SUM data properties only (count/open/closed/merged are getters over computed.repositories, already aggregated), indepth stays PRIMARY
  if (mergeable("followup")) {
    const f = data.plugins.followup, o = clone.plugins.followup
    for (const section of ["issues", "pr"]) {
      add(f[section], o[section], ["drafts", "skipped"])
      add(f[section].collaborators, o[section]?.collaborators, Object.keys(f[section].collaborators ?? {}))
    }
    if ((f.user) && (o.user)) {
      add(f.user.issues, o.user.issues, ["open", "closed", "drafts", "skipped"])
      add(f.user.pr, o.user.pr, ["open", "closed", "merged", "drafts"])
    }
  }

  //lines: SUM totals and per-week diffs (secondary-only weeks appended), repos stay PRIMARY, history regenerated
  if (mergeable("lines")) {
    const l = data.plugins.lines, o = clone.plugins.lines
    for (const k of ["added", "deleted", "changed"])
      l[k] = sum(l[k], o[k])
    const byDate = new Map(l.weeks.map(week => [week.date, week]))
    for (const w of o.weeks ?? []) {
      const week = byDate.get(w.date)
      if (week)
        add(week, w, ["added", "deleted", "changed"])
      else
        l.weeks.push({date: w.date, added: w.added, deleted: w.deleted, changed: w.changed})
    }
    l.weeks.sort((a, b) => new Date(a.date) - new Date(b.date))
    if (l.sections?.includes("history")) {
      const {"history.limit": limit} = imports.metadata.plugins.lines.inputs({data, account: data.account, q})
      const weeks = l.weeks.filter(({date}) => !limit ? true : new Date(date) > new Date(new Date().getFullYear() - limit, 0, 0))
      l.history = weeks.length ? history(weeks, imports) : null
    }
  }
}
