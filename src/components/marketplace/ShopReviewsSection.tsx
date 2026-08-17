import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, CheckCircle2, MessageSquare, Send, UserCheck, Sparkles, Edit3 } from "lucide-react";
import { toast } from "sonner";

export interface ShopReview {
  id: string;
  shop_id: string;
  customer_id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  visit_confirmed: boolean;
  merchant_reply?: string;
  created_at: string;
}

interface ShopReviewsSectionProps {
  shopId: string;
  shopName: string;
  googleRating?: number;
  googleTotalReviews?: number;
}

export function ShopReviewsSection({
  shopId,
  shopName,
  googleRating = 4.2,
  googleTotalReviews = 35,
}: ShopReviewsSectionProps) {
  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [hasCompletedReservation, setHasCompletedReservation] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<ShopReview | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);

      // Check current logged in user
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        if (mounted) setCurrentUser(auth.user);

        // Check if user has a completed reservation at this shop
        const { data: resData } = await (supabase as any)
          .from("reservations")
          .select("id, status")
          .eq("customer_id", auth.user.id)
          .eq("shop_id", shopId)
          .eq("status", "completed");

        if (resData && resData.length > 0 && mounted) {
          setHasCompletedReservation(true);
        }
      }

      // Fetch in-app shop reviews from Supabase
      try {
        const { data: revList, error } = await (supabase as any)
          .from("shop_reviews")
          .select("*")
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false });

        if (!error && revList && mounted) {
          setReviews(revList);

          // Find if current user already submitted a review
          if (auth?.user) {
            const existing = revList.find((r: ShopReview) => r.customer_id === auth.user.id);
            if (existing) {
              setUserReview(existing);
              setRating(existing.rating);
              setComment(existing.comment || "");
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching shop_reviews:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [shopId]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please sign in to submit a review for this shop.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewerName =
        currentUser.user_metadata?.display_name ||
        currentUser.email?.split("@")[0] ||
        "Verified Customer";

      const reviewData = {
        shop_id: shopId,
        customer_id: currentUser.id,
        reviewer_name: reviewerName,
        rating,
        comment: comment.trim() || null,
        visit_confirmed: hasCompletedReservation,
        updated_at: new Date().toISOString(),
      };

      if (userReview?.id) {
        // Edit existing review
        const { error } = await (supabase as any)
          .from("shop_reviews")
          .update(reviewData)
          .eq("id", userReview.id);

        if (error) throw error;
        toast.success("Your review has been updated!");
      } else {
        // Insert new review
        const { data: inserted, error } = await (supabase as any)
          .from("shop_reviews")
          .insert(reviewData)
          .select()
          .single();

        if (error) throw error;
        setUserReview(inserted);
        toast.success("Thank you! Your review was submitted successfully.");
      }

      // Refresh reviews list
      const { data: revList } = await (supabase as any)
        .from("shop_reviews")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (revList) setReviews(revList);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate In-App stats
  const inAppTotal = reviews.length;
  const inAppAvg =
    inAppTotal > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / inAppTotal).toFixed(1) : "0.0";
  const verifiedCount = reviews.filter((r) => r.visit_confirmed).length;

  return (
    <div className="space-y-6 pt-4 border-t border-border">
      {/* Blended Rating Banner */}
      <div className="bg-surface-elevated border border-border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h4 className="font-mono text-xs uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            Customer Ratings & Trust Signals
          </h4>
          <h3 className="text-xl font-bold text-foreground tracking-tight">{shopName}</h3>
        </div>

        {/* Dual Rating Badges: Synthetix In-App + Google Ratings */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Synthetix In-App Rating Badge */}
          <div className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-2xl flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-mono font-bold text-base text-foreground">
                {inAppTotal > 0 ? inAppAvg : "New"}
              </span>
            </div>
            <div className="text-left border-l border-accent/20 pl-2">
              <p className="text-[10px] font-mono font-bold text-accent">Synthetix Reviews</p>
              <p className="text-[10px] text-muted-foreground">
                {inAppTotal} reviews ({verifiedCount} Verified)
              </p>
            </div>
          </div>

          {/* Google Places Rating Badge */}
          <div className="px-4 py-2 bg-secondary border border-border rounded-2xl flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-mono font-bold text-base text-foreground">
                {googleRating.toFixed(1)}
              </span>
            </div>
            <div className="text-left border-l border-border pl-2">
              <p className="text-[10px] font-mono font-bold text-muted-foreground">Google Places</p>
              <p className="text-[10px] text-muted-foreground">{googleTotalReviews} reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Form for Authenticated Users */}
      <div className="bg-surface-elevated border border-border/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Edit3 className="size-4 text-accent" />
            {userReview ? "Edit Your Review" : "Rate Your Experience"}
          </h4>

          {hasCompletedReservation && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              Verified Visit Customer
            </span>
          )}
        </div>

        <form onSubmit={handleSubmitReview} className="space-y-3">
          {/* Interactive Star Selector */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform focus:outline-none"
              >
                <Star
                  className={`size-6 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted border-border"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 font-mono text-xs font-bold text-accent">
              {hoverRating || rating} / 5 Stars
            </span>
          </div>

          {/* Comment Box */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details of your experience, product quality, or store service..."
            rows={3}
            className="w-full p-3 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              {!currentUser ? "Sign in to submit your review" : "Honest in-app customer feedback"}
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !currentUser}
              className="px-4 py-2 bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="size-3.5" />
              <span>{isSubmitting ? "Saving..." : userReview ? "Update Review" : "Post Review"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Customer Reviews List */}
      <div className="space-y-3">
        <h4 className="font-mono text-xs uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
          <UserCheck className="size-3.5" />
          Community Reviews & Merchant Responses ({reviews.length})
        </h4>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground font-mono">
            Loading reviews...
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-secondary/30 border border-border/70 rounded-2xl space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-accent/20 text-accent font-bold font-mono flex items-center justify-center text-xs">
                      {rev.reviewer_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">{rev.reviewer_name}</span>
                      {rev.visit_confirmed && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-500" />
                          Verified Store Visit
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-xs text-foreground">{rev.rating}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-muted-foreground leading-relaxed pl-9 italic">
                    "{rev.comment}"
                  </p>
                )}

                {/* Merchant Reply Thread */}
                {rev.merchant_reply && (
                  <div className="ml-9 p-3 bg-accent/10 border border-accent/20 rounded-xl space-y-1 text-xs">
                    <span className="font-mono text-[10px] font-bold text-accent flex items-center gap-1">
                      <MessageSquare className="size-3" /> Merchant Official Response:
                    </span>
                    <p className="text-foreground text-xs leading-relaxed">{rev.merchant_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-surface-elevated border border-border rounded-2xl text-center text-xs text-muted-foreground">
            No in-app reviews submitted yet. Be the first customer to leave a review!
          </div>
        )}
      </div>
    </div>
  );
}
