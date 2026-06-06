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
