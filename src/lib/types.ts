/** Shapes returned by the GuestPortal Connect API (see its /documentation page). */

export type ConnectionStatus =
  | "CONNECTED"
  | "FAILED"
  | "TIMEOUT"
  | "DISCONNECTED"
  | "NOT_CONNECTED"
  | "CONNECTING"
  | "PENDING";

export type RunStatus = "RUNNING" | "SUCCEEDED" | "FAILED" | "PARTIAL";

export interface SyncRun {
  entity: "PROPERTY" | "RESERVATION";
  status: RunStatus;
  fetched: number;
  saved: number;
  failed: number;
  startedAt: string;
  finishedAt: string | null;
}

export interface Connection {
  id: string;
  provider: string;
  account: string;
  label: string | null;
  status: ConnectionStatus;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface ConnectionOverview extends Connection {
  imported: { properties: number; reservations: number };
  lastRuns: SyncRun[];
}

export interface Property {
  id: string;
  connectionId: string;
  provider: string;
  providerId: string;
  title: string;
  nickname: string | null;
  isListed: boolean;
  active: boolean;
  propertyType: string | null;
  accommodates: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSquareFeet: number | null;
  timezone: string | null;
  defaultCheckInTime: string | null;
  defaultCheckOutTime: string | null;
  /** Fields a partner has set through the API; a sync never overwrites these. */
  partnerEditedFields: string[];
  lastSyncedAt: string | null;
  address: {
    full: string | null;
    street: string | null;
    buildingNumber: string | null;
    apartmentNumber: string | null;
    city: string | null;
    state: string | null;
    zipcode: string | null;
    country: string | null;
  };
  amenities: string[];
  updatedAt: string;
}

export interface GuestView {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressCountry?: string;
}

export interface Reservation {
  id: string;
  connectionId: string;
  provider: string;
  providerId: string;
  propertyId: string;
  status: string;
  sourceStatus: string;
  channel: string;
  checkIn: string;
  checkOut: string;
  nights: number | null;
  guestsCount: number | null;
  numberOfAdults: number | null;
  numberOfChildren: number | null;
  numberOfInfants: number | null;
  numberOfPets: number | null;
  partnerEditedFields: string[];
  confirmationCode: string | null;
  currency: string | null;
  money: {
    totalPaid: number | null;
    balanceDue: number | null;
    subTotal: number | null;
    isFullyPaid: boolean;
  };
  guest?: GuestView;
  partyGuests?: GuestView[];
  updatedAt: string;
}

export interface Page<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

/** What the API sends back when a request is refused. */
export interface ApiErrorBody {
  message?: string | string[];
  error?: string;
  reason?: string;
  statusCode?: number;
}

/** The details a customer enters to link an iDoBooking account. */
export interface ConnectInput {
  apiUrl: string;
  applicationLogin: string;
  apiKey: string;
  label?: string;
}

/** What a partner may fill in or correct on a property (PATCH /properties/:id). */
export interface PropertyEdit {
  street?: string;
  buildingNumber?: string;
  apartmentNumber?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  accommodates?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSquareMetres?: number;
  defaultCheckInTime?: string;
  defaultCheckOutTime?: string;
}

/** What a partner may fill in or correct on a reservation (PATCH /reservations/:id). */
export interface ReservationEdit {
  numberOfAdults?: number;
  numberOfChildren?: number;
  numberOfInfants?: number;
  numberOfPets?: number;
  guest?: { firstName?: string; lastName?: string; email?: string; phone?: string; country?: string };
}
