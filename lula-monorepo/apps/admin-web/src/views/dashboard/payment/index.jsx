import React, { useState, useMemo, useEffect } from "react";
import Card from "@/components/ui/Card";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import GlobalFilter from "../../../components/shared/GlobalFilter";
import TableBody from "../../../components/shared/TableBody";
import Loading from "../../../components/Loading";
import { formatDate, formatPrice } from "../../../utils/functions";
import TransactionService from "../../../services/TransactionService";
import NoProfile from "../../../assets/images/avatar/NoProfile.webp";
const COLUMNS = [
  {
    Header: "User",
    accessor: "user.name",
    Cell: (row) => {
      return (
        <div className="flex gap-2 items-center">
          <img
            src={row.cell.row.original?.user?.profileUri ? row.cell.row.original?.user?.profileUri : NoProfile}
            className="w-12 h-12 object-cover rounded-full"
            alt={row?.cell?.value}
            onError={(e) => (e.target.src = NoProfile)}
          />{" "}
          {row?.cell?.value}
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
    Header: "Coins",
    accessor: "coins",
    Cell: (row) => {
      return <span>{row?.cell?.value || "---"}</span>;
    },
  },
  {
    Header: "Payment Method",
    accessor: "paymentMethod",
    Cell: (row) => {
      return <span>Visa/MasterCard</span>;
    },
  },
  {
    Header: "created At",
    accessor: "createdAt",
    Cell: (row) => {
      return <span>{formatDate(row?.cell?.value)}</span>;
    },
  },
  {
    Header: "status",
    accessor: "status",
    Cell: (row) => {
      return (
        <span className="block w-full">
          <span
            className={` inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 ${
              row?.cell?.value === "completed" ? "text-success-500 bg-success-500" : ""
            } 
            ${row?.cell?.value === "failed" ? "text-danger-500 bg-danger-500" : ""}
            
             `}
          >
            {row?.cell?.value}
          </span>
        </span>
      );
    },
  },
];

const UserPage = () => {
  const columns = useMemo(() => COLUMNS, []);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const unsubscribe = TransactionService.getTransaction("purchase", (data) => {
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
          <h4 className="card-title">Subscriptions</h4>
          <div className="flex gap-2">
            <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} placeholder="Search Payments..." />
          </div>
        </div>
        <TableBody tableInstance={tableInstance} />
      </Card>
    </Loading>
  );
};

export default UserPage;
