//Fixture runner for source/app/metrics/merge.mjs: builds hand-written account data, runs merge and prints scenarios as JSON on stdout
//Usage: node tests/merge.fixtures.mjs (consumed by tests/merge.test.js)
import merge from "../source/app/metrics/merge.mjs"
import * as utils from "../source/app/metrics/utils.mjs"
import {aggregate} from "../source/plugins/core/index.mjs"
import {render, statistics} from "../source/plugins/isocalendar/index.mjs"
import {format} from "../source/plugins/languages/index.mjs"
import {history} from "../source/plugins/lines/index.mjs"

//Keep stdout clean for JSON
console.debug = () => undefined

//Imports and query as seen by merge
const imports = {...utils, ...utils.formatters({timeZone: "UTC"}), metadata: {plugins: {lines: {inputs: () => ({"history.limit": 0})}}}}
const q = {isocalendar: true, calendar: true, languages: true, followup: true, lines: true}
const PALETTE = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]

/**21 consecutive dates ending 2026-09-13 */
const dates = Array.from({length: 21}, (_, i) => new Date(Date.UTC(2026, 8, 13 - 20 + i)).toISOString().slice(0, 10))

/**Build weeks (7 days each) from parallel dates/counts arrays, coloured by quartile of the maximum like merge does */
function weeks(dates, counts) {
  const max = Math.max(0, ...counts)
  const days = dates.map((date, i) => ({date, contributionCount: counts[i], color: PALETTE[counts[i] ? Math.min(4, Math.ceil(4 * counts[i] / max)) : 0]}))
  const result = []
  for (let i = 0; i < days.length; i += 7)
    result.push({contributionDays: days.slice(i, i + 7)})
  return result
}

/**Repository node (shape of tests/mocks/api/github/graphql/base.repositories.mjs) */
function repo({owner, name, counts = {}, forkCount = 0, isFork = false, spdxId = "MIT", languages = []}) {
  const node = {name, owner: {login: owner}, forkCount, isFork, licenseInfo: spdxId ? {spdxId} : null, languages: {edges: languages.map(([name, size, color]) => ({size, node: {name, color}}))}}
  for (const k of ["watchers", "stargazers", "issues_open", "issues_closed", "pr_open", "pr_closed", "pr_merged", "releases", "deployments", "environments"])
    node[k] = {totalCount: counts[k] ?? 0}
  return node
}

//Daily counts: header calendar, isocalendar/calendar plugins (primary: days 1-3 of last week, secondary: days 4-5 plus 4 on day 1)
const HEADER_PRIMARY = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0]
const ISO_PRIMARY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 2, 0, 0, 0, 0]
const ISO_SECONDARY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 2, 1, 0, 0]

/**Primary account live data (state after a single-account compute), fresh objects on each call */
function build() {
  const login = "primary"
  const nodes = [
    repo({owner: login, name: "a", counts: {watchers: 5, stargazers: 10, issues_open: 1, issues_closed: 2, pr_open: 1, pr_closed: 1, pr_merged: 3, releases: 1}, forkCount: 2, languages: [["JavaScript", 150, "#f1e05a"], ["CSS", 100, "#563d7c"]]}),
    repo({owner: login, name: "b", counts: {watchers: 2, stargazers: 20, issues_open: 2, issues_closed: 3, pr_closed: 2, pr_merged: 4, deployments: 1, environments: 1}, forkCount: 1, isFork: true, spdxId: "Apache-2.0", languages: [["JavaScript", 50, "#f1e05a"]]}),
  ]
  const contributed = [
    repo({owner: "shared", name: "repo", languages: [["Go", 10, "#00ADD8"]]}),
    repo({owner: "friend", name: "c", languages: [["Ruby", 10, "#701516"]]}),
  ]
  const calendar = {contributionCalendar: {weeks: weeks(dates, HEADER_PRIMARY)}}
  const computed = {
    commits: 0,
    sponsorships: 0,
    licenses: {favorite: "", used: {}, about: {}},
    token: {},
    repositories: {watchers: 0, stargazers: 0, issues_open: 0, issues_closed: 0, pr_open: 0, pr_closed: 0, pr_merged: 0, forks: 0, forked: 0, releases: 0, deployments: 0, environments: 0},
    calendar: calendar.contributionCalendar.weeks.flatMap(({contributionDays}) => contributionDays).slice(-14),
  }
  const data = {
    account: "user",
    user: {
      databaseId: 1,
      name: "Primary Name",
      login,
      createdAt: "2015-01-01T00:00:00Z",
      avatarUrl: "https://github.com/primary.png",
      followers: {totalCount: 513},
      following: {totalCount: 10},
      starredRepositories: {totalCount: 20},
      watching: {totalCount: 4},
      packages: {totalCount: 1},
      sponsorshipsAsSponsor: {totalCount: 2},
      sponsorshipsAsMaintainer: {totalCount: 0},
      issueComments: {totalCount: 30},
      organizations: {totalCount: 2},
      repositories: {totalCount: 2, totalDiskUsage: 1000, nodes},
      repositoriesContributedTo: {totalCount: 3, nodes: contributed},
      contributionsCollection: {totalCommitContributions: 100, restrictedContributionsCount: 5, totalIssueContributions: 8, totalPullRequestContributions: 6, totalPullRequestReviewContributions: 2, totalRepositoriesWithContributedCommits: 2},
      calendar,
    },
    computed,
    plugins: {},
  }
  aggregate({data, computed, imports})

  //isocalendar
  const iso = weeks(dates, ISO_PRIMARY)
  data.plugins.isocalendar = {...statistics(iso), svg: render(iso, "half-year"), duration: "half-year", weeks: iso}

  //calendar
  data.plugins.calendar = {years: [{year: 2026, weeks: weeks(dates, ISO_PRIMARY)}, {year: 2025, weeks: weeks(["2025-12-21", "2025-12-22", "2025-12-23", "2025-12-24", "2025-12-25", "2025-12-26", "2025-12-27"], [0, 1, 0, 0, 2, 0, 0])}]}

  //languages (unique = distinct names over repositories + contributed nodes)
  const languages = {unique: 4, sections: ["most-used"], details: [], indepth: false, colors: {JavaScript: "#f1e05a", CSS: "#563d7c"}, total: 300, stats: {JavaScript: 200, CSS: 100}, "stats.recent": {}}
  Object.defineProperty(languages, "options", {value: {limit: 8, threshold: 0, other: true, ignored: "", indepth: false, colors: {}, customColors: {}}, enumerable: false})
  format(languages, {...languages.options, login, imports})
  data.plugins.languages = languages

  //followup (live getters over computed, as in source/plugins/followup/index.mjs)
  data.plugins.followup = {
    sections: ["repositories", "user"],
    issues: {
      get count() {
        return this.open + this.closed + this.drafts + this.skipped
      },
      get open() {
        return computed.repositories.issues_open
      },
      get closed() {
        return computed.repositories.issues_closed
      },
      drafts: 0,
      skipped: 0,
      collaborators: {open: 2, closed: 1, drafts: 0, skipped: 1},
    },
    pr: {
      get count() {
        return this.open + this.closed + this.merged + this.drafts
      },
      get open() {
        return computed.repositories.pr_open
      },
      get closed() {
        return computed.repositories.pr_closed
      },
      get merged() {
        return computed.repositories.pr_merged
      },
      drafts: 0,
      collaborators: {open: 1, closed: 0, merged: 2, drafts: 0},
    },
    indepth: {repositories: {"primary/a": {}}},
    user: {
      issues: {
        get count() {
          return this.open + this.closed + this.drafts + this.skipped
        },
        open: 1,
        closed: 2,
        drafts: 0,
        skipped: 0,
      },
      pr: {
        get count() {
          return this.open + this.closed + this.merged + this.drafts
        },
        open: 1,
        closed: 1,
        merged: 3,
        drafts: 0,
      },
    },
  }

  //lines
  const lweeks = [{date: "2026-08-30", added: 60, deleted: 20, changed: 5}, {date: "2026-09-06", added: 40, deleted: 30, changed: 5}]
  data.plugins.lines = {sections: ["base", "history"], added: 100, deleted: 50, changed: 10, repos: [{handle: "primary/a", added: 100, deleted: 50, changed: 10}], weeks: lweeks, history: history(lweeks, imports)}

  return data
}

/**Secondary user account, JSON clone shape (plain data, no getters) */
function secondary() {
  const login = "secondary"
  const header = [...dates.slice(7), "2026-09-14"]
  const counts = header.map(date => ({"2026-09-07": 4, "2026-09-13": 1, "2026-09-14": 9})[date] ?? 0)
  return {
    account: "user",
    user: {
      databaseId: 2,
      name: "Secondary Name",
      login,
      createdAt: "2018-01-01T00:00:00Z",
      avatarUrl: "https://github.com/secondary.png",
      followers: {totalCount: 74},
      following: {totalCount: 5},
      starredRepositories: {totalCount: 3},
      watching: {totalCount: 1},
      packages: {totalCount: 0},
      sponsorshipsAsSponsor: {totalCount: 1},
      sponsorshipsAsMaintainer: {totalCount: 1},
      issueComments: {totalCount: 7},
      organizations: {totalCount: 1},
      repositories: {
        totalCount: 2,
        totalDiskUsage: 500,
        nodes: [
          repo({owner: login, name: "x", counts: {watchers: 1, stargazers: 7, issues_open: 3, issues_closed: 1, pr_open: 2, pr_merged: 1, releases: 2}, languages: [["Python", 50, "#3572A5"]]}),
          //Same owner/name as a primary node: must be deduplicated (first occurrence wins)
          repo({owner: "primary", name: "a", counts: {watchers: 999, stargazers: 999, issues_open: 999}, forkCount: 999, languages: [["JavaScript", 999, "#f1e05a"]]}),
        ],
      },
      repositoriesContributedTo: {totalCount: 2, nodes: [repo({owner: "shared", name: "repo", languages: [["Go", 10, "#00ADD8"]]}), repo({owner: login, name: "y", languages: [["Shell", 10, "#89e051"]]})]},
      contributionsCollection: {totalCommitContributions: 40, restrictedContributionsCount: 2, totalIssueContributions: 3, totalPullRequestContributions: 4, totalPullRequestReviewContributions: 1, totalRepositoriesWithContributedCommits: 2},
      calendar: {contributionCalendar: {weeks: weeks(header, counts)}},
    },
    computed: {},
    plugins: {
      isocalendar: {...statistics(weeks(dates, ISO_SECONDARY)), svg: "<svg></svg>", duration: "half-year", weeks: weeks(dates, ISO_SECONDARY)},
      calendar: {years: [{year: 2026, weeks: weeks(dates, ISO_SECONDARY)}, {year: 2024, weeks: weeks(["2024-06-02", "2024-06-03", "2024-06-04", "2024-06-05", "2024-06-06", "2024-06-07", "2024-06-08"], [1, 0, 0, 0, 0, 0, 3])}]},
      languages: {unique: 3, sections: ["most-used"], details: [], indepth: false, colors: {Python: "#3572A5"}, total: 150, stats: {JavaScript: 100, Python: 50}, "stats.recent": {}, favorites: [], recent: []},
      followup: {
        sections: ["repositories", "user"],
        issues: {count: 7, open: 3, closed: 1, drafts: 1, skipped: 2, collaborators: {open: 1, closed: 1, drafts: 0, skipped: 0}},
        pr: {count: 4, open: 2, closed: 0, merged: 1, drafts: 1, collaborators: {open: 2, closed: 0, merged: 1, drafts: 0}},
        indepth: {repositories: {"secondary/x": {}}},
        user: {
          issues: {count: 9, open: 3, closed: 4, drafts: 1, skipped: 1},
          pr: {count: 10, open: 2, closed: 2, merged: 5, drafts: 1},
        },
      },
      lines: {sections: ["base", "history"], added: 10, deleted: 5, changed: 1, repos: [{handle: "secondary/x", added: 10, deleted: 5, changed: 1}], weeks: [{date: "2026-09-06", added: 10, deleted: 5, changed: 1}, {date: "2026-09-13", added: 7, deleted: 1, changed: 0}], history: "<svg></svg>"},
    },
  }
}

/**Secondary organization account, JSON clone shape (NaN counters serialized as null, see source/plugins/base/index.mjs postprocess.organization) */
function organization() {
  return {
    account: "organization",
    user: {
      databaseId: 3,
      name: "Acme",
      login: "acme-org",
      createdAt: "2012-01-01T00:00:00Z",
      avatarUrl: "https://github.com/acme-org.png",
      isHireable: false,
      followers: {totalCount: null},
      following: {totalCount: null},
      starredRepositories: {totalCount: null},
      watching: {totalCount: null},
      packages: {totalCount: 0},
      sponsorshipsAsMaintainer: {totalCount: 0},
      issueComments: {totalCount: null},
      organizations: {totalCount: null},
      repositories: {totalCount: 0, totalDiskUsage: 0, nodes: []},
      repositoriesContributedTo: {totalCount: null, nodes: []},
      contributionsCollection: {totalRepositoriesWithContributedCommits: null, totalCommitContributions: null, restrictedContributionsCount: null, totalIssueContributions: null, totalPullRequestContributions: null, totalPullRequestReviewContributions: null},
      calendar: {contributionCalendar: {weeks: []}},
    },
    computed: {},
    plugins: {
      isocalendar: {streak: {max: 0, current: 0}, max: 0, average: "0", svg: "<svg></svg>", duration: "half-year", weeks: []},
      calendar: {years: []},
      languages: {unique: 0, sections: ["most-used"], details: [], indepth: false, colors: {}, total: 0, stats: {}, "stats.recent": {}, favorites: [], recent: []},
      followup: {
        sections: ["repositories"],
        issues: {count: 0, open: 0, closed: 0, drafts: 0, skipped: 0, collaborators: {open: 0, closed: 0, drafts: 0, skipped: 0}},
        pr: {count: 0, open: 0, closed: 0, merged: 0, drafts: 0, collaborators: {open: 0, closed: 0, merged: 0, drafts: 0}},
      },
      lines: {sections: ["base", "history"], added: 0, deleted: 0, changed: 0, repos: [], weeks: [], history: null},
    },
  }
}

//Scenarios
const two = build()
merge(two, secondary(), {imports, q, login: "primary"})

const one = build()

const org = build()
merge(org, organization(), {imports, q, login: "primary"})

//Three accounts: the union must accumulate across merges (a later account must not reset what an earlier one added)
function third() {
  const clone = secondary()
  clone.user.login = "third"
  clone.user.repositories = {totalCount: 1, totalDiskUsage: 100, nodes: [repo({owner: "third", name: "z", counts: {stargazers: 11, watchers: 2}, languages: [["Rust", 20, "#dea584"]]})]}
  clone.user.repositoriesContributedTo = {totalCount: 1, nodes: [repo({owner: "shared", name: "repo", languages: [["Go", 10, "#00ADD8"]]})]}
  clone.plugins.languages = {...clone.plugins.languages, unique: 1, colors: {Rust: "#dea584"}, total: 20, stats: {Rust: 20}}
  return clone
}
const three = build()
const merged = {repositories: [], contributed: []}
merge(three, secondary(), {imports, q, login: "primary", merged})
merge(three, third(), {imports, q, login: "primary", merged})

//Live getters: followup counters must still resolve after merge (no assignment to getter-only properties)
const live = {typeError: false, issuesCount: null, issuesOpen: null}
try {
  const data = build()
  merge(data, secondary(), {imports, q, login: "primary"})
  live.issuesCount = data.plugins.followup.issues.count
  live.issuesOpen = data.plugins.followup.issues.open
}
catch (error) {
  live.typeError = `${error.message}`
}

//Output (NaN/Infinity are not valid JSON)
process.stdout.write(JSON.stringify({two, one, org, live, three}, (_, value) => (typeof value === "number") && (!Number.isFinite(value)) ? `${value}` : value))
