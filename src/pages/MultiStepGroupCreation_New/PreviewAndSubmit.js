import React, { useContext, useEffect, useState, useMemo } from "react";
import AppContext from "./Context";
import { API_BASE_URL } from "../../utils/apiConfig";
import { useHistory } from "react-router-dom";
import { useUserContext } from "../../context/user_context";
import { usePlatformAccess } from "../../context/platformAccess_context";
import { v4 as uuidv4 } from "uuid";

export default function PreviewAndSubmit() {
  const { groupDetails } = useContext(AppContext);
  const myContext = useContext(AppContext);
  const updateContext = myContext.groupDetails;

  const history = useHistory();
  const { isLoggedIn, user, userRole } = useUserContext();
  const platform = usePlatformAccess();

  const [membershipId, setMembershipId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Company parent membership — products are owned by the company, not the manager's personal membership
  useEffect(() => {
    const userAccounts = user?.results?.userAccounts || [];
    const resolvedMembershipId =
      platform?.activeContext?.parentMembershipId
      ?? userAccounts.find((account) => account?.parent_membership_id)?.parent_membership_id
      ?? userAccounts[0]?.parent_membership_id
      ?? userAccounts[0]?.membershipId
      ?? "";
    setMembershipId(resolvedMembershipId ? String(resolvedMembershipId) : "");
  }, [user, platform?.activeContext?.parentMembershipId]);

  // Fetch filtered products from database
  const fetchFilteredProducts = async () => {
    if (!membershipId || !groupDetails.groupAmt || !groupDetails.groupNoOfMonths || groupDetails.groupType !== "Fixed") {
      return;
    }

    setIsLoadingProducts(true);
    try {
      const queryParams = new URLSearchParams({
        membershipId: membershipId,
        productAmount: groupDetails.groupAmt,
        tenure: groupDetails.groupNoOfMonths
      });

      const response = await fetch(`${API_BASE_URL}/products/filter?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${user.results.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response Status:', response.status);
      console.log('API Response URL:', response.url);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response Data:', data);
        setFilteredProducts(data.results || []);

        // Auto-select the first product if only one is found
        if (data.results && data.results.length === 1) {
          setSelectedProduct(data.results[0]);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch filtered products:', response.status, errorText);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Error fetching filtered products:', error);
      setFilteredProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch products when group details change
  useEffect(() => {
    if (groupDetails.groupType === "Fixed" && membershipId && groupDetails.groupAmt && groupDetails.groupNoOfMonths) {
      fetchFilteredProducts();
    } else {
      setFilteredProducts([]);
      setSelectedProduct(null);
    }
  }, [membershipId, groupDetails.groupAmt, groupDetails.groupNoOfMonths, groupDetails.groupType]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Generate fixed group accounts if groupType is Fixed
  const fixedGroupAccounts = useMemo(() => {
    if (groupDetails.groupType !== "Fixed" || !selectedProduct) return [];

    const startDate = new Date(groupDetails.firstAuctDate);
    const months = groupDetails.groupNoOfMonths;

    const generatedDates = Array.from({ length: months }, (_, i) => {
      const date = new Date(startDate.getTime());
      date.setMonth(date.getMonth() + i);
      return date.toISOString().split("T")[0];
    });

    return selectedProduct.groupAccounts.map((acc, idx) => ({
      ...acc,
      auctDate: generatedDates[idx] || "",
    }));
  }, [groupDetails, selectedProduct]);

  const handleSubmit = async () => {
    setIsLoading(true);

    if (isLoggedIn) {
      // Logged-in: send to backend
      const emi =
        groupDetails.groupType === "Fixed"
          ? groupDetails.groupAmt / groupDetails.groupNoOfMonths
          : groupDetails.groupAmt / groupDetails.groupNoOfSub;

      const groupData = {
        groupId: null,
        groupName: groupDetails.groupName,
        amount: groupDetails.groupAmt,
        type: groupDetails.groupType,
        noOfSubscribers: groupDetails.groupNoOfSub,
        tenure:
          groupDetails.groupType === "Fixed"
            ? groupDetails.groupNoOfMonths
            : groupDetails.groupNoOfSub,
        groupProgress: "FUTURE",
        auctDate: groupDetails.firstAuctDate,
        auctStartTime: groupDetails.auctStartTime,
        auctEndTime: groupDetails.auctEndTime,
        emi: emi || 0,
        collectedBy: user.results.userId,
        commissionType: groupDetails.commType,
        commissionMonth: 0,
        commissionPercentage: groupDetails.commPercentage,
        commissionAmount: groupDetails.commAmt,
        auctionPlace: groupDetails.auctPlace,
        nextAuctDate: groupDetails.firstAuctDate,
        auctionMode: groupDetails.auctFreq,
        sourceSystem: "WEB",
        stepper: 0,
        isAuctionReady: false,
        isDrafted: 0,
        groupAccounts: fixedGroupAccounts,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/groups`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.results.token}`,
            "Content-Type": "application/json",
            "X-User-Role": userRole,
          },
          body: JSON.stringify(groupData),
        });

        if (response.ok) {
          const grpJsonObject = await response.json();
          groupDetails.setGroupId(grpJsonObject.results.id);
          updateContext.setStep(updateContext.currentPage + 1);
          localStorage.removeItem("unauthenticatedGroup");
        } else {
          console.error("Failed to submit group details");
        }
      } catch (error) {
        console.error("Error submitting group details:", error);
      }
    } else {
      // Not logged-in: save to localStorage and redirect
      const generatedKey = uuidv4();
      const groupData = {
        step: groupDetails.currentPage,
        groupId: generatedKey,
        groupName: groupDetails.groupName,
        groupAmt: groupDetails.groupAmt,
        groupType: groupDetails.groupType,
        groupNoOfSub: groupDetails.groupNoOfSub,
        groupNoOfMonths: groupDetails.groupNoOfMonths,
        groupProgress: "FUTURE",
        firstAuctDate: groupDetails.firstAuctDate,
        auctStartTime: groupDetails.auctStartTime,
        auctEndTime: groupDetails.auctEndTime,
        commAmt: groupDetails.commAmt,
        collectedBy: null,
        commissionType: groupDetails.commType,
        commissionMonth: 0,
        commissionAmount: groupDetails.commAmt,
        auctionPlace: groupDetails.auctPlace,
        auctionMode: groupDetails.auctFreq,
        sourceSystem: "WEB",
        stepper: 0,
        isAuctionReady: false,
        isDrafted: 0,
      };
      localStorage.setItem("unauthenticatedGroup", JSON.stringify(groupData));
      history.push("/login");
    }

    setIsLoading(false);
  };

  const handlePrevious = () => {
    updateContext.setStep(updateContext.currentPage - 1);
  };

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white p-8 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-3xl font-bold font-['Poppins'] mb-2">Preview & Submit</h2>
          <p className="text-red-100 text-sm">Review your group details before submission</p>
        </div>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Group Name:</span>
            <span className="ml-2 text-gray-900">{groupDetails.groupName}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Group Amount:</span>
            <span className="ml-2 text-gray-900">{groupDetails.groupAmt}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">
              {groupDetails.groupType === "Fixed"
                ? "No of Months:"
                : groupDetails.groupType === "Adaptive"
                  ? "No of Shares:"
                  : "No of Subscribers:"}
            </span>
            <span className="ml-2 text-gray-900">
              {groupDetails.groupType === "Fixed" ? groupDetails.groupNoOfMonths : groupDetails.groupNoOfSub}
            </span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Group Type:</span>
            <span className="ml-2 text-gray-900">{groupDetails.groupType}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Commission Type:</span>
            <span className="ml-2 text-gray-900">{groupDetails.commType}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Commission Percent:</span>
            <span className="ml-2 text-gray-900">{groupDetails.commPercentage}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Commission Amount:</span>
            <span className="ml-2 text-gray-900">{groupDetails.commAmt}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Auction Mode:</span>
            <span className="ml-2 text-gray-900">{groupDetails.auctFreq}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Auction Date:</span>
            <span className="ml-2 text-gray-900">{groupDetails.firstAuctDate}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Auction Start Time:</span>
            <span className="ml-2 text-gray-900">{groupDetails.auctStartTime}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Auction End Time:</span>
            <span className="ml-2 text-gray-900">{groupDetails.auctEndTime}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-700">Auction Place:</span>
            <span className="ml-2 text-gray-900">{groupDetails.auctPlace}</span>
          </div>
        </div>

        {/* Product Selection for Fixed Groups */}
        {groupDetails.groupType === "Fixed" && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 font-['Poppins']">Select Product</h3>

            {isLoadingProducts ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading available products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Product ({filteredProducts.length} available)
                  </label>
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const productId = e.target.value;
                      const product = filteredProducts.find(p => p.id === productId);
                      setSelectedProduct(product);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select a product...</option>
                    {filteredProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.productName} - ₹{product.product.toLocaleString()} ({product.noofmonths} months)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Selected Product Details:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-red-700">Product Name:</span>
                        <span className="ml-2 text-red-900">{selectedProduct.productName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-red-700">Amount:</span>
                        <span className="ml-2 text-red-900">₹{selectedProduct.product.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-red-700">Tenure:</span>
                        <span className="ml-2 text-red-900">{selectedProduct.noofmonths} months</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-center">
                <div className="text-yellow-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-yellow-800 mb-2">No Products Found</h4>
                <p className="text-yellow-700 text-sm">
                  No active products found for the specified amount (₹{groupDetails.groupAmt}) and tenure ({groupDetails.groupNoOfMonths} months).
                  Please create a product with these specifications first.
                </p>
              </div>
            )}
          </div>
        )}

        {groupDetails.groupType === "Fixed" && selectedProduct && fixedGroupAccounts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 font-['Poppins']">Fixed Group Accounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-xl shadow-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                    <th className="p-4 text-left font-semibold">Auction Date</th>
                    <th className="p-4 text-center font-semibold">Bid</th>
                    <th className="p-4 text-center font-semibold">Prize</th>
                    <th className="p-4 text-center font-semibold">Commission</th>
                    <th className="p-4 text-center font-semibold">Balance</th>
                    <th className="p-4 text-center font-semibold">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedGroupAccounts.map((acc, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-4 border-b border-gray-200">{formatDate(acc.auctDate)}</td>
                      <td className="p-4 border-b border-gray-200 text-center">{acc.bid ?? 0}</td>
                      <td className="p-4 border-b border-gray-200 text-center">{acc.prize ?? 0}</td>
                      <td className="p-4 border-b border-gray-200 text-center">{acc.comm ?? 0}</td>
                      <td className="p-4 border-b border-gray-200 text-center">{acc.bal ?? 0}</td>
                      <td className="p-4 border-b border-gray-200 text-center">{acc.due ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <button
            onClick={handlePrevious}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-gray-600 hover:to-gray-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-500/30 flex items-center justify-center gap-2"
          >
            <span>←</span>
            Previous
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (groupDetails.groupType === "Fixed" && !selectedProduct)}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                Submit
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
