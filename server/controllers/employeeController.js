import Employee from "../modals/EmployeeModal.js";
import bcrypt from "bcrypt";

// get employees
// GET /api/employee

export const getEmployee = async (req, res) => {
  try {
    const { department } = req.query;
    const where = {};
    if (department) where.department = department;

    const employees = (await Employee.find(where))
      .toSorted({ createdAt: -1 })
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
    return res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// create Employee
// POST /api/employees

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
    const user = await user.create({
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
      deductions: Number(deductions),
      joinDate: new Date(joinDate),
      bio: bio || "",
    });

    return res.status(201).json({ success: true, employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email Already Exists" });
    }
    console.log("Create employee error:", error);
    return res.status(500).json({ error: "Failed to create employee" });
  }
};

// update Employee
// POST /api/employees/:id

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
      deductions: Number(deductions),
      employmentStatus: employmentStatus || "ACTIVE",
      bio: bio || "",
    });

    // update user record
    const userUpdate = { email };
    if (role) userUpdate.role = role;
    if (password) userUpdate.password = await bcrypt.hash(password, 10);
    await UserActivation.findByIdAndUpdate(employee.userId, userUpdate);

    return res.json({ success: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email Already Exists" });
    }
    return res.status(500).json({ error: "Failed to create employee" });
  }
};

// delete Employee
// POST /api/employees/:id

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    employee.isDeleted = true;
    employee.employementStatus = "INACTIVE";
    await employee.save();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete employee" });
  }
};
