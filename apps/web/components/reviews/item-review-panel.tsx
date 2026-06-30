"use client"

import { useState } from "react"
import { removeReview, saveReview } from "@/lib/actions/reviews"
import type { ItemReview } from "@/lib/queries/reviews"
import { btnDanger, btnPrimary, inputClass, labelClass } from "@/components/ui/classes"

interface ItemReviewPanelProps {
  lendableItemId: string
  returnPath: string
  review: ItemReview | null
}

export function ItemReviewPanel({ lendableItemId, returnPath, review }: ItemReviewPanelProps) {
  const [rating, setRating] = useState(review?.rating ?? 0)

  return (
    <section className="mt-6 border-t border-edge pt-6">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-ink">Your review</h2>
        {review ? (
          <p className="text-sm text-ink-muted">Rated {review.rating} out of 5.</p>
        ) : (
          <p className="text-sm text-ink-muted">Add a personal rating and notes for this item.</p>
        )}
      </div>

      <form action={saveReview} className="flex max-w-xl flex-col gap-3">
        <input type="hidden" name="lendableItemId" value={lendableItemId} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <input type="hidden" name="rating" value={rating || ""} />

        <div className="flex flex-col gap-1">
          <span className={labelClass}>Rating</span>
          <div
            className="flex gap-1"
            role="radiogroup"
            aria-label="Rating"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} out of 5`}
                onClick={() => setRating(value)}
                className={`rounded-md px-1 text-3xl leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  value <= rating ? "text-accent" : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-muted">
            {rating ? `${rating} out of 5` : "No rating selected"}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="body">Notes</label>
          <textarea
            id="body"
            name="body"
            rows={4}
            defaultValue={review?.body ?? ""}
            placeholder="What did you think?"
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimary}>
            {review ? "Update review" : "Save review"}
          </button>
        </div>
      </form>

      {review && (
        <form action={removeReview} className="mt-2">
          <input type="hidden" name="lendableItemId" value={lendableItemId} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <button type="submit" className={btnDanger}>
            Remove review
          </button>
        </form>
      )}
    </section>
  )
}
