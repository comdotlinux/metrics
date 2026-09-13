/**Mocked data */
export default function({faker, query, login = faker.internet.userName()}) {
  console.debug("metrics/compute/mocks > mocking graphql api result > base/user")
  //Generate 15 sequential days (oldest first) ending today, split in 5/7/3-day weeks
  const days = Array.from({length: 15}, (_, i) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - 14 + i)
    const contributionCount = Math.min(10, Math.max(0, faker.number.int(14) - 4))
    return {
      date: date.toISOString().substring(0, 10),
      contributionCount,
      color: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"][Math.ceil(contributionCount / 10 / 0.25)],
    }
  })
  return ({
    user: {
      calendar: {
        contributionCalendar: {
          weeks: [
            {contributionDays: days.slice(0, 5)},
            {contributionDays: days.slice(5, 12)},
            {contributionDays: days.slice(12, 15)},
          ],
        },
      },
    },
  })
}
