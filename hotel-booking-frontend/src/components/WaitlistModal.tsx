import { useState } from "react";
import { useMutation } from "react-query";
import * as apiClient from "../api-client";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import useAppContext from "../hooks/useAppContext";
import {
  AlertTriangle,
  Clock,
  Loader2,
  Mail,
} from "lucide-react";

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  hotelName: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomCount?: number;
}

const WaitlistModal = ({
  open,
  onOpenChange,
  hotelId,
  hotelName,
  checkInDate,
  checkOutDate,
  roomCount = 1,
}: WaitlistModalProps) => {
  const { showToast } = useAppContext();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const joinWaitlistMutation = useMutation(
    ({ hotelId, checkIn, checkOut, roomCount }: {
      hotelId: string;
      checkIn: string;
      checkOut: string;
      roomCount: number;
    }) =>
      apiClient.joinWaitlist(hotelId, {
        checkIn,
        checkOut,
        roomCount,
        email,
        phone,
      }),
    {
      onSuccess: () => {
        showToast({
          title: "Added to Waitlist",
          description: `You've been added to the waitlist for ${hotelName}. We'll notify you when rooms become available.`,
          type: "SUCCESS",
        });
        onOpenChange(false);
        setEmail("");
        setPhone("");
      },
      onError: (error: any) => {
        showToast({
          title: "Waitlist Failed",
          description: error?.response?.data?.message || "Failed to join waitlist. Please try again.",
          type: "ERROR",
        });
      },
    }
  );

  const handleConfirmWaitlist = () => {
    if (!email) {
      showToast({
        title: "Missing Email",
        description: "Please provide an email address to join the waitlist.",
        type: "ERROR",
      });
      return;
    }

    joinWaitlistMutation.mutate({
      hotelId,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      roomCount,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-night-800 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            Join Waitlist
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            All rooms at{" "}
            <span className="text-white font-medium">{hotelName}</span>
            {" "}are booked for your selected dates. Join the waitlist to be
            notified if a room becomes available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              <strong>How it works:</strong> If a booking is cancelled, we'll
              automatically notify you via email so you can book the room before
              someone else does.
            </p>
          </div>

          <div className="space-y-3 bg-night-900/50 rounded-lg p-4 border border-white/10">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              Your Search
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-400">Check-in</p>
                <p className="text-white font-medium">
                  {checkInDate.toDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Check-out</p>
                <p className="text-white font-medium">
                  {checkOutDate.toDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Rooms</p>
                <p className="text-white font-medium">{roomCount}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-night-900 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-gray-300">Phone Number (optional)</Label>
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-night-900 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-400 text-xs">
              We'll send you notifications when rooms become available. You can
              manage your preferences anytime.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setEmail("");
              setPhone("");
            }}
            className="border-white/20 text-gray-300 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmWaitlist}
            disabled={joinWaitlistMutation.isLoading || !email}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {joinWaitlistMutation.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Join Waitlist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;
