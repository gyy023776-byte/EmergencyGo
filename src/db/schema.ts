import { pgTable, text, serial, timestamp, doublePrecision, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (links with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').default('patient').notNull(), // 'patient' | 'driver' | 'hospital_admin'
  assignedUnit: text('assigned_unit'),
  badge: text('badge'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Hospitals table
export const hospitals = pgTable('hospitals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  emergencyStatus: text('emergency_status').default('OPEN').notNull(),
  capabilities: jsonb('capabilities').notNull(), // string[]
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  capacity: jsonb('capacity').notNull(), // HospitalCapacity object
  rating: doublePrecision('rating'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Ambulances table
export const ambulances = pgTable('ambulances', {
  id: text('id').primaryKey(),
  callSign: text('call_sign').notNull(),
  vehicleNumber: text('vehicle_number').notNull(),
  driverName: text('driver_name').notNull(),
  driverPhone: text('driver_phone').notNull(),
  driverId: text('driver_id'),
  vehicleType: text('vehicle_type').default('ALS').notNull(),
  status: text('status').default('available').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  speedKmh: doublePrecision('speed_kmh').default(0).notNull(),
  bearing: doublePrecision('bearing').default(0).notNull(),
  oxygenLevelPct: doublePrecision('oxygen_level_pct').default(100).notNull(),
  batteryLevelPct: doublePrecision('battery_level_pct').default(100).notNull(),
  assignedDispatchId: text('assigned_dispatch_id'),
  targetHospitalId: text('target_hospital_id'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Emergency Dispatches table
export const dispatches = pgTable('dispatches', {
  id: text('id').primaryKey(),
  callerName: text('caller_name').notNull(),
  callerPhone: text('caller_phone').notNull(),
  emergencyCategory: text('emergency_category').notNull(),
  priority: text('priority').notNull(),
  patientLat: doublePrecision('patient_lat').notNull(),
  patientLng: doublePrecision('patient_lng').notNull(),
  patientAddress: text('patient_address').notNull(),
  notes: text('notes'),
  assignedAmbulanceId: text('assigned_ambulance_id'),
  targetHospitalId: text('target_hospital_id'),
  status: text('status').default('pending').notNull(),
  etaMinutes: integer('eta_minutes').default(0).notNull(),
  routeCoordinates: jsonb('route_coordinates'), // [lat, lng][]
  routeStep: integer('route_step').default(0).notNull(),
  vitals: jsonb('vitals'),
  smsDispatched: boolean('sms_dispatched').default(false).notNull(),
  hospitalAlerted: boolean('hospital_alerted').default(false).notNull(),
  bedReserved: boolean('bed_reserved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, () => ({}));
export const hospitalsRelations = relations(hospitals, () => ({}));
export const ambulancesRelations = relations(ambulances, () => ({}));
export const dispatchesRelations = relations(dispatches, () => ({}));
