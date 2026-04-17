import { Loader2Icon, LogInIcon, LogOutIcon } from "lucide-react";
import React, { useState } from "react";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const CheckInButton = ({ todayRecord, onAction }) => {
  const [loading, setLoading] = useState(false);

  const handleAttendance = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await api.post("/attendance");
      await onAction();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false);
    }
  };

  const checkIn = todayRecord?.checkIn;
  const checkOut = todayRecord?.checkOut;

  const isCheckedIn = Boolean(checkIn && !checkOut);
  const isCompleted = Boolean(checkOut);

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Workday Completed</h3>
        <p className="text-slate-500 text-sm mt-1">
          Great Job! See You Tomorrow
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleAttendance}
        disabled={loading}
        className={`w-full max-w-xs flex justify-between items-center gap-8 p-4 rounded-xl text-white transition
          ${
            isCheckedIn
              ? "bg-gradient-to-br from-slate-700 to-slate-900"
              : "bg-gradient-to-br from-indigo-600 to-indigo-700"
          }`}
      >
        {loading ? (
          <Loader2Icon className="size-7 animate-spin" />
        ) : isCheckedIn ? (
          <LogOutIcon className="size-7" />
        ) : (
          <LogInIcon className="size-7" />
        )}

        <div className="flex flex-col items-center text-center">
          <h2 className="text-lg font-medium mb-1">
            {loading ? "Processing..." : isCheckedIn ? "Clock Out" : "Clock In"}
          </h2>
          <p className="text-xs opacity-80">
            {isCheckedIn ? "Click to end your shift" : "Start your work day"}
          </p>
        </div>
      </button>
    </div>
  );
};

export default CheckInButton;
