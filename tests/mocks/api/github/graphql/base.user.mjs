/**Mocked data */
export default function({faker, query, login = faker.internet.userName()}) {
  console.debug("metrics/compute/mocks > mocking graphql api result > base/user")
  if (login === "fail")
    throw new Error("mocked base failure")
  return ({
    user: {
      databaseId: faker.number.int(10000000),
      name: faker.person.fullName(),
      login,
      createdAt: `${faker.date.past({years: 10})}`,
      avatarUrl: faker.image.urlLoremFlickr({category: "people"}),
      websiteUrl: faker.internet.url(),
      twitterUsername: login,
    },
  })
}
