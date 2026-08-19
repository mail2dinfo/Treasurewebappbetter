import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useUserContext } from '../../context/user_context';
import { useHhPermission } from './useHhPermission';
import { useHhClinicalStream } from './useHhClinicalStream';
import { useHhBasePath, HH_ROLE_HOME_SUFFIX } from './hospitalManagementMenuItems';

const ROLE_HOME = {
  DOCTOR: '/doctor-desk',
  PHARMACIST: '/pharmacy-desk?view=doctor-prescriptions',
  COMPOUNDER: '/pharmacy-desk?view=doctor-prescriptions',
  KITCHEN_STAFF: '/kitchen-desk',
  NURSE: '/admissions',
  RECEPTIONIST: '/reception',
  MANAGER: '/dashboard',
};

const HhHospitalLiveAlerts = () => {
  const {
    membershipId,
    doctors,
    fetchOpdVisits,
    fetchPharmacyOrders,
    fetchKitchenOrders,
    fetchAdmissions,
    fetchAppointments,
    fetchDoctors,
    fetchCurrentDoctor,
  } = useHospitalManagement();
  const { user } = useUserContext();
  const { roleCode } = useHhPermission();
  const basePath = useHhBasePath();
  const authToken = user?.results?.token || localStorage.getItem('token') || '';
  const myUserId = user?.results?.userId || user?.results?.id || user?.userId || '';
  const role = String(roleCode || '').toUpperCase();
  const [loggedDoctorId, setLoggedDoctorId] = useState(null);
  const myDoctorId = useMemo(() => {
    if (loggedDoctorId) return loggedDoctorId;
    const fromDoctors = (doctors || []).find((row) => String(row.user_id || row.userId || '') === String(myUserId));
    return fromDoctors?.id || null;
  }, [doctors, myUserId, loggedDoctorId]);
  const doctorIdRef = useRef(myDoctorId);
  doctorIdRef.current = myDoctorId;

  useEffect(() => {
    if (!membershipId) return undefined;
    fetchDoctors();
    if (role === 'DOCTOR') {
      fetchCurrentDoctor().then((result) => {
        if (result?.success && result.data?.id) setLoggedDoctorId(result.data.id);
      });
    }
    return undefined;
  }, [membershipId, role, fetchDoctors, fetchCurrentDoctor]);

  const refreshForEvent = useCallback((event) => {
    const type = String(event?.type || '');
    if (type === 'opd_visit') fetchOpdVisits();
    if (type === 'pharmacy_order') fetchPharmacyOrders();
    if (type === 'kitchen_order') fetchKitchenOrders();
    if (type === 'admission' || type === 'ipd_account') fetchAdmissions();
    if (type === 'appointment') fetchAppointments();
  }, [fetchOpdVisits, fetchPharmacyOrders, fetchKitchenOrders, fetchAdmissions, fetchAppointments]);

  const onEvent = useCallback((event) => {
    if (!event || event.action === 'connected') return;
    refreshForEvent(event);
    if (!event.alert || !event.message) return;
    if (event.actor_user_id && myUserId && String(event.actor_user_id) === String(myUserId)) return;

    const notifyRoles = (event.notify_roles || event.notifyRoles || []).map((item) => String(item).toUpperCase());
    if (notifyRoles.length && !notifyRoles.includes(role)) return;
    if (role === 'DOCTOR') {
      const assignedDoctorId = event.doctor_id || event.notify_doctor_id;
      if (assignedDoctorId) {
        if (!doctorIdRef.current) return;
        if (String(doctorIdRef.current) !== String(assignedDoctorId)) return;
      }
    }

    const toastId = `${event.type || 'hh'}:${event.id || event.action}:${event.action || 'alert'}`;
    const homeSuffix = ROLE_HOME[role] || HH_ROLE_HOME_SUFFIX[role] || '';
    toast.info(
      <div>
        <p className="font-semibold text-gray-900">{event.title || 'New hospital task'}</p>
        <p className="mt-0.5 text-sm text-gray-700">{event.message}</p>
        {homeSuffix ? (
          <a href={`${basePath}${homeSuffix}`} className="mt-1 inline-block text-xs font-semibold text-cyan-800">
            Open desk
          </a>
        ) : null}
      </div>,
      { toastId, autoClose: 12000 }
    );
  }, [refreshForEvent, myUserId, role, basePath]);

  useHhClinicalStream({
    enabled: Boolean(authToken && membershipId),
    streamPath: '/hh/live/stream',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent,
  });

  return null;
};

export default HhHospitalLiveAlerts;
