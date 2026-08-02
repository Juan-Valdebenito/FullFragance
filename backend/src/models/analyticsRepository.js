const { query } = require("../data/pgDatabase");

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function monthKey(value = new Date()) {
  return dateKey(value).slice(0, 7);
}

async function recordPageView(page) {
  await query("INSERT INTO analytics_events (event_type, page) VALUES ($1, $2)", ["page_view", page]);
}

async function getDashboardMetrics() {
  const now = new Date();
  const today = dateKey(now);
  const weekAgo = new Date(now);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
  weekAgo.setUTCHours(0, 0, 0, 0);

  const [userResult, eventResult, revenueResult] = await Promise.all([
    query("SELECT created_at FROM users"),
    query("SELECT page, occurred_at FROM analytics_events WHERE occurred_at >= $1 ORDER BY occurred_at ASC", [weekAgo.toISOString()]),
    query("SELECT value FROM app_metadata WHERE key = $1", [`ad_revenue:${monthKey(now)}`]),
  ]);

  const users = userResult.rows || [];
  const events = eventResult.rows || [];
  const dayKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekAgo);
    date.setUTCDate(weekAgo.getUTCDate() + index);
    return dateKey(date);
  });
  const viewsByDay = new Map(dayKeys.map(day => [day, 0]));
  const pages = new Map();

  for (const event of events) {
    const day = dateKey(event.occurred_at);
    viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1);
    pages.set(event.page, (pages.get(event.page) || 0) + 1);
  }

  const revenue = Math.max(0, Number(revenueResult.rows?.[0]?.value || 0));
  return {
    users: {
      total: users.length,
      newToday: users.filter(user => dateKey(user.created_at) === today).length,
      newLast7Days: users.filter(user => dateKey(user.created_at) >= dayKeys[0]).length,
    },
    views: {
      today: viewsByDay.get(today) || 0,
      last7Days: events.length,
      series: dayKeys.map(day => ({ date: day, views: viewsByDay.get(day) || 0 })),
      topPages: [...pages.entries()]
        .sort((first, second) => second[1] - first[1])
        .slice(0, 5)
        .map(([page, views]) => ({ page, views })),
    },
    ads: {
      currentMonth: monthKey(now),
      revenueCLP: Number.isFinite(revenue) ? Math.round(revenue) : 0,
      source: "manual",
      connected: false,
    },
  };
}

async function setReportedAdRevenue(revenue) {
  const key = `ad_revenue:${monthKey()}`;
  await query(
    "INSERT INTO app_metadata (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [key, String(Math.round(revenue))]
  );
}

module.exports = { recordPageView, getDashboardMetrics, setReportedAdRevenue };
