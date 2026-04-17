import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../modals/AttendanceModal.js";
import Employee from "../modals/EmployeeModal.js";
import LeaveApplication from "../modals/LeaveApplicationModal.js";
import Payslip from "../modals/PayslipModal.js";

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ================= ADMIN DASHBOARD =================
    if (user.role === "ADMIN") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(24, 0, 0, 0);

      const [totalEmployees, todayAttendance, pendingLeaves] =
        await Promise.all([
          Employee.countDocuments({ isDeleted: { $ne: true } }),
          Attendance.countDocuments({
            date: {
              $gte: startOfToday,
              $lt: endOfToday,
            },
          }),
          LeaveApplication.countDocuments({ status: "PENDING" }),
        ]);

      return res.json({
        role: "ADMIN",
        totalEmployees,
        totalDepartments: DEPARTMENTS.length,
        todayAttendance,
        pendingLeaves,
      });
    }

    // ================= EMPLOYEE DASHBOARD =================
    const employee = await Employee.findOne({
      userId: user.userId,
    }).lean();

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [currentMonthAttendance, pendingLeaves, latestPayslip] =
      await Promise.all([
        Attendance.countDocuments({
          employeeId: employee._id,
          date: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        }),
        LeaveApplication.countDocuments({
          employeeId: employee._id,
          status: "PENDING",
        }),
        Payslip.findOne({ employeeId: employee._id })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    return res.json({
      role: "EMPLOYEE",
      employee: { ...employee, id: employee._id.toString() },
      currentMonthAttendance,
      pendingLeaves,
      latestPayslip: latestPayslip
        ? { ...latestPayslip, id: latestPayslip._id.toString() }
        : null,
    });
  } catch (error) {
    console.error("Dashboard Error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
