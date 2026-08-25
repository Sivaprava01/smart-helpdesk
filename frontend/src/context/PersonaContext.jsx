import React, { createContext, useContext, useState } from 'react';

/**
 * Persona / Role Demo Switcher Context
 * Note: As per guidelines, this is for operational UI perspective switching only.
 * No fake production auth is fabricated.
 */
const PersonaContext = createContext(null);

export const PERSONAS = {
  DISPATCHER: {
    id: 'DISPATCHER',
    name: 'Admin Dispatcher',
    role: 'Helpdesk Dispatcher',
    avatar: 'AD',
    badgeClass: 'bg-primary-subtle text-primary',
  },
  TECHNICIAN: {
    id: 'TECHNICIAN',
    name: 'Ravi Kumar',
    role: 'Senior Technician',
    avatar: 'RK',
    badgeClass: 'bg-info-subtle text-info-emphasis',
  },
  CUSTOMER: {
    id: 'CUSTOMER',
    name: 'Siva Prava',
    role: 'Resident (Tower A, 402)',
    avatar: 'SP',
    badgeClass: 'bg-success-subtle text-success',
  },
};

export function PersonaProvider({ children }) {
  const [currentPersona, setCurrentPersona] = useState(PERSONAS.DISPATCHER);

  return (
    <PersonaContext.Provider value={{ currentPersona, setPersona: setCurrentPersona, PERSONAS }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}
