import React, { useState, useEffect } from 'react';
import { useEmployeeContext } from '../context/employee_context';
import { useUserContext } from '../context/user_context';
import AvatarUploader from '../components/AvatarUploader';
import { uploadImage } from "../utils/uploadImage";
import AlertComponent from '../components/Alert';
import CollectorDashboardModal from './CollectorDashboardModal';
import loadingImage from '../images/preloader.gif';
import "../style/AddEmployee.css";
import { API_BASE_URL } from "../utils/apiConfig";

const AddEmployee = () => {
    const { user } = useUserContext();
    const {
        employeeList,
        isLoading,
        addEmployee,
        deleteEmployee,
        fetchEmployees
    } = useEmployeeContext();
    console.log(employeeList);
    const [list] = useState([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        email: '',
        phone: '',
        roleId: '',
        country: 'IND',
        countryCode: '+91',
        sourceSystem: 'WEB',
        referredBy: user?.results?.userId,
    });

    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("https://i.imgur.com/ndu6pfe.png");
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
    const [showCollectorModal, setShowCollectorModal] = useState(false);
    const [selectedCollector, setSelectedCollector] = useState(null);
    const [signedUrls, setSignedUrls] = useState({});

    useEffect(() => {
        if (image?.previewUrl) {
            setPreviewUrl(image.previewUrl);
        }
    }, [image]);

    // Fetch signed URLs for employee images
    useEffect(() => {
        const fetchSignedUrls = async () => {
            if (Array.isArray(list)) {
                const urls = {};
                try {
                    const promises = list.map(async (item) => {
                        const { user_image } = item;
                        if (user_image) {
                            try {
                                const response = await fetch(`${API_BASE_URL}/get-signed-url?key=${encodeURIComponent(user_image)}`, {
                                    method: 'GET',
                                    headers: {
                                        Authorization: `Bearer ${user?.results?.token}`,
                                    },
                                });

                                if (response.ok) {
                                    const responseBody = await response.json();
                                    const signedUrl = responseBody.results;
                                    urls[user_image] = signedUrl;
                                }
                            } catch (error) {
                                console.error(`Failed to fetch signed URL for user_image: ${user_image}`, error);
                            }
                        }
                    });

                    await Promise.all(promises);
                    setSignedUrls(urls);
                } catch (error) {
                    console.error('Error fetching signed URLs:', error);
                }
            }
        };

        if (list && list.length > 0) {
            fetchSignedUrls();
        }
    }, [list, user?.results?.token]);

    const handleSetImage = (file) => {
        if (file) {
            const fileURL = URL.createObjectURL(file);
            setPreviewUrl(fileURL);
            setImage({ file, previewUrl: fileURL });
        }
    };

    const showAlert = (show = false, type = '', msg = '') => {
        setAlert({ show, type, msg });
    };

    const handleViewEmployee = (employee) => {
        console.log('AddEmployee - Employee clicked:', employee);
        console.log('AddEmployee - Employee role:', employee.role);

        // Check if the employee is a collector
        const isCollector = employee.role && employee.role.toLowerCase().includes('collector');

        if (isCollector) {
            console.log('AddEmployee - Opening collector modal for:', employee);
            setSelectedCollector(employee);
            setShowCollectorModal(true);
        } else {
            console.log('AddEmployee - Not a collector, showing alert');
            window.alert(`View employee: ${employee.name || employee.firstname || 'Unknown'}`);
        }
    };

    const handleCloseCollectorModal = () => {
        setShowCollectorModal(false);
        setSelectedCollector(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        let imageUrl = '';
        if (image?.file) {
            try {
                imageUrl = await uploadImage(image.file, API_BASE_URL, setErrorMessage);
            } catch (err) {
                console.error('Image upload failed:', err);
                showAlert(true, 'danger', 'Image upload failed');
                setIsSubmitting(false);
                return;
            }
        }

        console.log(imageUrl);

        const employeeData = { ...formData, userImage: imageUrl };
        console.log('mani corrected');
        console.log(employeeData);
        const result = await addEmployee(employeeData);
        if (result.success) {
            showAlert(true, 'success', result.message || 'Employee added successfully');
            fetchEmployees();

            setFormData({
                firstName: '',
                lastName: '',
                dob: '',
                gender: '',
                email: '',
                phone: '',
                roleId: '',
                country: 'IND',
                countryCode: '+91',
                sourceSystem: 'WEB',
                referredBy: user?.results?.userId,
            });
            setImage(null);
            setPreviewUrl("https://i.imgur.com/ndu6pfe.png");
            setIsDialogOpen(false);

        } else {
            showAlert(true, 'danger', result.message || 'An error occurred');
        }



        setIsSubmitting(false);
    };

    const handleDelete = async (id, roleid) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            await deleteEmployee(id, roleid);
            fetchEmployees();
        }
    };

    return (
        <div className="employee-container">
            <div className="employee-header">
                <h2>Employee List ({employeeList.length}):</h2>
                <button onClick={() => setIsDialogOpen(true)} className="employee-add-button">
                    + Add Employee
                </button>
            </div>

            {alert.show && <AlertComponent {...alert} removeAlert={showAlert} list={list} />}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

            {isLoading ? (
                <img src={loadingImage} alt="Loading..." />
            ) : (
                <table className="employee-list">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeeList.map((emp) => (
                            <tr key={`${emp.id}-${emp.roleid}`}>
                                <td data-label="Image">
                                    <img

                                        src={emp?.user_image_from_s3 || "/default-avatar.png"}
                                        alt={`${emp.firstName} ${emp.lastName}`}
                                        className="employee-thumbnail"
                                    />
                                </td>
                                <td data-label="First Name">{emp.firstname}</td>
                                <td data-label="Last Name">{emp.lastname}</td>
                                <td data-label="Email">{emp.email}</td>
                                <td data-label="Role">{emp.role}</td>
                                <td data-label="Phone">{emp.phone}</td>
                                <td className="employee-actions" data-label="Actions">
                                    <button
                                        className="employee-button view"
                                        onClick={() => handleViewEmployee(emp)}
                                        title="View Employee"
                                    >
                                        View
                                    </button>
                                    <button
                                        className="employee-button delete"
                                        onClick={() => handleDelete(emp.id, emp.roleid)}
                                        title="Delete Employee"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            )}
            {isDialogOpen && (
                <div className="employee-modal-overlay">
                    <div className="employee-modal-content">
                        <button
                            className="employee-modal-close"
                            onClick={() => setIsDialogOpen(false)}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <div className="employee-modal-header">
                            <h3>Add Employee</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="employee-modal-form">

                            {/* Avatar should be isolated from form-group layout */}
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                                <AvatarUploader handleSetImage={handleSetImage} currentImage={previewUrl} />
                            </div>


                            <div className="employee-form-group">
                                <label>First Name*</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                            </div>

                            <div className="employee-form-group">
                                <label>Last Name*</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                            </div>

                            <div className="employee-form-group">
                                <label>Date of Birth*</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                            </div>

                            <div className="employee-form-group">
                                <label>Gender*</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} required>
                                    <option value="">Select Gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                </select>
                            </div>

                            <div className="employee-form-group">
                                <label>Email*</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>

                            <div className="employee-form-group">
                                <label>Phone*</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                            </div>

                            <div className="employee-form-group">
                                <label htmlFor="role">Role*</label>
                                <select
                                    id="role"
                                    name="roleId"
                                    value={formData.roleId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>Select a role</option>
                                    <option value="3">Manager</option>
                                    <option value="4">Accountant</option>
                                    <option value="5">Collector</option>
                                </select>
                            </div>

                            <div className="employee-modal-actions">
                                <button type="button" className="employee-modal-cancel" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="employee-modal-save" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <img src={loadingImage} alt="Submitting" style={{ width: 20 }} />
                                    ) : (
                                        'Add Employee'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Collector Dashboard Modal */}
            {showCollectorModal && selectedCollector && (
                <CollectorDashboardModal
                    isOpen={showCollectorModal}
                    onClose={handleCloseCollectorModal}
                    collector={selectedCollector}
                    signedUrls={signedUrls}
                />
            )}

        </div>
    );
};

export default AddEmployee;
