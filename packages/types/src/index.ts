export interface Book {
  id: string
  userId: string
  isbn: string | null
  title: string
  authors: string | null
  description: string | null
  coverUrl: string | null
  createdAt: Date
}

export interface Contact {
  id: string
  userId: string
  name: string
  email: string | null
  phone: string | null
  createdAt: Date
}

export interface Checkout {
  id: string
  bookId: string
  userId: string
  contactId: string | null
  checkedOutAt: Date
  dueDate: Date | null
  returnedAt: Date | null
  notes: string | null
}

export interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export type ItemType = "book" | "movie" | "game"

export interface MobileUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export interface MobileBook {
  id: string
  userId: string
  isbn: string | null
  title: string
  authors: string | null
  seriesKey: string | null
  seriesName: string | null
  seriesPosition: number | null
  seriesTotal: number | null
  description: string | null
  coverUrl: string | null
  genre: string | null
  createdAt: string
  lendableItemId: string | null
  isCheckedOut: boolean
}

export interface MobileMovie {
  id: string
  userId: string
  title: string
  seriesName: string | null
  director: string | null
  year: number | null
  posterUrl: string | null
  format: string | null
  genre: string | null
  runtime: number | null
  description: string | null
  createdAt: string
  lendableItemId: string | null
  isCheckedOut: boolean
}

export interface MobileGame {
  id: string
  userId: string
  title: string
  coverUrl: string | null
  minPlayers: number | null
  maxPlayers: number | null
  ageRating: string | null
  genre: string | null
  description: string | null
  createdAt: string
  lendableItemId: string | null
  isCheckedOut: boolean
}

export type MobileShelfItem =
  | (MobileBook & { type: "book" })
  | (MobileMovie & { type: "movie" })
  | (MobileGame & { type: "game" })

export interface MobileContact {
  id: string
  userId: string
  name: string
  email: string | null
  phone: string | null
  linkedUserId: string | null
  createdAt: string
}

export interface MobileCheckoutItem {
  id: string
  type: ItemType
  title: string
  coverUrl: string | null
}

export interface MobileCheckout {
  id: string
  checkedOutAt: string
  returnedAt?: string
  dueDate: string | null
  notes: string | null
  item: MobileCheckoutItem
  contact: { id: string; name: string } | null
}

export interface MobileShelfEventItem {
  id: string
  type: ItemType
  title: string
  subtitle: string | null
}

export interface MobileShelfEvent {
  id: string
  userId: string
  title: string
  type: "book_club" | "movie_night" | "game_night"
  startsAt: string
  recurrence: "none" | "weekly" | "monthly"
  notes: string | null
  createdAt: string
  items: MobileShelfEventItem[]
}

export interface MobileDashboardStats {
  totalBooks: number
  totalMovies: number
  totalGames: number
  checkedOutNow: number
  overdue: number
  totalContacts: number
}

export interface MobileActivityEvent {
  checkoutId: string
  type: "checkout" | "return"
  itemId: string
  itemType: ItemType
  itemTitle: string
  contactName: string | null
  at: string
}

export interface MobileDashboard {
  stats: MobileDashboardStats
  recentActivity: MobileActivityEvent[]
}

export interface MobileCollections {
  authors: Array<{ key: string; label: string; count: number }>
  series: Array<{ key: string; label: string; count: number }>
  movieSeries: Array<{ key: string; label: string; count: number }>
  gameGenres: Array<{ key: string; label: string; count: number }>
}

export interface MobileReview {
  id: string
  lendableItemId: string
  userId: string
  rating: number
  body: string | null
  createdAt: string
  updatedAt: string
}
