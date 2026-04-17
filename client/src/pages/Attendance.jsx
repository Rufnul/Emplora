import { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import api from "../api/axios";
import { toast } from "react-hot-toast";

const Attendance = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/attendance");

      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setHistory([...data]); // force re-render with new reference
      setIsDeleted(Boolean(res.data?.employee?.isDeleted));
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Loading />;

  // ✅ SAFE LOCAL DATE NORMALIZATION (FIXED)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecord = history.find((r) => {
    if (!r?.date) return false;

    const recordDate = new Date(r.date);
    recordDate.setHours(0, 0, 0, 0);

    return recordDate.getTime() === today.getTime();
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p>Track your work hour and daily check-ins</p>
      </div>

      {isDeleted ? (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p className="text-rose-600">
            You cannot clock in or out because your employee record is
            deactivated.
          </p>
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 z-50">
          <CheckInButton todayRecord={todayRecord} onAction={fetchData} />
        </div>
      )}

      <AttendanceStats history={history} />
      <AttendanceHistory history={history} />
    </div>
  );
};

export default Attendance;
