import React, { useState, useMemo, useEffect } from "react";
import Card from "@/components/ui/Card";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import GlobalFilter from "../../../components/shared/GlobalFilter";
import TableBody from "../../../components/shared/TableBody";
import Loading from "../../../components/Loading";
import { formatDate, formatPrice } from "../../../utils/functions";
import WithdrawService from "../../../services/WithdrawsService";
import NoProfile from "../../../assets/images/avatar/NoProfile.webp";

const COLUMNS = [
    {
        Header: "Streamer",
        accessor: "user.name",
        Cell: (row) => {
            return (
                <div className="flex gap-2 items-center">
                    <img
                        src={row.cell.row.original?.user?.profileUri ? row.cell.row.original?.user?.profileUri : NoProfile}
                        className="w-12 h-12 object-cover rounded-full"
                        alt={row?.cell?.value || "User"}
                        onError={(e) => (e.target.src = NoProfile)}
                    />
                    {row?.cell?.value || "Unknown"}
                </div>
            );
        },
    },
    {
        Header: "Amount",
        accessor: "amount",
        Cell: (row) => {
            return <span>{formatPrice(row?.cell?.value)}</span>;
        },
    },
    {
        Header: "UPI ID",
        accessor: "upiId",
        Cell: (row) => {
            return <span>{row?.cell?.value}</span>;
        },
    },
    {
        Header: "Bank Name",
        accessor: "bankName",
        Cell: (row) => {
            return <span>{row?.cell?.value}</span>;
        },
    },
    {
        Header: "Bank Account",
        accessor: "accountNumber",
        Cell: (row) => {
            return <span>{row?.cell?.value}</span>;
        },
    },
    {
        Header: "IFSC",
        accessor: "ifsc",
        Cell: (row) => {
            return <span>{row?.cell?.value}</span>;
        },
    },
    {
        Header: "Created At",
        accessor: "createdAt",
        Cell: (row) => {
            return <span>{formatDate(row?.cell?.value)}</span>;
        },
    },
    {
        Header: "Status",
        accessor: "status",
        Cell: (row) => {
            return (
                <span className="block w-full">
                    <span
                        className={`inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 ${row?.cell?.value === "completed" ? "text-success-500 bg-success-500" : ""
                            } ${row?.cell?.value === "rejected" ? "text-danger-500 bg-danger-500" : ""
                            } ${row?.cell?.value === "pending" ? "text-warning-500 bg-warning-500" : ""
                            }`}
                    >
                        {row?.cell?.value}
                    </span>
                </span>
            );
        },
    },
    {
        Header: "Actions",
        accessor: "actions",
        Cell: ({ row }) => {
            const handleStatusUpdate = async (status) => {
                try {
                    const res = await WithdrawService.updateWithdrawalStatus(row.original.id, status);
                    if (!res.error) {
                        console.log(`Withdrawal ${row.original.id} marked as ${status}`);
                    } else {
                        console.error("Error updating status:", res.message);
                    }
                } catch (error) {
                    console.error("Error updating status:", error);
                }
            };

            return (
                <div className="flex gap-2">
                    {row.original.status === "pending" && (
                        <>
                            <button
                                className="px-3 py-1 bg-success-500 text-white rounded"
                                onClick={() => handleStatusUpdate("completed")}
                            >
                                Paid
                            </button>
                            <button
                                className="px-3 py-1 bg-danger-500 text-white rounded"
                                onClick={() => handleStatusUpdate("rejected")}
                            >
                                Reject
                            </button>
                        </>
                    )}
                </div>
            );
        },
    },
];

const UserPage = () => {
    const columns = useMemo(() => COLUMNS, []);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState([]);

    useEffect(() => {
        console.log("Fetching withdrawals using getAllWithdrawals");
        const unsubscribe = WithdrawService.getAllWithdrawals((data) => {
            console.log("Withdrawals data received:", data);
            setData(data);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const tableInstance = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter,
        useSortBy,
        usePagination,
        useRowSelect
    );

    const { state, setGlobalFilter } = tableInstance;
    const { globalFilter } = state;

    return (
        <Loading isLoading={isLoading}>
            <Card>
                <div className="md:flex justify-between items-center mb-6">
                    <h4 className="card-title">Withdrawal Requests</h4>
                    <div className="flex gap-2">
                        <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} placeholder="Search Withdrawals..." />
                    </div>
                </div>
                <TableBody tableInstance={tableInstance} />
            </Card>
        </Loading>
    );
};

export default UserPage;