import { Download, IndianRupee } from "lucide-react";
import { format } from "date-fns";

const PayslipList = ({ payslips, isAdmin }) => {
  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Basic Salary</th>
              <th className="px-6 py-4">Net Salary</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
                  className="text-center py-12 text-slate-400"
                >
                  No payslips Found
                </td>
              </tr>
            ) : (
              payslips.map((payslip) => {
                return (
                  <tr key={payslip._id || payslip.id}>
                    {isAdmin && (
                      <td className="text-slate-900">
                        {payslip.employee?.firstName}
                        {payslip.employee?.lastName}
                      </td>
                    )}

                    <td className="text-slate-500">
                      {format(
                        new Date(payslip.year, payslip.month - 1),
                        "MMM yyyy",
                      )}
                    </td>

                    <td className="text-slate-500">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {formatNumber(payslip.basicSalary)}
                      </div>
                    </td>

                    <td className="text-slate-800">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {formatNumber(payslip.netSalary)}
                      </div>
                    </td>

                    <td className="text-center">
                      <button
                        onClick={() =>
                          window.open(
                            `/print/payslips/${payslip.id || payslip._id}`,
                          )
                        }
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors ring-1 ring-blue-600/10"
                      >
                        <Download className="w-3 h-3 mr-1.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayslipList;
