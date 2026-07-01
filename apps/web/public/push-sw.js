self.addEventListener("push", (event) => {
  const fallback = {
    title: "HearthShelf",
    body: "You have a new update.",
    url: "/dashboard",
  }
  const data = event.data ? event.data.json() : fallback

  event.waitUntil(
    self.registration.showNotification(data.title || fallback.title, {
      body: data.body || fallback.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: {
        url: data.url || fallback.url,
      },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/dashboard"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
