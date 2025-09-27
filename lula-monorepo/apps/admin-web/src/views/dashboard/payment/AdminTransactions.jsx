import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AdminService from "../../../services/AdminService";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Pagination from "../../../components/ui/Pagination";
import Textinput from "../../../components/ui/Textinput";
import Select from "../../../components/ui/Select";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successRate: 0,
    averageAmount: 0
  });

  useEffect(() => {
    loadTransactions();
    loadSummary();
  }, [pagination.page, filters]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await AdminService.getTransactions(params);
      if (!response.error) {
        setTransactions(response.data.transactions || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        }));
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      // Calculate summary from transactions
      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalTransactions = transactions.length;
      const completedTransactions = transactions.filter(t => t.status === 'completed').length;
      const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;
      const averageAmount = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      setSummary({
        totalRevenue,
        totalTransactions,
        successRate,
        averageAmount
      });
    } catch (error) {
      console.error("Failed to calculate summary:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'purchase': return 'bg-blue-100 text-blue-800';
      case 'call_deduction': return 'bg-purple-100 text-purple-800';
      case 'commission': return 'bg-green-100 text-green-800';
      case 'refund': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodBadgeColor = (method) => {
    switch (method) {
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'upi': return 'bg-purple-100 text-purple-800';
      case 'wallet': return 'bg-green-100 text-green-800';
      case 'bank_transfer': return 'bg-gray-100 text-gray-800';
      case 'razorpay': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'User', 'Type', 'Amount', 'Status', 'Payment Method', 'Date'];
    const csvData = transactions.map(t => [
      t._id?.slice(-8) || 'N/A',
      t.userId?.name || 'Unknown',
      t.type || 'N/A',
      t.amount || 0,
      t.status || 'N/A',
      t.paymentMethod || 'N/A',
      t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transactions Management</h1>
        <div className="flex space-x-2">
          <Button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700"
          >
            Export CSV
          </Button>
          <div className="text-sm text-gray-600">
            Total: {pagination.total} transactions
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalRevenue)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalTransactions}
            </div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {summary.successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.averageAmount)}
            </div>
            <div className="text-sm text-gray-600">Average Amount</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Textinput
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="h-10"
          />

          <Select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="h-10"
          >
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="call_deduction">Call Deduction</option>
            <option value="commission">Commission</option>
            <option value="refund">Refund</option>
          </Select>

          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="h-10"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Select
            value={filters.paymentMethod}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            className="h-10"
          >
            <option value="">All Methods</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Wallet</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="razorpay">Razorpay</option>
          </Select>

          <Textinput
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="h-10"
            placeholder="Start Date"
          />

          <Textinput
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="h-10"
            placeholder="End Date"
          />

          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="h-10"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="amount-desc">Amount High to Low</option>
            <option value="amount-asc">Amount Low to High</option>
          </Select>

          <Button
            onClick={() => {
              setFilters({
                type: '',
                status: '',
                paymentMethod: '',
                startDate: '',
                endDate: '',
                search: '',
                sortBy: 'createdAt',
                sortOrder: 'desc'
              });
            }}
            className="bg-gray-600 hover:bg-gray-700 h-10"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{transaction._id?.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.userId?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.userId?.phoneNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getTypeBadgeColor(transaction.type)}>
                        {transaction.type?.toUpperCase() || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusBadgeColor(transaction.status)}>
                        {transaction.status?.toUpperCase() || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getPaymentMethodBadgeColor(transaction.paymentMethod)}>
                        {transaction.paymentMethod?.toUpperCase() || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminTransactions;
