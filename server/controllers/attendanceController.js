import { inngest } from "../inngest/index.js";
import Attendance from "../modals/AttendanceModal.js";
import Employee from "../modals/EmployeeModal.js";

// POST /api/attendance
export const clockInOut = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const employee = await Employee.findOne({ userId: user.userId });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (employee.isDeleted) {
      return res.status(403).json({
        error: "Your account is deactivated. You cannot clock in/out",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    const now = new Date();

    // CHECK IN
    if (!existing) {
      const isLate =
        now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);

      const attendance = await Attendance.create({
        employeeId: employee._id,
        date: today,
        checkIn: now,
        status: isLate ? "LATE" : "PRESENT",
      });

      await inngest.send({
        name: "attendance/checkin",
        data: {
          employeeId: employee._id.toString(),
          attendanceId: attendance._id.toString(),
        },
      });

      return res.json({
        success: true,
        type: "CHECK_IN",
        data: {
          ...attendance.toObject(),
          id: attendance._id.toString(),
        },
      });
    }

    // CHECK OUT
    if (!existing.checkOut) {
      const checkInTime = new Date(existing.checkIn).getTime();
      const diffMs = now.getTime() - checkInTime;
      const diffHours = diffMs / (1000 * 60 * 60);

      existing.checkOut = now;
      existing.workingHours = parseFloat(diffHours.toFixed(2));

      let dayType = "Short Day";
      if (existing.workingHours >= 8) dayType = "Full Day";
      else if (existing.workingHours >= 6) dayType = "Three Quarter Day";
      else if (existing.workingHours >= 4) dayType = "Half Day";

      existing.dayType = dayType;

      await existing.save();

      return res.json({
        success: true,
        type: "CHECK_OUT",
        data: {
          ...existing.toObject(),
          id: existing._id.toString(),
        },
      });
    }

    return res.json({
      success: true,
      type: "ALREADY_DONE",
      data: {
        ...existing.toObject(),
        id: existing._id.toString(),
      },
    });
  } catch (error) {
    console.error("Attendance Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/attendance
export const getAttendance = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const employee = await Employee.findOne({ userId: user.userId });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const limit = parseInt(req.query.limit || 30);

    const history = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    const data = history.map((h) => ({
      ...h,
      id: h._id.toString(),
    }));

    return res.json({
      data,
      employee: { isDeleted: employee.isDeleted },
    });
  } catch (error) {
    console.error("Fetch Attendance Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
