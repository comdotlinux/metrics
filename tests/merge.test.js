//Imports
const {spawnSync} = require("child_process")
const path = require("path")

//Run fixtures (see tests/merge.fixtures.mjs for the hand-written primary/secondary/organization data)
const run = spawnSync("node", ["tests/merge.fixtures.mjs"], {cwd: path.join(__dirname, ".."), encoding: "utf8", maxBuffer: 64 * 1024 * 1024})
if (run.status !== 0)
  throw new Error(`tests/merge.fixtures.mjs exited with ${run.status}\n${run.stderr}`)
const {two, one, org, live} = JSON.parse(run.stdout)

const PALETTE = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]
const days = weeks => weeks.flatMap(({contributionDays}) => contributionDays)

describe("Multi-account merge", () => {
  test("user counters are summed", () => {
    expect(two.user.followers.totalCount).toBe(513 + 74)
    expect(two.user.following.totalCount).toBe(10 + 5)
    expect(two.user.starredRepositories.totalCount).toBe(20 + 3)
    expect(two.user.watching.totalCount).toBe(4 + 1)
    expect(two.user.packages.totalCount).toBe(1 + 0)
    expect(two.user.sponsorshipsAsSponsor.totalCount).toBe(2 + 1)
    expect(two.user.sponsorshipsAsMaintainer.totalCount).toBe(0 + 1)
    expect(two.user.issueComments.totalCount).toBe(30 + 7)
    expect(two.user.organizations.totalCount).toBe(2 + 1)
    expect(two.user.repositories.totalCount).toBe(4)
    expect(two.user.repositories.totalDiskUsage).toBe(1500)
    expect(two.user.contributionsCollection).toMatchObject({totalCommitContributions: 140, restrictedContributionsCount: 7, totalIssueContributions: 11, totalPullRequestContributions: 10, totalPullRequestReviewContributions: 3})
    expect(two.computed.commits).toBe(140 + 7)
  })

  test("header calendar strip is summed on primary dates, recolored and trimmed to 14 days", () => {
    const strip = days(two.user.calendar.contributionCalendar.weeks)
    expect(strip.find(({date}) => date === "2026-09-07").contributionCount).toBe(3 + 4)
    expect(strip.find(({date}) => date === "2026-08-24").contributionCount).toBe(1)
    expect(strip.find(({date}) => date === "2026-09-14")).toBeUndefined()
    expect(two.computed.calendar).toHaveLength(14)
    expect(two.computed.calendar.at(-1).date).toBe("2026-09-13")
    expect(two.computed.calendar.find(({date}) => date === "2026-09-06").contributionCount).toBe(2)
    expect(two.computed.calendar.find(({date}) => date === "2026-09-14")).toBeUndefined()
    for (const {color} of two.computed.calendar)
      expect(PALETTE).toContain(color)
    expect(two.computed.calendar.find(({date}) => date === "2026-09-07").color).toBe("#216e39")
    expect(two.computed.calendar.find(({contributionCount}) => contributionCount === 0).color).toBe("#ebedf0")
  })

  test("isocalendar streaks, max, average and svg are recomputed over summed days", () => {
    const iso = two.plugins.isocalendar
    expect(iso.streak.max).toBe(5)
    expect(iso.max).toBe(7)
    expect(iso.average).toBe("0.62")
    expect(iso.svg).toMatch(/^\s*<svg/)
    expect(iso.weeks).toHaveLength(3)
    expect(days(iso.weeks).find(({date}) => date === "2026-09-07")).toMatchObject({contributionCount: 7, color: "#216e39"})
  })

  test("calendar years are summed, appended and sorted newest first", () => {
    const {years} = two.plugins.calendar
    expect(years.map(({year}) => year)).toEqual([2026, 2025, 2024])
    const y2026 = days(years[0].weeks)
    expect(y2026.find(({date}) => date === "2026-09-07").contributionCount).toBe(7)
    expect(y2026.find(({date}) => date === "2026-09-10").contributionCount).toBe(2)
    expect(days(years[2].weeks).map(({contributionCount}) => contributionCount)).toEqual([1, 0, 0, 0, 0, 0, 3])
    for (const {color} of years.flatMap(({weeks}) => days(weeks)))
      expect(PALETTE).toContain(color)
  })

  test("repositories are unioned transiently without leaking secondary names", () => {
    expect(two.computed.repositories).toEqual({watchers: 8, stargazers: 37, issues_open: 6, issues_closed: 6, pr_open: 3, pr_closed: 3, pr_merged: 8, forks: 3, forked: 1, releases: 3, deployments: 1, environments: 1})
    expect(two.computed.licenses.used).toEqual({MIT: 2, "Apache-2.0": 1})
    expect(two.computed.diskUsage).toBe("1.50 MB")
    expect(two.user.repositories.nodes).toHaveLength(2)
    expect(two.user.repositories.nodes.map(({owner: {login}}) => login)).toEqual(["primary", "primary"])
    const json = JSON.stringify(two)
    expect(json).not.toContain("secondary/")
    expect(json).not.toContain("\"login\":\"secondary\"")
    expect(two.user.accounts).toBeUndefined()
  })

  test("contributed repositories totals are corrected for overlap", () => {
    expect(two.user.repositoriesContributedTo.totalCount).toBe(3 + 2 - 1)
    expect(two.user.repositoriesContributedTo.nodes).toHaveLength(2)
    expect(two.user.contributionsCollection.totalRepositoriesWithContributedCommits).toBe(2 + 2 - 1)
  })

  test("languages bytes are summed and favorites re-formatted", () => {
    const lang = two.plugins.languages
    expect(lang.stats).toEqual({JavaScript: 300, CSS: 100, Python: 50})
    expect(lang.total).toBe(450)
    expect(lang.colors.Python).toBe("#3572A5")
    //JavaScript, CSS, Python, Go, Ruby, Shell over the union of repositories + contributed nodes
    expect(lang.unique).toBe(6)
    expect(lang.favorites.map(({name}) => name)).toEqual(["JavaScript", "CSS", "Python"])
    expect(Math.abs(lang.favorites.reduce((sum, {value}) => sum + value, 0) - 1)).toBeLessThan(1e-9)
    for (let i = 1; i < lang.favorites.length; i++)
      expect(lang.favorites[i - 1].size).toBeGreaterThanOrEqual(lang.favorites[i].size)
  })

  test("followup data counters are summed while getters and indepth stay primary", () => {
    const f = two.plugins.followup
    expect(f.issues).toMatchObject({drafts: 1, skipped: 2, collaborators: {open: 3, closed: 2, drafts: 0, skipped: 1}})
    expect(f.pr).toMatchObject({drafts: 1, collaborators: {open: 3, closed: 0, merged: 3, drafts: 0}})
    expect(f.user.issues).toEqual({count: 12, open: 4, closed: 6, drafts: 1, skipped: 1})
    expect(f.user.pr).toEqual({count: 15, open: 3, closed: 3, merged: 8, drafts: 1})
    expect(f.indepth).toEqual(one.plugins.followup.indepth)
    expect(live.typeError).toBe(false)
    expect(live.issuesOpen).toBe(6)
    expect(live.issuesCount).toBe(6 + 6 + 1 + 2)
  })

  test("lines totals and weeks are summed, history regenerated, repos stay primary", () => {
    const l = two.plugins.lines
    expect(l).toMatchObject({added: 110, deleted: 55, changed: 11})
    expect(l.weeks).toEqual([
      {date: "2026-08-30", added: 60, deleted: 20, changed: 5},
      {date: "2026-09-06", added: 50, deleted: 35, changed: 6},
      {date: "2026-09-13", added: 7, deleted: 1, changed: 0},
    ])
    expect(l.history).toMatch(/^<svg/)
    expect(l.repos).toEqual(one.plugins.lines.repos)
  })

  test("organization clone (null counters, empty lists) merges as a no-op", () => {
    expect(org.user.followers.totalCount).toBe(513)
    expect(org.user.repositories.totalCount).toBe(2)
    expect(org.plugins.isocalendar).toEqual(one.plugins.isocalendar)
    expect(org.plugins.calendar).toEqual(one.plugins.calendar)
    expect(org.plugins.languages.total).toBe(300)
    expect(org).toEqual(one)
  })

  test("untouched primary fixture has the expected baseline", () => {
    expect(one.user.login).toBe("primary")
    expect(one.user.followers.totalCount).toBe(513)
    expect(one.user.repositories.totalCount).toBe(2)
    expect(one.computed.repositories.stargazers).toBe(30)
    expect(one.plugins.isocalendar.streak.max).toBe(3)
    expect(one.plugins.languages.total).toBe(300)
    expect(one.plugins.lines.added).toBe(100)
    expect(JSON.stringify(one)).not.toContain("secondary")
  })
})
