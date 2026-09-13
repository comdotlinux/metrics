/**Mocked data */
export default async function({faker, token}, target, that, args) {
  console.debug("metrics/compute/mocks > mocking rest api result > users/getAuthenticated")
  const t = token ?? ""
  const login = t === "MOCKED_TOKEN" ? (process.env.GITHUB_REPOSITORY?.split("/")[0] ?? "octocat") : t.replace(/^MOCKED_TOKEN_?/, "").toLocaleLowerCase() || faker.internet.userName()
  return {status: 200, data: {login}}
}
