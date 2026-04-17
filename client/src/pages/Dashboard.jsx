import React, { useState, useEffect } from "react";
import Loading from "../components/Loading";
import EmployeeDashboard from "../components/EmployeeDashboard";
import AdminDashboard from "../components/AdminDashboard";
import api from "../api/axios";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard");
        if (isMounted) setData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.error || err?.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <Loading />;

  if (!data) {
    return (
      <p className="text-center text-slate-500 py-12">
        Failed to load Dashboard
      </p>
    );
  }

  return data.role === "ADMIN" ? (
    <AdminDashboard data={data} />
  ) : (
    <EmployeeDashboard data={data} />
  );
};

export default Dashboard;
