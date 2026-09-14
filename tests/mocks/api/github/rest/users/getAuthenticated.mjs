/**Mocked data */
export default async function({faker, token}, target, that, args) {
  console.debug("metrics/compute/mocks > mocking rest api result > users/getAuthenticated")
  const t = `${token ?? ""}`
  //Only harness tokens resolve: anything else fails like the unmocked call did, so callers fall back to the repository owner and no token can reach data
  if (!/^MOCKED_TOKEN(_\w+)?$/.test(t))
    throw Object.assign(new Error("Bad credentials"), {status: 401})
  const login = t === "MOCKED_TOKEN" ? (process.env.GITHUB_REPOSITORY?.split("/")[0] ?? "octocat") : t.replace(/^MOCKED_TOKEN_/, "").toLocaleLowerCase() || faker.internet.userName()
  return {status: 200, data: {login}}
}
