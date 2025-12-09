import { useForm } from "react-hook-form";
import { PaymentIntentResponse, UserType } from "../../../../shared/types";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import useSearchContext from "../../hooks/useSearchContext";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import * as apiClient from "../../api-client";
import useAppContext from "../../hooks/useAppContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  User,
  Phone,
  MessageSquare,
  CreditCard,
  Shield,
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import WaitlistModal from "../../components/WaitlistModal";
import { Calendar, Users, DollarSign, Loader2 } from "lucide-react";

type Props = {
  currentUser: UserType;
  paymentIntent: PaymentIntentResponse;
  hotelName?: string;
};

export type BookingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  roomCount: number;
  checkIn: string;
  checkOut: string;
  hotelId: string;
  paymentIntentId: string;
  totalCost: number;
  specialRequests?: string;
};

const BookingForm = ({ currentUser, paymentIntent, hotelName = "Hotel" }: Props) => {
  const stripe = useStripe();
  const elements = useElements();

  const search = useSearchContext();
  const { hotelId } = useParams();
  const navigate = useNavigate();

  const { showToast } = useAppContext();

  // Use local state for form fields to prevent losing data
  const [phone, setPhone] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState<{ reason?: string; waitlistEntry?: any } | null>(null);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);

  const { mutate: bookRoom, isLoading } = useMutation(
    apiClient.createRoomBooking,
    {
      onSuccess: () => {
        showToast({
          title: "Booking Successful",
          description: "Your hotel booking has been confirmed successfully!",
          type: "SUCCESS",
        });
        setConfirmDialogOpen(false);
        setPendingFormData(null);

        // Navigate to My Bookings page after a short delay
        setTimeout(() => {
          navigate("/my-bookings");
        }, 1500);
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        const reason = errorData?.reason;
        
        // Check if it's an availability error with waitlist option
        if (reason === "booked_out" && errorData?.waitlistEntry) {
          setBookingError({
            reason: "booked_out",
            waitlistEntry: errorData.waitlistEntry,
          });
          // Show waitlist modal automatically
          setWaitlistModalOpen(true);
        } else if (reason === "maintenance") {
          showToast({
            title: "Hotel Under Maintenance",
            description: "This hotel is under maintenance during your selected dates. Please choose different dates.",
            type: "ERROR",
          });
          setConfirmDialogOpen(false);
        } else {
          showToast({
            title: "Booking Failed",
            description: errorData?.message || "There was an error processing your booking. Please try again.",
            type: "ERROR",
          });
        }
        setConfirmDialogOpen(false);
      },
    }
  );

  const { handleSubmit, register } = useForm<BookingFormData>({
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      adultCount: search.adultCount,
      childCount: search.childCount,
      roomCount: search.roomCount || 1,
      checkIn: search.checkIn.toISOString(),
      checkOut: search.checkOut.toISOString(),
      hotelId: hotelId,
      totalCost: paymentIntent.totalCost,
      paymentIntentId: paymentIntent.paymentIntentId,
    },
    mode: "onChange",
    shouldUnregister: false,
  });

  const handleCopyCredentials = async () => {
    const credentials = `Card: 4242 4242 4242 4242
MM/YY: 12/35 CVC: 123`;

    try {
      await navigator.clipboard.writeText(credentials);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy credentials:", err);
    }
  };

  const onSubmit = async (formData: BookingFormData) => {
    // Show confirmation dialog before processing payment
    setPendingFormData({
      ...formData,
      phone,
      specialRequests,
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!stripe || !elements || !pendingFormData) {
      return;
    }

    setConfirmDialogOpen(false);
    const completeFormData = pendingFormData;

    const result = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement) as StripeCardElement,
      },
    });

    if (result.paymentIntent?.status === "succeeded") {
      bookRoom({
        ...completeFormData,
        paymentIntentId: result.paymentIntent.id,
      });
    } else {
      showToast({
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again.",
        type: "ERROR",
      });
    }
  };

  return (
    <>
      <div className="p-6">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-white">
          <User className="h-6 w-6 text-brand-400" />
          Confirm Your Details
        </CardTitle>
        <p className="text-gray-400 mt-2">
          Please review and complete your booking information
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-brand-400" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  First Name
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  className="bg-night-900/50 border-white/10 text-gray-400"
                  {...register("firstName")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  Last Name
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  className="bg-night-900/50 border-white/10 text-gray-400"
                  {...register("lastName")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  Email
                </Label>
                <Input
                  type="email"
                  readOnly
                  disabled
                  className="bg-night-900/50 border-white/10 text-gray-400"
                  {...register("email")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone (Optional)
                </Label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="bg-night-900 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-brand-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-400" />
              Special Requests (Optional)
            </h3>

            <div className="space-y-2">
              <textarea
                rows={4}
                placeholder="Any special requests, preferences, or additional information..."
                className="w-full rounded-md border border-white/10 bg-night-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Let us know if you have any special requirements or preferences
                for your stay.
              </p>
            </div>
          </div>

          {/* Price Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-400" />
              Price Summary
            </h3>

            <div className="bg-night-900/50 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">Total Cost</span>
                <span className="text-2xl font-bold text-brand-400">
                  £{paymentIntent.totalCost.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Includes taxes and charges
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-400" />
              Payment Details
            </h3>

            <div className="border border-white/10 rounded-lg p-4 bg-night-900">
              <CardElement
                id="payment-element"
                className="text-sm"
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#ffffff",
                      "::placeholder": {
                        color: "#6b7280",
                      },
                    },
                    invalid: {
                      color: "#ef4444",
                    },
                  },
                }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Shield className="h-3 w-3 text-green-500" />
              Your payment information is secure and encrypted
            </div>
          </div>

          {/* Test Credentials Note */}
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-500 mb-2">
                    For Testing Purpose
                  </h4>
                  <p className="text-sm text-yellow-200/80 mb-3">
                    You can use these dummy credentials to complete checkout and
                    see the booking status page, analytical page, or other pages
                    to see the interactive results:
                  </p>
                  <div className="bg-night-900 border border-yellow-700/30 rounded-md p-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-mono text-gray-300">
                        <div>Card: 4242 4242 4242 4242</div>
                        <div>MM/YY: 12/35 CVC: 123 ZIP: 12345</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 rounded transition-colors duration-200"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              disabled={isLoading}
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Review & Book
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Trust Indicators */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              Secure Payment
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Instant Confirmation
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-green-500" />
              24/7 Support
            </div>
          </div>
        </div>










      </CardContent>
    </div>

    {/* Booking Confirmation Dialog */}
    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <DialogContent className="bg-night-800 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-400">
            <CheckCircle className="h-5 w-5" />
            Confirm Your Booking
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Please review the booking details before proceeding
          </DialogDescription>
        </DialogHeader>

        {pendingFormData && (
          <div className="space-y-4 py-4">
            {/* Booking Summary */}
            <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Hotel</span>
                <span className="text-white font-medium">{hotelName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-in
                </span>
                <span className="text-white font-medium">
                  {new Date(pendingFormData.checkIn).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-out
                </span>
                <span className="text-white font-medium">
                  {new Date(pendingFormData.checkOut).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-gray-400">Rooms</span>
                <span className="text-white font-medium">{pendingFormData.roomCount}</span>
              </div>
            </div>

            {/* Guest Details */}
            <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Guests
                </span>
                <span className="text-white font-medium">
                  {pendingFormData.adultCount} adult{pendingFormData.adultCount !== 1 ? 's' : ''}
                  {pendingFormData.childCount > 0 && `, ${pendingFormData.childCount} child${pendingFormData.childCount !== 1 ? 'ren' : ''}`}
                </span>
              </div>
            </div>

            {/* Price Summary */}
            <div className="space-y-3 p-4 rounded-xl bg-brand-900/30 border border-brand-500/30">
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-lg">
                <span className="text-white font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-brand-400" />
                  Total Amount
                </span>
                <span className="text-brand-400 font-bold text-lg">£{pendingFormData.totalCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-400">
                  <p className="font-medium">Cancellation Policy</p>
                  <p className="text-yellow-300/80 mt-1">Free cancellation up to 48 hours before check-in.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setConfirmDialogOpen(false)}
            className="border-white/20 text-white hover:bg-white/10"
            disabled={isLoading}
          >
            Edit Details
          </Button>
          <Button
            onClick={handleConfirmBooking}
            disabled={isLoading}
            className="bg-brand-500 hover:bg-brand-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm & Pay
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Waitlist Modal for Unavailable Dates */}
    <WaitlistModal
      open={waitlistModalOpen}
      onOpenChange={setWaitlistModalOpen}
      hotelId={hotelId || ""}
      hotelName={hotelName}
      checkInDate={search.checkIn}
      checkOutDate={search.checkOut}
      roomCount={pendingFormData?.roomCount || 1}
    />
    </>
  );
};

export default BookingForm;
