import Employee from "../modals/EmployeeModal.js";
import User from "../modals/UserModal.js";
import bcrypt from "bcrypt";

// GET /api/employee
export const getEmployee = async (req, res) => {
  try {
    const { department } = req.query;

    const where = {};
    if (department) where.department = department;

    const employees = await Employee.find(where)
      .sort({ createdAt: -1 }) // ✅ FIXED
      .populate("userId", "email role")
      .lean();

    const result = employees.map((emp) => ({
      ...emp,
      id: emp._id.toString(),
      user: emp.userId
        ? { email: emp.userId.email, role: emp.userId.role }
        : null,
    }));

    return res.json(result);
  } catch (error) {
    console.error("GET EMPLOYEE ERROR:", error); // ✅ debug
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/employee
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      basicSalary,
      allowances,
      deductions,
      joinDate,
      password,
      role,
      bio,
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      // ✅ FIXED (User, not user)
      email,
      password: hashed,
      role: role || "EMPLOYEE",
    });

    const employee = await Employee.create({
      userId: user._id,
      firstName,
      lastName,
      email,
      phone,
      position,
      department: department || "Engineering",
      basicSalary: Number(basicSalary) || 0,
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      bio: bio || "",
    });

    return res.status(201).json({ success: true, employee });
  } catch (error) {
    console.error("CREATE EMPLOYEE ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email Already Exists" });
    }
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/employee/:id
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      basicSalary,
      allowances,
      deductions,
      password,
      role,
      bio,
      employmentStatus,
    } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not Found" });
    }

    await Employee.findByIdAndUpdate(id, {
      firstName,
      lastName,
      email,
      phone,
      position,
      department: department || "Engineering",
      basicSalary: Number(basicSalary) || 0,
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      employmentStatus: employmentStatus || "ACTIVE",
      bio: bio || "",
    });

    const userUpdate = { email };
    if (role) userUpdate.role = role;
    if (password) userUpdate.password = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(employee.userId, userUpdate); // ✅ FIXED

    return res.json({ success: true });
  } catch (error) {
    console.error("UPDATE EMPLOYEE ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email Already Exists" });
    }
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/employee/:id/delete
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    employee.isDeleted = true;
    employee.employmentStatus = "INACTIVE"; // ✅ FIXED typo
    await employee.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE EMPLOYEE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};
