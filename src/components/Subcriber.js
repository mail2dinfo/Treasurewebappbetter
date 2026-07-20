import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import Alert from '../components/Alert';
import { useLocation } from 'react-router-dom';
import AssignGroupAmountPopup from "../components/AssignGroupAmountPopup";
import { Phone, Eye, User } from 'lucide-react';

const Subscriber = ({ name, id, phone, user_image_from_s3 }) => {
    const [showAddButton, setShowAddButton] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
    const [imageError, setImageError] = useState(false);
    const location = useLocation();
    const basePath = location.pathname.startsWith('/chit-fund/manager')
        ? '/chit-fund/manager'
        : '/chit-fund/user';
    const { user } = useUserContext();
    const { groupId } = useParams();

    useEffect(() => {
        const pattern = /\/addgroupsubscriber\//;
        if (pattern.test(location.pathname)) {
            setShowAddButton(true);
        }
    }, [location]);

    const showAlert = (show = false, type = '', msg = '') => {
        setAlert({ show, type, msg });
    };

    const postSubscriberData = async (contributionAmount, contributionPercentage) => {
        const apiUrl = `${API_BASE_URL}/groups/${groupId}/subscribers/${id}`;
        try {
            setIsLoading(true);
            const subData = {
                groupId,
                subscriberUserId: id,
                sourceSystem: 'WEB',
                referredBy: user.results.userId,
                shareAmount: contributionAmount,
                sharePercentage: contributionPercentage,
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subData),
            });

            const result = await response.json();
            showAlert(true, response.ok ? 'success' : 'danger', result.message);
        } catch (error) {
            showAlert(true, 'danger', 'Something went wrong.');
            console.error(error);
        } finally {
            setIsLoading(false);
            setShowConfirmation(false);
        }
    };

    return (
        <>
            <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg p-6 transition-all duration-300 mb-6 max-w-sm mx-auto hover:-translate-y-1 hover:shadow-xl hover:border-gray-300 md:flex-row md:items-start md:gap-6 md:max-w-2xl">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-gray-100 md:w-24 md:h-24 bg-gray-100 flex items-center justify-center">
                    {user_image_from_s3 && !imageError ? (
                        <img
                            src={user_image_from_s3}
                            alt={name || 'Subscriber profile'}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <User size={32} className="text-gray-400" />
                    )}
                </div>
                <div className="text-center md:text-left md:flex-1">
                    <h3 className="text-xl my-2 text-gray-800">{name}</h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 mb-4">
                        <Phone size={16} />
                        <span>{phone}</span>
                    </div>

                    <Link
                        to={`${basePath}/subscriber/${id}`}
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 mt-2 text-sm bg-custom-red text-white border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-blue-600 text-center no-underline"
                    >
                        <Eye size={16} />
                        <span>View Details</span>
                    </Link>

                    {showAddButton && (
                        <button
                            onClick={() => setShowConfirmation(true)}
                            disabled={isLoading}
                            className="block w-full py-2 px-4 mt-2 text-sm bg-custom-red text-white border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-blue-600"
                        >
                            {isLoading ? 'Adding...' : 'Add Subscriber'}
                        </button>
                    )}

                    {alert.show && <Alert {...alert} removeAlert={showAlert} list={[]} />}
                </div>
            </div>
            {showConfirmation && (
                <AssignGroupAmountPopup
                    confirmAddSubscriber={postSubscriberData}
                    cancelAddSubscriber={() => setShowConfirmation(false)}
                />
            )}
        </>
    );
};






export default Subscriber;
