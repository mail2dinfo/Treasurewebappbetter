import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import { useGroupDetailsContext } from '../context/group_context';
import Alert from '../components/Alert';
import AssignGroupAmountPopup from '../components/AssignGroupAmountPopup';
import { FiPhone, FiEye, FiUser, FiMail, FiPlus } from 'react-icons/fi';
import { getChitBasePath } from '../utils/chitBasePath';

const isValidUserImage = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('via.placeholder.com')) return false;
  if (url === 'default-image.jpg') return false;
  return true;
};

const Subscriber = ({
  name,
  id,
  subscriberUserId,
  subscriberId,
  phone,
  email,
  user_image_from_s3,
  view = 'list',
  alreadyInGroup = false,
}) => {
  const [showAddButton, setShowAddButton] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
  const [imageError, setImageError] = useState(false);
  const location = useLocation();
  const basePath = getChitBasePath(location.pathname);
  const { user } = useUserContext();
  const { groupId } = useParams();
  const { fetchGroups } = useGroupDetailsContext();

  useEffect(() => {
    if (/\/addgroupsubscriber\//.test(location.pathname)) {
      setShowAddButton(true);
    }
  }, [location]);

  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };

  const postSubscriberData = async (contributionAmount, contributionPercentage) => {
    const subscriberIdToAdd = id || subscriberUserId || subscriberId;
    if (!groupId || !subscriberIdToAdd) {
      const message = 'Missing group or subscriber. Open this page from the group again.';
      return { ok: false, message };
    }
    const apiUrl = `${API_BASE_URL}/groups/${groupId}/subscribers/${subscriberIdToAdd}`;
    try {
      setIsLoading(true);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          subscriberUserId: subscriberIdToAdd,
          sourceSystem: 'WEB',
          referredBy: user?.results?.userId,
          shareAmount: contributionAmount,
          sharePercentage: contributionPercentage,
        }),
      });
      const result = await response.json().catch(() => ({}));
      const message = result.message || (response.ok ? 'Subscriber added to the group.' : 'Failed to add subscriber');
      if (response.ok && fetchGroups) {
        await fetchGroups(groupId, { silent: true });
      }
      return { ok: response.ok, message };
    } catch (error) {
      console.error(error);
      return { ok: false, message: 'Something went wrong.' };
    } finally {
      setIsLoading(false);
    }
  };

  const imageSrc = isValidUserImage(user_image_from_s3) && !imageError ? user_image_from_s3 : null;
  const profilePath = `${basePath}/subscriber/${id}`;

  const avatar = (
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <FiUser className="w-5 h-5 text-gray-500" />
      )}
    </div>
  );

  const actions = (
    <div className={`flex gap-2 ${view === 'grid' ? 'flex-col w-full' : 'flex-wrap justify-end'}`}>
      <Link
        to={profilePath}
        className={`${view === 'grid' ? 'w-full justify-center' : ''} inline-flex items-center gap-2 py-2 px-4 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 no-underline`}
      >
        <FiEye className="w-4 h-4" />
        View details
      </Link>
      {showAddButton && (
        <button
          type="button"
          onClick={() => setShowConfirmation(true)}
          disabled={isLoading}
          className={`${view === 'grid' ? 'w-full justify-center' : ''} inline-flex items-center gap-2 py-2 px-4 text-sm font-semibold bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50`}
        >
          <FiPlus className="w-4 h-4" />
          {isLoading ? 'Adding...' : 'Add to group'}
        </button>
      )}
    </div>
  );

  return (
    <>
      <article
        className={`group-list-card ${
          view === 'list' ? 'flex flex-col sm:flex-row sm:items-center gap-4' : 'flex flex-col h-full'
        }`}
      >
        <div className={`flex items-start gap-3 min-w-0 ${view === 'list' ? 'flex-1' : ''}`}>
          {avatar}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="inline-flex items-center max-w-full rounded-full bg-gray-300 px-3 py-1 text-sm font-bold text-gray-900 truncate">
                {name || '—'}
              </h3>
              {alreadyInGroup ? (
                <span className="inline-flex items-center rounded-full bg-gray-800 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  In this group
                </span>
              ) : showAddButton ? (
                <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
                  Not in group
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600">
              <FiPhone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{phone || '—'}</span>
            </p>
            {email ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                <FiMail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className={view === 'grid' ? 'mt-4' : ''}>{actions}</div>
        {alert.show && <Alert {...alert} removeAlert={showAlert} list={[]} />}
      </article>
      {showConfirmation && (
        <AssignGroupAmountPopup
          confirmAddSubscriber={postSubscriberData}
          cancelAddSubscriber={() => setShowConfirmation(false)}
          subscriberName={name}
          subscriberId={id || subscriberUserId || subscriberId}
        />
      )}
    </>
  );
};

export default Subscriber;
