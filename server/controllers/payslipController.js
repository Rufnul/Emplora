import Employee from "../modals/EmployeeModal.js";
import Payslip from "../modals/PayslipModal.js";

// POST /api/payslips
export const createPayslip = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions } =
      req.body;

    if (!employeeId || !month || !year || !basicSalary) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const netSalary =
      Number(basicSalary) + Number(allowances || 0) - Number(deductions || 0);

    const payslip = await Payslip.create({
      employeeId,
      month: Number(month),
      year: Number(year),
      basicSalary: Number(basicSalary),
      allowances: Number(allowances || 0),
      deductions: Number(deductions || 0),
      netSalary,
    });

    return res.json({ success: true, data: payslip });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/payslips
export const getPayslips = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isAdmin = user.role === "ADMIN";

    if (isAdmin) {
      const payslips = await Payslip.find()
        .populate("employeeId")
        .sort({ createdAt: -1 });

      const data = payslips.map((p) => {
        const obj = p.toObject();
        return {
          ...obj,
          id: obj._id.toString(),
          employee: obj.employeeId,
          employeeId: obj.employeeId?._id?.toString(),
        };
      });

      return res.json({ data });
    }

    const employee = await Employee.findOne({ userId: user.userId });

    if (!employee) {
      return res.status(404).json({ error: "Not found" });
    }

    const payslips = await Payslip.find({ employeeId: employee._id }).sort({
      createdAt: -1,
    });

    return res.json({ data: payslips });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payslip = await Payslip.findById(req.params.id)
      .populate("employeeId")
      .lean();

    if (!payslip) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({
      ...payslip,
      id: payslip._id.toString(),
      employee: payslip.employeeId,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
