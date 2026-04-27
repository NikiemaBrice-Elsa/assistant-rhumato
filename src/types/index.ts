export type City = 'Ouagadougou' | 'Bobo Dioulasso' | 'Koudougou' | 'Kaya' | 'Koupéla' | 'Autre';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  city: City;
  createdAt: string;
  isActive: boolean;
}

export interface CATPathology {
  id: string;
  title: string;
  category: string;
  icon: string;
  interrogatoire: string[];
  examenClinique: string[];
  signesAlerte: string[];
  diagnostics: string[];
  bilan: string[];
  ordonnance: OrdonnanceItem[];
  quandReferer: string[];
  tags: string[];
}

export interface OrdonnanceItem {
  medicament: string;
  posologie: string;
  duree: string;
  note?: string;
}

export interface NomCommercialEntry {
  nom: string;
  dateDebut?: string;   // Date de début de publication (YYYY-MM-DD)
  dateFin?: string;     // Date de fin (expiration) de la publication
}

export interface Medication {
  id: string;
  dci: string;
  nomCommercial: string[];                   // Noms simples (compatibilité)
  nomsCommerciaux?: NomCommercialEntry[];    // Noms avec dates de publication
  classe: string;
  posologie: string;
  contreIndications: string[];
  effetsSecondaires: string[];
  prixIndicatif: string;
  disponibleLocalement: boolean;
  actif: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export interface ClinicalCase {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  imageUrl?: string;
  question: string;
  status: 'pending' | 'approved' | 'rejected';
  likes: string[];
  createdAt: string;
  commentsCount?: number;
}

export interface CaseComment {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: string;
}

export interface MedicalEvent {
  id: string;
  title: string;
  date: string;
  heure: string;
  city: string;
  organizer: string;
  imageUrl?: string;
  description?: string;
  type: 'congres' | 'formation' | 'webinaire' | 'sponsored';
  createdAt: string;
}

export interface Invitation {
  id: string;
  laboId: string;
  laboName: string;
  title: string;
  message: string;
  date: string;
  heure: string;
  city: string;
  imageUrl?: string;
  recipients: 'all' | City | string[];
  createdAt: string;
}

export interface Confirmation {
  id: string;
  invitationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCity: City;
  response: 'confirmed' | 'refused' | 'pending';
  respondedAt?: string;
}

export interface Lab {
  id: string;
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Ad {
  id: string;
  laboId: string;
  laboName: string;
  title: string;
  imageUrl?: string;
  description?: string;
  status: 'active' | 'planned' | 'expired';
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
}
