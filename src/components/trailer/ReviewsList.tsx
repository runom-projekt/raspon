import Image from "next/image";
import { Rating } from "@/components/ui/Rating";
import { formatDate } from "@/lib/utils";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  author: { firstName: string; lastName: string; avatarUrl: string | null };
}

export function ReviewsList({
  reviews,
  averageRating,
  reviewCount,
}: {
  reviews: ReviewItem[];
  averageRating: number;
  reviewCount: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="font-display text-xl font-bold text-graphite-900">Bewertungen</h2>
        <Rating value={averageRating} reviewCount={reviewCount} />
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-graphite-500">Dieser Anhänger hat noch keine Bewertungen.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-graphite-100 p-5">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-graphite-100">
                  {review.author.avatarUrl ? (
                    <Image src={review.author.avatarUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-semibold text-graphite-500">
                      {review.author.firstName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-graphite-900">
                    {review.author.firstName} {review.author.lastName.charAt(0)}.
                  </p>
                  <p className="text-xs text-graphite-400">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              <Rating value={review.rating} className="mt-3" />
              {review.comment && <p className="mt-2 text-sm text-graphite-600">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
