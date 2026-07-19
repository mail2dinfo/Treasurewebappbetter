import { useEffect, useState } from "react";
import { useGroupDetailsContext } from "../context/group_context";
import { useCompanySubscriberContext } from "../context/companysubscriber_context";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import { FaMagic } from "react-icons/fa";
import loadingImage from "../images/preloader.gif";
import { ToastContainer, toast } from "react-toastify";

const AddSub = () => {
  const history = useHistory();
  const location = useLocation();
  const { groupId } = useParams();
  const basePath = location.pathname.startsWith('/chit-fund/manager')
    ? '/chit-fund/manager'
    : '/chit-fund/user';
  const {
    data,
    isLoading,
    fetchGroups,
    deleteGroupSubscriber,
    noofCompanySubscriber,
  } = useGroupDetailsContext();

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  const { companySubscribers } = useCompanySubscriberContext();

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    fetchGroups(groupId);
  }, [groupId]);

  // --- Subscriber Counts ---
  const totalSubscribers =
    data?.results?.type === "FIXED"
      ? data?.results?.totalTenture ?? 0
      : data?.results?.noOfSubcribers ?? 0;

  const addedSubscribers = data?.results?.groupSubcriberResult?.length ?? 0;
  const outstandingSubscribers = totalSubscribers - addedSubscribers;

  // Get company subscriber count from context
  const actualCompanySubscriberCount = companySubscribers?.length ?? 0;

  // --- Handlers ---
  const handleOpenPopup = () => setOpen(true);
  const handleAddNewClick = () => {
    history.push(`${basePath}/addgroupsubscriber/${groupId}/addnew`);
    setOpen(false);
  };
  const handleCompanySubscriberClick = () => {
    history.push(`${basePath}/addgroupsubscriber/${groupId}/addcompanysubcriber`);
    setOpen(false);
  };
  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  if (isLoading) {
    return (
      <>
        <img
          src={loadingImage}
          className="loading-img"
          alt="loading"
          style={{ display: "block", margin: "2rem auto" }}
        />
        <div style={{ height: "50vh" }}></div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Header with Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => history.goBack()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
          >
            ← Back
          </button>

          <button
            onClick={handleOpenPopup}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
          >
            + Add {outstandingSubscribers ?? 0} Subscriber
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Subscribers</h1>
          <p className="text-gray-600">Manage group subscribers and add new members</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{totalSubscribers}</div>
          <div className="text-sm font-medium text-gray-600">Total Subscribers</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{addedSubscribers}</div>
          <div className="text-sm font-medium text-gray-600">Added</div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center relative ${outstandingSubscribers > 0 ? 'ring-2 ring-red-200 animate-pulse' : ''}`}>
          {outstandingSubscribers > 0 && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg border animate-bounce">
              🧞 Genie says: Add {outstandingSubscribers} subscriber to complete the group!
            </div>
          )}
          <div className="text-2xl font-bold text-red-600 mb-1 flex items-center justify-center gap-2">
            {outstandingSubscribers}
            {outstandingSubscribers > 0 && <FaMagic className="text-red-500" />}
          </div>
          <div className="text-sm font-medium text-gray-600">Outstanding</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-end mb-6">
        <button
          onClick={toggleViewMode}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
        >
          {viewMode === "grid" ? "📋 List View" : "🔲 Grid View"}
        </button>
      </div>

      {/* Subscribers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Subscribers</h2>

        {data?.results?.groupSubcriberResult?.length > 0 ? (
          <div className={`${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}`}>
            {data?.results?.groupSubcriberResult?.map((sub) => (
              <div
                key={sub.group_subscriber_id}
                className={`bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 ${viewMode === "grid" ? "text-center" : "flex items-center gap-4"
                  }`}
              >
                <div className={`${viewMode === "grid" ? "flex justify-center mb-3" : "flex-shrink-0"}`}>
                  {sub?.user_image_from_s3 ? (
                    <img
                      src={sub.user_image_from_s3}
                      alt={sub.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-semibold text-sm ${sub?.user_image_from_s3 ? 'hidden' : 'flex'
                      }`}
                    style={{
                      backgroundColor: `hsl(${sub.name?.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`
                    }}
                  >
                    {getInitials(sub.name)}
                  </div>
                </div>

                <div className={`${viewMode === "grid" ? "text-center" : "flex-1"}`}>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{sub.name}</h3>
                  <p className="text-xs text-gray-500">{sub.phone || "No phone"}</p>
                </div>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    console.log("Deleting:", sub.group_subscriber_id, groupId);

                    const result = await deleteGroupSubscriber(sub.group_subscriber_id, groupId);

                    if (result.success) {
                      toast.success(result.message);
                      await fetchGroups(groupId);
                    } else {
                      toast.error(result.message);
                    }
                  }}
                  className={`text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200 ${viewMode === "grid" ? "mt-3 mx-auto" : "flex-shrink-0"
                    }`}
                  title="Remove subscriber"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers found</h3>
            <p className="text-gray-500">Start by adding subscribers to this group</p>
          </div>
        )}
      </div>

      {/* Popup Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-6">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
              >
                ×
              </button>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Add Subscribers
                <span className="text-gray-500 font-normal"> ({outstandingSubscribers ?? 0})</span>
              </h3>

              <div className="space-y-3 mt-6">
                <button
                  onClick={handleAddNewClick}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  ➕ Add New Subscriber
                </button>

                <button
                  onClick={handleCompanySubscriberClick}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  🏢 Company Subscribers ({actualCompanySubscriberCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AddSub;
