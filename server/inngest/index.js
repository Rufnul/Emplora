import { Inngest } from "inngest";
import Attendance from "../modals/AttendanceModal.js";
import Employee from "../modals/EmployeeModal.js";
import LeaveApplication from "../modals/LeaveApplicationModal.js";
import sendEmail from "../config/nodeMailer.js";

// Create a client
export const inngest = new Inngest({ id: "emplora" });

// -------------------------------
// Leave Reminder Function
// -------------------------------
const leaveApplicationReminder = inngest.createFunction(
  {
    id: "leave-application-reminder",
    triggers: [{ event: "leave/pending" }],
  },
  async ({ event, step }) => {
    const { leaveApplicationId } = event.data;

    await step.sleepUntil(
      "wait-for-24-hours",
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );

    const leaveApplication =
      await LeaveApplication.findById(leaveApplicationId);

    if (leaveApplication?.status === "PENDING") {
      const employee = await Employee.findById(leaveApplication.employeeId);

      // send email
      await sendEmail({
        to: employee.email,
        subject: "Attendance check-out remainder",
        body: `<div style="max-width: 600px;">
    <h2>Hi ${employee.firstName}, </h2>
    <p style="font-size: 16px;">You have a check-in in ${employee.department} today: </p>
    <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">
        ${attendance?.checkIn?.toLocaleString()}</p>
    <p style="font-size: 16px;">Please make sure to check-out in one hour.</p>
    <p style="font-size: 16px;">If you have any questions, Please contacr your Admin.</p>
    <br />
    <p style="font-size: 16px;">Best Regards,</p>
    <p style="font-size: 16px;">Emplora</p>
</div>`,
      });
    }
  },
);

// -------------------------------
// Auto Checkout Function
// -------------------------------
const autoCheckOut = inngest.createFunction(
  {
    id: "auto-check-out",
    triggers: [{ event: "employee/check-out" }],
  },
  async ({ event, step }) => {
    const { employeeId, attendanceId } = event.data;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) return;

    const checkInTime = new Date(attendance.checkIn).getTime();

    await step.sleepUntil(
      "wait-for-9-hours",
      new Date(checkInTime + 9 * 60 * 60 * 1000),
    );

    let updatedAttendance = await Attendance.findById(attendanceId);

    if (!updatedAttendance?.checkOut) {
      await step.sleepUntil(
        "wait-for-10-hours",
        new Date(checkInTime + 10 * 60 * 60 * 1000),
      );

      updatedAttendance = await Attendance.findById(attendanceId);

      if (!updatedAttendance?.checkOut) {
        updatedAttendance.checkOut = new Date(checkInTime + 4 * 60 * 60 * 1000);
        updatedAttendance.workingHours = 4;
        updatedAttendance.dayType = "Half Day";
        updatedAttendance.status = "LATE";

        await updatedAttendance.save();
      }
    }
  },
);

// -------------------------------
// Attendance Reminder Cron
// -------------------------------
const attendanceReminderCron = inngest.createFunction(
  {
    id: "attendance-reminder-cron",
    triggers: [{ cron: "TZ=Asia/Kolkata 30 11 * * *" }],
    // 6 AM UTC = 11:30 AM IST
  },
  async ({ step }) => {
    const today = await step.run("get-today-date", () => {
      const now = new Date();

      const start = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      );
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      return {
        startUTC: start.toISOString(),
        endUTC: end.toISOString(),
      };
    });

    // get all active employees (non-deleted)
    const activeEmployees = await step.run("get-run-employees", async () => {
      const employees = await Employee.find({
        isDeleted: false,
        employmentStatus: "ACTIVE",
      }).lean();
      return employees.map((e) => ({
        _id: e._id.toString(),
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        department: e.department,
      }));
    });

    //get employee id on approved leave today
    const onLeaveIds = await step.run("get-on-leave-ids", async () => {
      const leaves = await LeaveApplication.find({
        status: "APPROVED",
        startDate: { $lte: new Date(today.endUTC) },
        endDate: { $lte: new Date(today.startUTC) },
      }).lean();
      return leaves.map((l) => l.employeeId.toString());
    });

    //get employee ids who already checked in today
    const attendance = await step.run("get-checked-in-ids", async () => {
      const attendance = await Attendance.find({
        date: { $gte: new Date(today.startUTC), $lt: new Date(today.endUTC) },
      }).lean();
      return attendance.map((a) => a.employeeId.toString());
    });

    // filter absent employees
    const absentEmployees = activeEmployees.filter(
      (emp) => !onLeaveIds.includes(emp._id) && !checkInIds.includes(emp._id),
    );

    //send reminder emails

    if (absentEmployees.length > 0) {
      await step.run("send-reminder-emails", async () => {
        const emailPromises = absentEmployees.map((emp) => {
          // send mail
        });
      });
    }
    return {
      totalActive: activeEmployees.length,
      onLeave: onLeaveIds.length,
      checkIns: checkedInIds.length,
      absend: absentEmployees.length,
    };
  },
);

// Export functions
export const functions = [
  autoCheckOut,
  leaveApplicationReminder,
  attendanceReminderCron,
];
