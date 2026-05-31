import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { reviewsApi } from '../../../lib/services';
import { ApiRequestError } from '../../../lib/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  doctorName: string;
  onSubmitted?: () => void;
}

export function ReviewModal({ isOpen, onClose, appointmentId, doctorName, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please choose a rating between 1 and 5 stars.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reviewsApi.create({
        appointmentId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted?.();
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Leave a review</h2>
                <p className="text-white/80 text-sm mt-0.5">For {doctorName}</p>
              </div>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Your rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = n <= (hoverRating || rating);
                    return (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Very good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="comment" className="text-sm font-medium text-gray-700 block mb-2">
                  Comment (optional)
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this doctor..."
                  rows={4}
                  maxLength={2000}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#3A7BD5] outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{comment.length}/2000</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || rating < 1}
                  className="flex-1 bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
