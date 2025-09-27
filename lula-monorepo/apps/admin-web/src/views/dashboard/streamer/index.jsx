import React, { useState, useMemo, useEffect } from "react";
import Card from "@/components/ui/Card";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import GlobalFilter from "../../../components/shared/GlobalFilter";
import TableBody from "../../../components/shared/TableBody";
import Loading from "../../../components/Loading";
import { formatDate } from "../../../utils/functions";
import UserService from "../../../services/UserService";
import ConfirmDialog from "@/components/ui/ConfirmDialog"; // adjust this path if needed

const UserPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsubscribe = UserService.getUser("STREAMER", (fetchedData) => {
      setData(fetchedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async () => {
    if (!selectedUser) return;

    try {
      await UserService.approveUser(selectedUser.id);
      setData((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, status: true } : user
        )
      );
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setShowModal(false);
      setSelectedUser(null);
    }
  };

  const columns = useMemo(() => [
    {
      Header: "User",
      accessor: "name",
      Cell: (row) =>
        row?.cell?.value ? (
          <div className="flex gap-2 items-center">
            <img
              src={row.cell.row.original.profileUri}
              className="w-12 h-12 object-cover rounded-full"
              alt={row?.cell?.value}
            />
            {row?.cell?.value}
          </div>
        ) : (
          <span>---</span>
        ),
    },
    {
      Header: "Phone Number",
      accessor: "phoneNumber",
      Cell: (row) => <span>{row?.cell?.value || "---"}</span>,
    },
    {
      Header: "Gender",
      accessor: "gender",
      Cell: (row) => <span>{row?.cell?.value || "---"}</span>,
    },
    {
      Header: "Birth Date",
      accessor: (info) =>
        info.profileCompleted
          ? `${info.birthDay}-${info.birthMonth}-${info.birthYear}`
          : null,
      Cell: (row) => <span>{row?.cell?.value || "---"}</span>,
    },
    {
      Header: "Created At",
      accessor: "createdAt",
      Cell: (row) => <span>{formatDate(row?.cell?.value)}</span>,
    },
    {
      Header: "Status",
      accessor: (info) => (info.status ? "Public" : "Private"),
      Cell: (row) => (
        <span className="block w-full">
          <span
            className={`inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 ${
              row?.cell?.value === "Public"
                ? "text-success-500 bg-success-500"
                : "text-danger-500 bg-danger-500"
            }`}
          >
            {row?.cell?.value}
          </span>
        </span>
      ),
    },
    {
      Header: "Actions",
      Cell: ({ row }) => {
        const isPrivate = !row.original.status;

        const handleClick = () => {
          setSelectedUser(row.original);
          setShowModal(true);
        };

        return isPrivate ? (
          <button
            onClick={handleClick}
            className="bg-gradient-to-b  from-[#4158D0] to-[#C850C0] text-white px-3 py-1 cursor-pointer rounded hover:bg-primary-600 transition"
          >
            Approve
          </button>
        ) : (
          <span className="text-muted-500 italic">Approved</span>
        );
      },
    },
  ], []);

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
    <>
      <Loading isLoading={isLoading}>
        <Card>
          <div className="md:flex justify-between items-center mb-6">
            <h4 className="card-title">Streamers</h4>
            <div className="flex gap-2">
              <GlobalFilter
                filter={globalFilter}
                setFilter={setGlobalFilter}
                placeholder="Search Streamers..."
              />
            </div>
          </div>
          <TableBody tableInstance={tableInstance} />
        </Card>
      </Loading>

      <ConfirmDialog
        open={showModal}
        title="Approve Streamer"
        message={`Are you sure you want to approve ${selectedUser?.name}?`}
        onCancel={() => setShowModal(false)}
        onConfirm={handleApprove}
      />
    </>
  );
};

export default UserPage;
