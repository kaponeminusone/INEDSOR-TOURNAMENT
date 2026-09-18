import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export type Institution = { id: string; name: string; coach: string; initials: string; logo?: string; };
export type Robot = { id: string; name: string; categories: string[]; };
export type Participant = { id: string; name: string; email: string; whatsapp: string; grade: string; institutionId: string; attendedAt?: string; robots: string[]; };
export type Category = { id: string; name: string; slug: string; format: 'duelo' | '2v2' | 'grupo' | 'podio'; rules: string; startTime: string; teamSize: number; groupSize?: number; };
export type MatchStatus = 'pending' | 'active' | 'completed';
export type Match = { id: string; categoryId: string; round: number; label: string; sideARobots: string[]; sideBRobots: string[]; winner?: 'A' | 'B'; status: MatchStatus; nextMatchId?: string; };
export type RankingRow = { institutionId: string; gold: number; silver: number; bronze: number; };
export type PodiumResult = { categoryId: string; goldRobotId: string; silverRobotId: string; bronzeRobotId: string; recordedAt: string; };

type DataState = {
  institutions: Institution[];
  participants: Participant[];
  robots: Robot[];
  categories: Category[];
  matches: Match[];
  rankings: RankingRow[];
  podiums: PodiumResult[];
};

const defaultData: DataState = {
  institutions: [
    { id: 'inst_1', name: 'Instituto Tecnológico Superior', coach: 'Alan Turing', initials: 'ITS' },
    { id: 'inst_2', name: 'Escuela Politécnica Nacional', coach: 'Ada Lovelace', initials: 'EPN' },
    { id: 'inst_3', name: 'Universidad Central', coach: 'Nikola Tesla', initials: 'UC' },
  ],
  categories: [
    { id: 'cat_1', name: 'Seguidor de Línea', slug: 'seguidor-de-linea', format: 'duelo', rules: 'Recorrer el circuito en el menor tiempo. Penalización por salirse de la pista.', startTime: '09:00 AM', teamSize: 1 },
    { id: 'cat_2', name: 'Minisumo', slug: 'minisumo', format: 'duelo', rules: 'Empujar al oponente fuera del dohyo. Max 500g, 10x10cm.', startTime: '10:00 AM', teamSize: 1 },
    { id: 'cat_3', name: 'Sumo', slug: 'sumo', format: 'duelo', rules: 'Empujar al oponente fuera del dohyo. Max 3kg, 20x20cm.', startTime: '11:00 AM', teamSize: 1 },
    { id: 'cat_4', name: 'Soccer RC', slug: 'soccer-rc', format: '2v2', rules: 'Equipos de 2 robots. 2 tiempos de 3 minutos. Gana quien anota más goles.', startTime: '12:00 PM', teamSize: 2 },
    { id: 'cat_5', name: 'Pista con Dron', slug: 'pista-dron', format: 'grupo', rules: 'Carrera de 5 drones. El primero en cruzar avanza.', startTime: '02:00 PM', teamSize: 1, groupSize: 5 },
    { id: 'cat_6', name: 'Explotaglobos RC', slug: 'explotaglobos', format: 'podio', rules: 'Evaluación directa por jurado de tiempo y globos explotados.', startTime: '03:00 PM', teamSize: 1 },
    { id: 'cat_7', name: 'Sumo RC', slug: 'sumo-rc', format: '2v2', rules: 'Duelos en equipo de 2 contra 2. Máximo 3kg combinados. Gana el equipo que deje inoperativos a ambos oponentes o los empuje fuera.', startTime: '04:00 PM', teamSize: 2 },
  ],
  participants: [
    { id: 'part_1', name: 'Carlos Mendoza', email: 'carlos@test.com', whatsapp: '555-0001', grade: 'Universidad', institutionId: 'inst_1', robots: ['rob_1', 'rob_2', 'rob_5', 'rob_12'] },
    { id: 'part_2', name: 'Ana Silva', email: 'ana@test.com', whatsapp: '555-0002', grade: 'Universidad', institutionId: 'inst_2', robots: ['rob_3', 'rob_6', 'rob_8', 'rob_13'] },
    { id: 'part_3', name: 'Luis Pérez', email: 'luis@test.com', whatsapp: '555-0003', grade: 'Universidad', institutionId: 'inst_3', robots: ['rob_4', 'rob_9', 'rob_14'] },
    { id: 'part_4', name: 'Maria Gomez', email: 'maria@test.com', whatsapp: '555-0004', grade: 'Universidad', institutionId: 'inst_1', robots: ['rob_7', 'rob_10', 'rob_11'] },
  ],
  robots: [
    { id: 'rob_1', name: 'Veloz ITS', categories: ['cat_1'] },
    { id: 'rob_2', name: 'Destructor', categories: ['cat_2', 'cat_3'] },
    { id: 'rob_3', name: 'EPN Bot', categories: ['cat_1', 'cat_2'] },
    { id: 'rob_4', name: 'Tesla Strike', categories: ['cat_3', 'cat_5'] },
    { id: 'rob_5', name: 'Soccer Bot 1', categories: ['cat_4'] },
    { id: 'rob_6', name: 'Soccer Bot 2', categories: ['cat_4'] },
    { id: 'rob_7', name: 'Dron X', categories: ['cat_5'] },
    { id: 'rob_8', name: 'Sumo Team A', categories: ['cat_7'] },
    { id: 'rob_9', name: 'Sumo Team B', categories: ['cat_7'] },
    { id: 'rob_10', name: 'Dron Y', categories: ['cat_5'] },
    { id: 'rob_11', name: 'Dron Z', categories: ['cat_5'] },
    { id: 'rob_12', name: 'Globo Hunter', categories: ['cat_6'] },
    { id: 'rob_13', name: 'Pinchazo EPN', categories: ['cat_6'] },
    { id: 'rob_14', name: 'Aguijón RC', categories: ['cat_6'] },
  ],
  matches: [
    { id: 'match_1', categoryId: 'cat_2', round: 1, label: 'Octavos - 1', sideARobots: ['rob_2'], sideBRobots: ['rob_3'], status: 'pending' },
    { id: 'match_2', categoryId: 'cat_2', round: 1, label: 'Octavos - 2', sideARobots: [], sideBRobots: [], status: 'pending' },
    { id: 'match_3', categoryId: 'cat_2', round: 2, label: 'Cuartos - 1', sideARobots: [], sideBRobots: [], status: 'pending' },
    { id: 'match_4', categoryId: 'cat_7', round: 1, label: 'Duelo por Equipos 1', sideARobots: ['rob_8', 'rob_6'], sideBRobots: ['rob_9', 'rob_4'], status: 'pending' }, // 2v2 demo
    { id: 'match_5', categoryId: 'cat_5', round: 1, label: 'Carrera 1', sideARobots: ['rob_4', 'rob_7', 'rob_10', 'rob_11'], sideBRobots: [], status: 'pending' }, // Grupo demo
  ],
  rankings: [
    { institutionId: 'inst_1', gold: 1, silver: 0, bronze: 1 },
    { institutionId: 'inst_2', gold: 0, silver: 1, bronze: 0 },
    { institutionId: 'inst_3', gold: 0, silver: 0, bronze: 1 },
  ],
  podiums: []
};

type DataContextType = DataState & {
  isLoggedIn: boolean;
  login: (code: string) => boolean;
  logout: () => void;
  markAttendance: (participantId: string) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  addParticipant: (participant: Omit<Participant, 'id'>) => void;
  addRobot: (robot: Omit<Robot, 'id'>) => string; 
  addInstitution: (inst: Omit<Institution, 'id'>) => string;
  updateInstitution: (id: string, updates: Partial<Institution>) => void;
  addParticipantFull: (p: any) => void; 
  registerPodium: (categoryId: string, goldRobotId: string, silverRobotId: string, bronzeRobotId: string) => void;
  resetData: () => void;
  importData: (newInstitutions: Institution[], newParticipants: Participant[], newRobots: Robot[]) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataState>(() => {
    try {
      const stored = localStorage.getItem('robotica_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rankings && parsed.rankings.length > 0 && 'points' in parsed.rankings[0]) {
           parsed.rankings = parsed.rankings.map((r: any) => ({
             institutionId: r.institutionId,
             gold: r.gold,
             silver: r.silver,
             bronze: r.bronze
           }));
        }
        parsed.podiums ??= [];
        if (!parsed.robots.some((robot: Robot) => robot.categories.includes('cat_6'))) {
          const demoRobots = defaultData.robots.filter(robot => robot.categories.includes('cat_6'));
          parsed.robots.push(...demoRobots);
          parsed.participants = parsed.participants.map((participant: Participant) => {
            const demoParticipant = defaultData.participants.find(item => item.id === participant.id);
            const extraRobotIds = demoParticipant?.robots.filter(id => demoRobots.some(robot => robot.id === id)) ?? [];
            return { ...participant, robots: [...new Set([...participant.robots, ...extraRobotIds])] };
          });
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultData;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('robotica_auth') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('robotica_data', JSON.stringify(data));
  }, [data]);

  const login = useCallback((code: string) => {
    if (code === 'ROBOT2026') {
      setIsLoggedIn(true);
      localStorage.setItem('robotica_auth', 'true');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('robotica_auth');
  }, []);

  const markAttendance = useCallback((participantId: string) => {
    setData(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === participantId ? { ...p, attendedAt: new Date().toISOString() } : p
      )
    }));
  }, []);

  const updateMatch = useCallback((matchId: string, updates: Partial<Match>) => {
    setData(prev => ({
      ...prev,
      matches: prev.matches.map(m => m.id === matchId ? { ...m, ...updates } : m)
    }));
  }, []);

  const addParticipant = useCallback((participant: Omit<Participant, 'id'>) => {
    const newId = `part_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    setData(prev => ({
      ...prev,
      participants: [...prev.participants, { ...participant, id: newId }]
    }));
  }, []);

  const addRobot = useCallback((robot: Omit<Robot, 'id'>) => {
    const newId = `rob_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    setData(prev => ({
      ...prev,
      robots: [...prev.robots, { ...robot, id: newId }]
    }));
    return newId;
  }, []);

  const addInstitution = useCallback((inst: Omit<Institution, 'id'>) => {
    const newId = `inst_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    setData(prev => ({
      ...prev,
      institutions: [...prev.institutions, { ...inst, id: newId }]
    }));
    return newId;
  }, []);

  const updateInstitution = useCallback((id: string, updates: Partial<Institution>) => {
    setData(prev => ({
      ...prev,
      institutions: prev.institutions.map(inst => inst.id === id ? { ...inst, ...updates } : inst)
    }));
  }, []);

  const addParticipantFull = useCallback((payload: {
    participantName: string, email: string, whatsapp: string, grade: string,
    institutionId: string, newInstitutionName?: string,
    robotName: string, categoryId: string
  }) => {
    setData(prev => {
      let instId = payload.institutionId;
      const newInstitutions = [...prev.institutions];
      
      if (instId === 'new' && payload.newInstitutionName) {
        instId = `inst_${Date.now()}`;
        newInstitutions.push({
          id: instId,
          name: payload.newInstitutionName,
          initials: payload.newInstitutionName.substring(0,3).toUpperCase(),
          coach: ''
        });
      }

      const robotId = `rob_${Date.now()}`;
      const newRobots = [...prev.robots, {
        id: robotId,
        name: payload.robotName,
        categories: payload.categoryId ? [payload.categoryId] : []
      }];

      const participantId = `part_${Date.now()}`;
      const newParticipants = [...prev.participants, {
        id: participantId,
        name: payload.participantName,
        email: payload.email,
        whatsapp: payload.whatsapp,
        grade: payload.grade,
        institutionId: instId,
        attendedAt: new Date().toISOString(),
        robots: [robotId]
      }];

      return {
        ...prev,
        institutions: newInstitutions,
        robots: newRobots,
        participants: newParticipants
      };
    });
  }, []);

  const registerPodium = useCallback((categoryId: string, goldRobotId: string, silverRobotId: string, bronzeRobotId: string) => {
    setData(prev => {
      const newRankings = [...prev.rankings];
      const institutionForRobot = (robotId: string) =>
        prev.participants.find(participant => participant.robots.includes(robotId))?.institutionId;
      const previousPodium = prev.podiums.find(podium => podium.categoryId === categoryId);
      
      const updateScore = (instId: string | undefined, medalType: 'gold' | 'silver' | 'bronze', delta: 1 | -1) => {
        if (!instId) return;
        const idx = newRankings.findIndex(r => r.institutionId === instId);
        if (idx >= 0) {
          newRankings[idx] = { ...newRankings[idx], [medalType]: Math.max(0, newRankings[idx][medalType] + delta) };
        } else if (delta > 0) {
          newRankings.push({
            institutionId: instId,
            gold: medalType === 'gold' ? 1 : 0,
            silver: medalType === 'silver' ? 1 : 0,
            bronze: medalType === 'bronze' ? 1 : 0
          });
        }
      };

      if (previousPodium) {
        updateScore(institutionForRobot(previousPodium.goldRobotId), 'gold', -1);
        updateScore(institutionForRobot(previousPodium.silverRobotId), 'silver', -1);
        updateScore(institutionForRobot(previousPodium.bronzeRobotId), 'bronze', -1);
      }

      updateScore(institutionForRobot(goldRobotId), 'gold', 1);
      updateScore(institutionForRobot(silverRobotId), 'silver', 1);
      updateScore(institutionForRobot(bronzeRobotId), 'bronze', 1);

      const podium: PodiumResult = {
        categoryId,
        goldRobotId,
        silverRobotId,
        bronzeRobotId,
        recordedAt: new Date().toISOString()
      };

      return {
        ...prev,
        rankings: newRankings,
        podiums: [...prev.podiums.filter(item => item.categoryId !== categoryId), podium]
      };
    });
  }, []);

  const importData = useCallback((newInstitutions: Institution[], newParticipants: Participant[], newRobots: Robot[]) => {
    setData(prev => {
      return {
        ...prev,
        institutions: [...prev.institutions, ...newInstitutions],
        participants: [...prev.participants, ...newParticipants],
        robots: [...prev.robots, ...newRobots]
      };
    });
  }, []);

  const resetData = useCallback(() => {
    setData(defaultData);
  }, []);

  return (
    <DataContext.Provider value={{ 
      ...data, 
      isLoggedIn, login, logout,
      markAttendance, updateMatch, addParticipant, addRobot, addInstitution, updateInstitution, addParticipantFull, registerPodium, importData, resetData 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
