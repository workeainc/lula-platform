import React, { useState, useMemo, useEffect } from "react";
import Card from "@/components/ui/Card";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import GlobalFilter from "../../../components/shared/GlobalFilter";
import TableBody from "../../../components/shared/TableBody";
import Loading from "../../../components/Loading";
import { formatDate } from "../../../utils/functions";
import AccountService from "../../../services/AccountService";
import { useSelector } from "react-redux";
import AddButton from "../../../components/ui/AddButton";
import ActionButton from "../../../components/ui/ActionButton copy";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const COLUMNS = [
  {
    Header: "Name",
    accessor: "name",
    Cell: (row) => {
      return <span> {row?.cell?.value}</span>;
    },
  },
  {
    Header: "Email",
    accessor: "email",
    Cell: (row) => {
      return <span>{row?.cell?.value || "---"}</span>;
    },
  },
  {
    Header: "Phone Number",
    accessor: "phone",
    Cell: (row) => {
      return <span>{row?.cell?.value || "---"}</span>;
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
    accessor: (info) => (info.status ? "Public" : "Private"),
    Cell: (row) => {
      return (
        <span className="block w-full">
          <span
            className={` inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 ${
              row?.cell?.value === "Public" ? "text-success-500 bg-success-500" : ""
            } 
            ${row?.cell?.value === "Private" ? "text-danger-500 bg-danger-500" : ""}
            
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
    const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth);
  const columns = useMemo(() => COLUMNS, []);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const unsubscribe = AccountService.getAccount((data) => {
      setData(data.filter((item) => item.id !== user.id));
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user.id]);

  const handleStatusChange = async (id, status) => {
    try {
      const data = await AccountService.updateStatus(id, !status);
      if (!data.error) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      handleError(error);
    }
  };


  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        ...columns,
        {
          Header: "action",
          accessor: "action",
          Cell: ({ row }) => {
            return (
              <div className="flex space-x-3 rtl:space-x-reverse">
                <ActionButton
                  title={row.original.status ? "Private" : "Public"}
                  icon={row.original.status ? "solar:lock-outline" : "mynaui:lock-open"}
                  onClick={() => handleStatusChange(row.original.id, row.original.status)}
                />
                <ActionButton
                  title={"Edit Account"}
                  icon={"mdi:edit"}
                  onClick={() => navigate(`${row.original.id}/edit`)}
                />
              </div>
            );
          },
        },
      ]);
    }
  );

  const { state, setGlobalFilter } = tableInstance;
  const { globalFilter } = state;

  return (
    <Loading isLoading={isLoading}>
      <Card>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">Admin Account</h4>
          <div className="flex gap-2">
            <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} placeholder="Search Users..." />
            <AddButton />
          </div>
        </div>
        <TableBody tableInstance={tableInstance} />
      </Card>
    </Loading>
  );
};

export default UserPage;
