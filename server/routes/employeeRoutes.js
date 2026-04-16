import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  updateEmployee,
} from "../controllers/employeeController.js";
import { protect, protectAdmin } from "../Middleware/authMiddleware.js";

const employeeRouter = Router();

employeeRouter.get("/", getEmployee, protect, protectAdmin);
employeeRouter.post("/", createEmployee, protect, protectAdmin);
employeeRouter.put("/:id", updateEmployee, protect, protectAdmin);
employeeRouter.delete("/:id", deleteEmployee, protect, protectAdmin);

export default employeeRouter;
