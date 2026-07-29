import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';

const HostelManagementFloorsRoomsPage = () => {
  const {
    selectedHostelId, floors, rooms, fetchFloors, fetchRooms,
    createFloor, deleteFloor, createRoom, deleteRoom,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canCreate = can('hm_floor_room_create') || can('hm_floor_room_manage');
  const canDelete = can('hm_floor_room_delete') || can('hm_floor_room_manage');

  const [floorName, setFloorName] = useState('');
  const [roomForm, setRoomForm] = useState({
    floorId: '', roomNumber: '', roomType: 'Non-AC', capacity: 4, monthlyRent: '', dailyRent: '',
  });

  useEffect(() => {
    if (selectedHostelId) {
      fetchFloors(selectedHostelId);
      fetchRooms(selectedHostelId);
    }
  }, [selectedHostelId]);

  const addFloor = async (e) => {
    e.preventDefault();
    if (!selectedHostelId) return toast.error('Select a hostel');
    const result = await createFloor({
      hostelId: selectedHostelId,
      floorName,
      floorOrder: floors.length + 1,
    });
    if (result.success) {
      toast.success('Floor added');
      setFloorName('');
    } else toast.error(result.error);
  };

  const addRoom = async (e) => {
    e.preventDefault();
    if (!selectedHostelId || !roomForm.floorId) return toast.error('Select hostel and floor');
    const result = await createRoom({
      hostelId: selectedHostelId,
      floorId: roomForm.floorId,
      roomNumber: roomForm.roomNumber,
      roomType: roomForm.roomType,
      capacity: Number(roomForm.capacity) || 1,
      monthlyRent: Number(roomForm.monthlyRent) || 0,
      dailyRent: Number(roomForm.dailyRent) || 0,
    });
    if (result.success) {
      toast.success('Room + beds created');
      setRoomForm({ floorId: roomForm.floorId, roomNumber: '', roomType: 'Non-AC', capacity: 4, monthlyRent: '', dailyRent: '' });
    } else toast.error(result.error);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Floors & Rooms</h1>
          <p className="text-sm text-gray-500">Beds are created automatically from room capacity (like redBus seats).</p>
        </div>
        <HostelSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {canCreate && (
        <form onSubmit={addFloor} className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Add Floor</h2>
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Floor name" value={floorName} onChange={(e) => setFloorName(e.target.value)} required />
          <button className="bg-red-600 text-white rounded-lg px-4 py-2 font-semibold">+ Floor</button>
        </form>
        )}

        {canCreate && (
        <form onSubmit={addRoom} className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Add Room</h2>
          <select className="w-full border rounded-lg px-3 py-2" value={roomForm.floorId} onChange={(e) => setRoomForm({ ...roomForm, floorId: e.target.value })} required>
            <option value="">Select floor</option>
            {floors.map((f) => <option key={f.id} value={f.id}>{f.floor_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded-lg px-3 py-2" placeholder="Room no" value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} required />
            <input className="border rounded-lg px-3 py-2" type="number" min="1" placeholder="Capacity" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Monthly rent" value={roomForm.monthlyRent} onChange={(e) => setRoomForm({ ...roomForm, monthlyRent: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Daily rent" value={roomForm.dailyRent} onChange={(e) => setRoomForm({ ...roomForm, dailyRent: e.target.value })} />
          </div>
          <button className="bg-red-600 text-white rounded-lg px-4 py-2 font-semibold">+ Room</button>
        </form>
        )}
      </div>

      <div className="space-y-4">
        {floors.map((floor) => {
          const floorRooms = rooms.filter((r) => r.floor_id === floor.id);
          return (
            <div key={floor.id} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-900">{floor.floor_name}</h3>
                {canDelete && (
                <button type="button" className="text-xs text-red-600" onClick={async () => {
                  const r = await deleteFloor(floor.id, selectedHostelId);
                  if (!r.success) toast.error(r.error);
                }}>Delete floor</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {floorRooms.map((room) => (
                  <div key={room.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between">
                      <p className="font-semibold">Room {room.room_number} · Cap {room.capacity}</p>
                      {canDelete && (
                      <button type="button" className="text-xs text-red-600" onClick={async () => {
                        const r = await deleteRoom(room.id, selectedHostelId);
                        if (!r.success) toast.error(r.error);
                      }}>Delete</button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">₹{room.monthly_rent}/mo · ₹{room.daily_rent}/day</p>
                    <div className="flex flex-wrap gap-2">
                      {(room.beds || []).map((bed) => (
                        <div
                          key={bed.id}
                          className="min-w-[7.5rem] max-w-[11rem] px-2.5 py-2 rounded-lg text-xs bg-red-600 border border-red-700 text-white"
                        >
                          <p className="font-semibold text-white">
                            {bed.bed_label} · {bed.status === 'OCCUPIED' ? 'Occupied' : 'Vacant'}
                          </p>
                          {bed.status === 'OCCUPIED' ? (
                            <div className="mt-1 space-y-0.5 text-white">
                              <p className="font-medium truncate" title={bed.resident_name || ''}>
                                {bed.resident_name || 'Resident'}
                              </p>
                              <p className="text-[11px] text-white/90">
                                {bed.resident_phone || '—'}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-1 text-[11px] text-white/90">Available</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {floorRooms.length === 0 && <p className="text-sm text-gray-500">No rooms on this floor.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HostelManagementFloorsRoomsPage;
