import { db } from './index.ts';
import { hospitals, ambulances, dispatches, users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { Hospital, Ambulance, Dispatch } from '../types.ts';

// -------------------------------------------------------------
// HOSPITALS
// -------------------------------------------------------------
export async function dbGetHospitals(): Promise<Hospital[]> {
  try {
    const rows = await db.select().from(hospitals);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      phone: r.phone,
      emergency_status: r.emergencyStatus as any,
      capabilities: r.capabilities as string[],
      latitude: r.latitude,
      longitude: r.longitude,
      capacity: r.capacity as any,
      rating: r.rating ?? undefined,
      updated_at: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to query hospitals from Cloud SQL:', error);
    throw new Error('Database query failed for hospitals', { cause: error });
  }
}

export async function dbUpsertHospital(h: Hospital): Promise<void> {
  try {
    await db.insert(hospitals)
      .values({
        id: h.id,
        name: h.name,
        address: h.address,
        phone: h.phone,
        emergencyStatus: h.emergency_status,
        capabilities: h.capabilities,
        latitude: h.latitude,
        longitude: h.longitude,
        capacity: h.capacity,
        rating: h.rating,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: hospitals.id,
        set: {
          name: h.name,
          address: h.address,
          phone: h.phone,
          emergencyStatus: h.emergency_status,
          capabilities: h.capabilities,
          latitude: h.latitude,
          longitude: h.longitude,
          capacity: h.capacity,
          rating: h.rating,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error(`Failed to upsert hospital ${h.id}:`, error);
    throw new Error('Failed to upsert hospital', { cause: error });
  }
}

export async function dbUpdateHospitalCapacity(id: string, capacityUpdates: any): Promise<any> {
  try {
    const existing = await db.select().from(hospitals).where(eq(hospitals.id, id));
    if (existing.length === 0) return null;

    const currentCapacity = (existing[0].capacity as any) || {};
    const updatedCapacity = {
      ...currentCapacity,
      ...capacityUpdates,
      blood_bank: {
        ...(currentCapacity.blood_bank || {}),
        ...(capacityUpdates.blood_bank || {}),
      },
    };

    const res = await db.update(hospitals)
      .set({
        capacity: updatedCapacity,
        updatedAt: new Date(),
      })
      .where(eq(hospitals.id, id))
      .returning();

    return res[0];
  } catch (error) {
    console.error(`Failed to update capacity for hospital ${id}:`, error);
    throw new Error('Failed to update hospital capacity', { cause: error });
  }
}

// -------------------------------------------------------------
// AMBULANCES
// -------------------------------------------------------------
export async function dbGetAmbulances(): Promise<Ambulance[]> {
  try {
    const rows = await db.select().from(ambulances);
    return rows.map((a) => ({
      id: a.id,
      call_sign: a.callSign,
      vehicle_number: a.vehicleNumber,
      driver_name: a.driverName,
      driver_phone: a.driverPhone,
      driver_id: a.driverId ?? undefined,
      vehicle_type: a.vehicleType as any,
      status: a.status as any,
      latitude: a.latitude,
      longitude: a.longitude,
      speed_kmh: a.speedKmh,
      bearing: a.bearing,
      oxygen_level_pct: a.oxygenLevelPct,
      battery_level_pct: a.batteryLevelPct,
      assigned_dispatch_id: a.assignedDispatchId ?? null,
      target_hospital_id: a.targetHospitalId ?? null,
      updated_at: a.updatedAt ? a.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to query ambulances from Cloud SQL:', error);
    throw new Error('Database query failed for ambulances', { cause: error });
  }
}

export async function dbUpsertAmbulance(a: Ambulance): Promise<void> {
  try {
    await db.insert(ambulances)
      .values({
        id: a.id,
        callSign: a.call_sign,
        vehicleNumber: a.vehicle_number,
        driverName: a.driver_name,
        driverPhone: a.driver_phone,
        driverId: a.driver_id,
        vehicleType: a.vehicle_type,
        status: a.status,
        latitude: a.latitude,
        longitude: a.longitude,
        speedKmh: a.speed_kmh,
        bearing: a.bearing,
        oxygenLevelPct: a.oxygen_level_pct,
        batteryLevelPct: a.battery_level_pct,
        assignedDispatchId: a.assigned_dispatch_id,
        targetHospitalId: a.target_hospital_id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: ambulances.id,
        set: {
          callSign: a.call_sign,
          vehicleNumber: a.vehicle_number,
          driverName: a.driver_name,
          driverPhone: a.driver_phone,
          vehicleType: a.vehicle_type,
          status: a.status,
          latitude: a.latitude,
          longitude: a.longitude,
          speedKmh: a.speed_kmh,
          bearing: a.bearing,
          oxygenLevelPct: a.oxygen_level_pct,
          batteryLevelPct: a.battery_level_pct,
          assignedDispatchId: a.assigned_dispatch_id,
          targetHospitalId: a.target_hospital_id,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error(`Failed to upsert ambulance ${a.id}:`, error);
    throw new Error('Failed to upsert ambulance', { cause: error });
  }
}

export async function dbUpdateAmbulance(id: string, updates: Partial<Ambulance>): Promise<any> {
  try {
    const patch: any = { updatedAt: new Date() };
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.latitude !== undefined) patch.latitude = updates.latitude;
    if (updates.longitude !== undefined) patch.longitude = updates.longitude;
    if (updates.speed_kmh !== undefined) patch.speedKmh = updates.speed_kmh;
    if (updates.bearing !== undefined) patch.bearing = updates.bearing;
    if (updates.oxygen_level_pct !== undefined) patch.oxygenLevelPct = updates.oxygen_level_pct;
    if (updates.battery_level_pct !== undefined) patch.batteryLevelPct = updates.battery_level_pct;
    if (updates.assigned_dispatch_id !== undefined) patch.assignedDispatchId = updates.assigned_dispatch_id;
    if (updates.target_hospital_id !== undefined) patch.targetHospitalId = updates.target_hospital_id;

    const res = await db.update(ambulances)
      .set(patch)
      .where(eq(ambulances.id, id))
      .returning();

    return res[0];
  } catch (error) {
    console.error(`Failed to update ambulance ${id}:`, error);
    throw new Error('Failed to update ambulance telemetry', { cause: error });
  }
}

// -------------------------------------------------------------
// DISPATCHES
// -------------------------------------------------------------
export async function dbGetDispatches(): Promise<Dispatch[]> {
  try {
    const rows = await db.select().from(dispatches).orderBy(desc(dispatches.createdAt));
    return rows.map((d) => ({
      id: d.id,
      caller_name: d.callerName,
      caller_phone: d.callerPhone,
      emergency_category: d.emergencyCategory as any,
      priority: d.priority as any,
      patient_lat: d.patientLat,
      patient_lng: d.patientLng,
      patient_address: d.patientAddress,
      notes: d.notes ?? '',
      assigned_ambulance_id: d.assignedAmbulanceId ?? null,
      target_hospital_id: d.targetHospitalId ?? null,
      status: d.status as any,
      eta_minutes: d.etaMinutes,
      route_coordinates: (d.routeCoordinates as [number, number][]) || [],
      route_step: d.routeStep,
      vitals: (d.vitals as any) || {},
      sms_dispatched: d.smsDispatched,
      hospital_alerted: d.hospitalAlerted,
      bed_reserved: d.bedReserved,
      created_at: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
      updated_at: d.updatedAt ? d.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to get dispatches from Cloud SQL:', error);
    throw new Error('Database query failed for dispatches', { cause: error });
  }
}

export async function dbInsertDispatch(d: Dispatch): Promise<void> {
  try {
    await db.insert(dispatches)
      .values({
        id: d.id,
        callerName: d.caller_name,
        callerPhone: d.caller_phone,
        emergencyCategory: d.emergency_category,
        priority: d.priority,
        patientLat: d.patient_lat,
        patientLng: d.patient_lng,
        patientAddress: d.patient_address,
        notes: d.notes,
        assignedAmbulanceId: d.assigned_ambulance_id,
        targetHospitalId: d.target_hospital_id,
        status: d.status,
        etaMinutes: d.eta_minutes,
        routeCoordinates: d.route_coordinates,
        routeStep: d.route_step,
        vitals: d.vitals,
        smsDispatched: d.sms_dispatched,
        hospitalAlerted: d.hospital_alerted,
        bedReserved: d.bed_reserved,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: dispatches.id,
        set: {
          status: d.status,
          etaMinutes: d.eta_minutes,
          routeStep: d.route_step,
          vitals: d.vitals,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error(`Failed to insert dispatch ${d.id}:`, error);
    throw new Error('Failed to create dispatch in database', { cause: error });
  }
}

export async function dbUpdateDispatch(id: string, updates: Partial<Dispatch>): Promise<any> {
  try {
    const patch: any = { updatedAt: new Date() };
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.route_step !== undefined) patch.routeStep = updates.route_step;
    if (updates.eta_minutes !== undefined) patch.etaMinutes = updates.eta_minutes;
    if (updates.vitals !== undefined) patch.vitals = updates.vitals;

    const res = await db.update(dispatches)
      .set(patch)
      .where(eq(dispatches.id, id))
      .returning();

    return res[0];
  } catch (error) {
    console.error(`Failed to update dispatch ${id}:`, error);
    throw new Error('Failed to update dispatch in database', { cause: error });
  }
}
