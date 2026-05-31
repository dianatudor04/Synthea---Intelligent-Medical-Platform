import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Star,
  Stethoscope,
  Languages,
  MapPin,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { useAuth } from '../../../lib/auth';
import { doctorsApi, reviewsApi, appointmentsApi } from '../../../lib/services';
import { ApiRequestError } from '../../../lib/api';
import { Appointment, Review } from '../../../lib/types';

type DoctorWithReviews = Awaited<ReturnType<typeof doctorsApi.get>>;

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export function PatientDoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const reviewAppointmentId = searchParams.get('reviewAppointmentId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState<DoctorWithReviews | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewAppt, setReviewAppt] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load doctor + reviews
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [doc, reviewsRes] = await Promise.all([
          doctorsApi.get(id!),
          reviewsApi.byDoctor(id!, { page: 1, limit: 50 }),
        ]);
        if (cancelled) return;
        setDoctor(doc);
        setReviews(reviewsRes.data);
      } catch {
        if (!cancelled) setError('Could not load doctor profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load the specific appointment that the patient wants to review
  useEffect(() => {
    if (!reviewAppointmentId) {
      setReviewAppt(null);
      return;
    }
    let cancelled = false;
    appointmentsApi
      .get(reviewAppointmentId)
      .then((a) => !cancelled && setReviewAppt(a))
      .catch(() => !cancelled && setReviewAppt(null));
    return () => {
      cancelled = true;
    };
  }, [reviewAppointmentId]);

  const canReview = useMemo(() => {
    if (!reviewAppt || submitSuccess) return false;
    if (reviewAppt.status !== 'COMPLETED') return false;
    if (reviewAppt.review) return false;
    // Sanity check: the appointment's doctor must match this profile
    if (id && reviewAppt.doctor?.doctorProfile?.id && reviewAppt.doctor.doctorProfile.id !== id) {
      return false;
    }
    return true;
  }, [reviewAppt, submitSuccess, id]);

  const handleSubmit = async () => {
    if (!reviewAppt) return;
    if (rating < 1) {
      setSubmitError('Please choose a rating between 1 and 5 stars.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await reviewsApi.create({
        appointmentId: reviewAppt.id,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitSuccess(true);
      setRating(0);
      setComment('');
      // Refresh doctor (avg rating + count) and the reviews list
      if (id) {
        const [doc, reviewsRes] = await Promise.all([
          doctorsApi.get(id),
          reviewsApi.byDoctor(id, { page: 1, limit: 50 }),
        ]);
        setDoctor(doc);
        setReviews(reviewsRes.data);
      }
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#3A7BD5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#3A7BD5]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-red-600">{error ?? 'Doctor not found'}</p>
      </div>
    );
  }

  const initials = `${doctor.user?.firstName?.[0] ?? 'D'}${doctor.user?.lastName?.[0] ?? ''}`;
  const fullName = `Dr. ${doctor.user?.firstName ?? ''} ${doctor.user?.lastName ?? ''}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA]/30 via-white to-[#E8F5E9]/30">
      <div className="max-w-3xl mx-auto p-6 space-y-6 pb-24 lg:pb-6">
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#3A7BD5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        {/* ── Doctor header card ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 lg:p-8 border-0 shadow-lg rounded-3xl">
            <div className="flex flex-col lg:flex-row gap-6">
              <Avatar className="w-20 h-20 lg:w-24 lg:h-24 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] text-white text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{fullName}</h1>
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <Stethoscope className="w-4 h-4" />
                  <span>{doctor.specialty}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {doctor.avgRating ? (
                    <div className="flex items-center gap-2">
                      <StarRow rating={doctor.avgRating} />
                      <span className="font-semibold text-gray-900">
                        {doctor.avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">({doctor.totalReviews} reviews)</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No reviews yet</span>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {doctor.consultationFee} {doctor.currency} / consult
                  </span>
                </div>

                {doctor.bio && <p className="text-sm text-gray-600 mt-4">{doctor.bio}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-sm">
                  {doctor.yearsOfExperience !== null && doctor.yearsOfExperience !== undefined && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-[#3A7BD5]" />
                      <span>{doctor.yearsOfExperience} years of experience</span>
                    </div>
                  )}
                  {doctor.languages?.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Languages className="w-4 h-4 text-[#3A7BD5]" />
                      <span>{doctor.languages.join(', ')}</span>
                    </div>
                  )}
                  {doctor.clinicAddress && (
                    <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-[#3A7BD5]" />
                      <span>{doctor.clinicAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Review form ────────────────────────────────────────── */}
        {canReview && reviewAppt && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-6 border-0 shadow-lg rounded-3xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Write your review</h2>
              <p className="text-sm text-gray-500 mb-5">
                For your appointment on{' '}
                <span className="font-medium text-gray-700">
                  {new Date(reviewAppt.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </p>

              {submitError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{submitError}</div>
              )}

              <div className="mb-5">
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
                          className={`w-9 h-9 ${
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

              <div className="mb-5">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this doctor..."
                  rows={5}
                  maxLength={2000}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#3A7BD5] outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{comment.length}/2000</p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || rating < 1}
                className="w-full sm:w-auto h-11 px-6 bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 rounded-xl"
              >
                {submitting ? 'Submitting...' : 'Submit review'}
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Success banner (shown after submission, replaces the form) */}
        {submitSuccess && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 border-0 shadow-md rounded-3xl bg-green-50">
              <div className="flex items-center gap-3 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Thanks! Your review has been published below.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* If the user came in with a reviewAppointmentId but it's not eligible */}
        {reviewAppointmentId && reviewAppt && !canReview && !submitSuccess && (
          <Card className="p-5 border-0 shadow-md rounded-3xl bg-amber-50">
            <p className="text-sm text-amber-800">
              {reviewAppt.review
                ? "You've already reviewed this appointment."
                : reviewAppt.status !== 'COMPLETED'
                ? 'You can only review appointments that have been finalized.'
                : "This appointment can't be reviewed."}
            </p>
          </Card>
        )}

        {/* ── Reviews list ───────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 border-0 shadow-lg rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Patient reviews ({doctor.totalReviews ?? reviews.length})
              </h2>
            </div>

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet — be the first!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => {
                  const patientName = review.patient?.user
                    ? `${review.patient.user.firstName} ${review.patient.user.lastName.charAt(0)}.`
                    : 'Anonymous';
                  const isMine = user?.id && review.patient?.user && user.firstName === review.patient.user.firstName && user.lastName === review.patient.user.lastName;
                  return (
                    <div
                      key={review.id}
                      className={`p-4 rounded-2xl ${
                        isMine ? 'bg-[#E6F0FA]/40 border border-[#3A7BD5]/20' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {patientName}
                            {isMine && <span className="ml-2 text-xs text-[#3A7BD5]">(you)</span>}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <StarRow rating={review.rating} />
                      </div>
                      {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
