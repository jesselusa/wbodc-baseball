import {
  generateRoundRobinSchedule,
  validateRoundRobinSchedule,
  distributeGamesAcrossTimeSlots,
  distributeGamesWithConstraints,
  generateDefaultTimeSlots,
  calculateRoundsNeeded,
  calculateGamesNeeded,
  Team,
  TournamentSchedule,
  TimeSlot
} from './tournament-scheduling';

describe('Tournament Scheduling Utilities', () => {
  const mockTeams: Team[] = [
    { id: 'team1', name: 'Team Alpha' },
    { id: 'team2', name: 'Team Beta' },
    { id: 'team3', name: 'Team Gamma' },
    { id: 'team4', name: 'Team Delta' },
    { id: 'team5', name: 'Team Echo' },
    { id: 'team6', name: 'Team Foxtrot' }
  ];

  describe('generateRoundRobinSchedule', () => {
    it('should generate a valid round robin schedule for even number of teams', () => {
      const teams = mockTeams.slice(0, 4); // 4 teams
      const schedule = generateRoundRobinSchedule(teams);

      expect(schedule.totalRounds).toBe(3); // 4 teams - 1 = 3 rounds
      expect(schedule.matchesPerRound).toBe(2); // 4 teams / 2 = 2 matches per round
      expect(schedule.matches.length).toBe(6); // 4 teams * 3 / 2 = 6 total matches
    });

    it('should generate a valid round robin schedule for odd number of teams', () => {
      const teams = mockTeams.slice(0, 5); // 5 teams
      const schedule = generateRoundRobinSchedule(teams);

      expect(schedule.totalRounds).toBe(4); // 5 teams - 1 = 4 rounds (with bye)
      expect(schedule.matchesPerRound).toBe(2); // 6 teams (with bye) / 2 = 2 matches per round
      expect(schedule.matches.length).toBe(10); // 5 teams * 4 / 2 = 10 total matches
    });

    it('should ensure each team plays every other team exactly once', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);

      const teamMatchups = new Map<string, Set<string>>();
      teams.forEach(team => teamMatchups.set(team.id, new Set()));

      schedule.matches.forEach(match => {
        teamMatchups.get(match.homeTeam.id)!.add(match.awayTeam.id);
        teamMatchups.get(match.awayTeam.id)!.add(match.homeTeam.id);
      });

      teams.forEach(team => {
        const matchups = teamMatchups.get(team.id)!;
        expect(matchups.size).toBe(teams.length - 1); // Each team plays n-1 other teams
        teams.forEach(otherTeam => {
          if (otherTeam.id !== team.id) {
            expect(matchups.has(otherTeam.id)).toBe(true);
          }
        });
      });
    });

    it('should not include bye matches in the final schedule', () => {
      const teams = mockTeams.slice(0, 5); // 5 teams (odd number)
      const schedule = generateRoundRobinSchedule(teams);

      schedule.matches.forEach(match => {
        expect(match.homeTeam.id).not.toBe('bye');
        expect(match.awayTeam.id).not.toBe('bye');
      });
    });

    it('should throw error for less than 2 teams', () => {
      expect(() => generateRoundRobinSchedule([])).toThrow('At least 2 teams are required');
      expect(() => generateRoundRobinSchedule([mockTeams[0]])).toThrow('At least 2 teams are required');
    });

    it('should assign correct round and game numbers', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);

      schedule.matches.forEach((match, index) => {
        expect(match.round).toBeGreaterThan(0);
        expect(match.round).toBeLessThanOrEqual(schedule.totalRounds);
        expect(match.gameNumber).toBe(index + 1);
      });
    });
  });

  describe('validateRoundRobinSchedule', () => {
    it('should validate a correct schedule', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);
      const validation = validateRoundRobinSchedule(schedule, teams);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect duplicate matchups', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);
      
      // Add a duplicate match
      schedule.matches.push({
        homeTeam: teams[0],
        awayTeam: teams[1],
        round: 4,
        gameNumber: 7
      });

      const validation = validateRoundRobinSchedule(schedule, teams);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Duplicate matchup'))).toBe(true);
    });

    it('should detect self-matchups', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);
      
      // Add a self-matchup
      schedule.matches.push({
        homeTeam: teams[0],
        awayTeam: teams[0],
        round: 4,
        gameNumber: 7
      });

      const validation = validateRoundRobinSchedule(schedule, teams);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('cannot play against itself'))).toBe(true);
    });

    it('should detect missing teams', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);
      
      // Add a match with non-existent team
      schedule.matches.push({
        homeTeam: { id: 'nonexistent', name: 'Nonexistent Team' },
        awayTeam: teams[0],
        round: 4,
        gameNumber: 7
      });

      const validation = validateRoundRobinSchedule(schedule, teams);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('not found in original teams'))).toBe(true);
    });

    it('should detect incorrect number of games per team', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);
      
      // Remove a match to create imbalance
      schedule.matches.pop();

      const validation = validateRoundRobinSchedule(schedule, teams);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('plays') && error.includes('expected'))).toBe(true);
    });
  });

  describe('distributeGamesAcrossTimeSlots', () => {
    it('should distribute games across time slots', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);
      const timeSlots = ['10:00', '11:00', '12:00'];

      const distributed = distributeGamesAcrossTimeSlots(schedule, timeSlots);

      expect(distributed).toHaveLength(schedule.matches.length);
      distributed.forEach((match, index) => {
        expect(match.timeSlot).toBe(timeSlots[index % timeSlots.length]);
      });
    });

    it('should throw error for empty time slots', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);

      expect(() => distributeGamesAcrossTimeSlots(schedule, [])).toThrow('At least one time slot is required');
    });
  });

  describe('distributeGamesWithConstraints', () => {
    const mockTimeSlots: TimeSlot[] = [
      {
        id: 'slot1',
        startTime: '2024-11-01T10:00:00Z',
        endTime: '2024-11-01T11:00:00Z',
        label: '10:00 AM',
        maxGames: 1
      },
      {
        id: 'slot2',
        startTime: '2024-11-01T11:30:00Z',
        endTime: '2024-11-01T12:30:00Z',
        label: '11:30 AM',
        maxGames: 1
      },
      {
        id: 'slot3',
        startTime: '2024-11-01T13:00:00Z',
        endTime: '2024-11-01T14:00:00Z',
        label: '1:00 PM',
        maxGames: 1
      }
    ];

    it('should distribute games with constraints', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);

      const distributed = distributeGamesWithConstraints(schedule, mockTimeSlots, 60, 30);

      expect(distributed.matches).toHaveLength(schedule.matches.length);
      expect(distributed.timeSlots).toEqual(mockTimeSlots);
      
      distributed.matches.forEach(match => {
        expect(match.scheduledStart).toBeDefined();
        expect(match.scheduledEnd).toBeDefined();
        expect(match.timeSlot).toBeDefined();
      });
    });

    it('should respect rest period constraints', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);

      const distributed = distributeGamesWithConstraints(schedule, mockTimeSlots, 60, 30);

      // Check that teams have adequate rest between games
      const teamGameTimes = new Map<string, Date[]>();
      
      distributed.matches.forEach(match => {
        if (!teamGameTimes.has(match.homeTeam.id)) {
          teamGameTimes.set(match.homeTeam.id, []);
        }
        if (!teamGameTimes.has(match.awayTeam.id)) {
          teamGameTimes.set(match.awayTeam.id, []);
        }
        
        teamGameTimes.get(match.homeTeam.id)!.push(new Date(match.scheduledEnd));
        teamGameTimes.get(match.awayTeam.id)!.push(new Date(match.scheduledEnd));
      });

      teamGameTimes.forEach((gameTimes, teamId) => {
        gameTimes.sort((a, b) => a.getTime() - b.getTime());
        for (let i = 1; i < gameTimes.length; i++) {
          const restPeriod = gameTimes[i].getTime() - gameTimes[i - 1].getTime();
          expect(restPeriod).toBeGreaterThanOrEqual(30 * 60 * 1000); // 30 minutes in milliseconds
        }
      });
    });

    it('should respect max games per time slot', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);
      const limitedSlots = mockTimeSlots.map(slot => ({ ...slot, maxGames: 1 }));

      const distributed = distributeGamesWithConstraints(schedule, limitedSlots, 60, 30);

      // Count games per time slot
      const gamesPerSlot = new Map<string, number>();
      distributed.matches.forEach(match => {
        const count = gamesPerSlot.get(match.timeSlot.id) || 0;
        gamesPerSlot.set(match.timeSlot.id, count + 1);
      });

      gamesPerSlot.forEach((count, slotId) => {
        const slot = limitedSlots.find(s => s.id === slotId);
        expect(count).toBeLessThanOrEqual(slot!.maxGames);
      });
    });

    it('should throw error when no suitable time slot is available', () => {
      const teams = mockTeams.slice(0, 4);
      const schedule = generateRoundRobinSchedule(teams);
      const singleSlot = [mockTimeSlots[0]];

      expect(() => distributeGamesWithConstraints(schedule, singleSlot, 60, 30))
        .toThrow('No suitable time slot found');
    });
  });

  describe('generateDefaultTimeSlots', () => {
    it('should generate time slots for tournament days', () => {
      const startDate = '2024-11-01T00:00:00Z';
      const endDate = '2024-11-02T23:59:59Z';
      const timeSlots = generateDefaultTimeSlots(startDate, endDate, 4, 60, 30);

      expect(timeSlots).toHaveLength(8); // 2 days * 4 games per day
      
      timeSlots.forEach((slot, index) => {
        expect(slot.id).toMatch(/day-\d{4}-\d{2}-\d{2}-game-\d+/);
        expect(slot.maxGames).toBe(1);
        expect(new Date(slot.startTime)).toBeInstanceOf(Date);
        expect(new Date(slot.endTime)).toBeInstanceOf(Date);
      });
    });

    it('should respect game duration and break parameters', () => {
      const startDate = '2024-11-01T00:00:00Z';
      const endDate = '2024-11-01T23:59:59Z';
      const timeSlots = generateDefaultTimeSlots(startDate, endDate, 3, 90, 45);

      expect(timeSlots).toHaveLength(3);
      
      for (let i = 1; i < timeSlots.length; i++) {
        const currentStart = new Date(timeSlots[i].startTime);
        const previousEnd = new Date(timeSlots[i - 1].endTime);
        const breakDuration = currentStart.getTime() - previousEnd.getTime();
        
        expect(breakDuration).toBe(45 * 60 * 1000); // 45 minutes in milliseconds
      }
    });
  });

  describe('calculateRoundsNeeded', () => {
    it('should calculate correct number of rounds', () => {
      expect(calculateRoundsNeeded(2)).toBe(1);
      expect(calculateRoundsNeeded(4)).toBe(3);
      expect(calculateRoundsNeeded(6)).toBe(5);
      expect(calculateRoundsNeeded(8)).toBe(7);
    });
  });

  describe('calculateGamesNeeded', () => {
    it('should calculate correct number of games', () => {
      expect(calculateGamesNeeded(2)).toBe(1); // 2 * 1 / 2 = 1
      expect(calculateGamesNeeded(4)).toBe(6); // 4 * 3 / 2 = 6
      expect(calculateGamesNeeded(6)).toBe(15); // 6 * 5 / 2 = 15
      expect(calculateGamesNeeded(8)).toBe(28); // 8 * 7 / 2 = 28
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum valid tournament (2 teams)', () => {
      const teams = mockTeams.slice(0, 2);
      const schedule = generateRoundRobinSchedule(teams);

      expect(schedule.totalRounds).toBe(1);
      expect(schedule.matchesPerRound).toBe(1);
      expect(schedule.matches.length).toBe(1);
    });

    it('should handle large number of teams', () => {
      const largeTeams = Array.from({ length: 20 }, (_, i) => ({
        id: `team${i + 1}`,
        name: `Team ${i + 1}`
      }));

      const schedule = generateRoundRobinSchedule(largeTeams);

      expect(schedule.totalRounds).toBe(19);
      expect(schedule.matchesPerRound).toBe(10);
      expect(schedule.matches.length).toBe(190); // 20 * 19 / 2
    });

    it('should handle time slot distribution with many games', () => {
      const teams = mockTeams.slice(0, 6);
      const schedule = generateRoundRobinSchedule(teams);
      const timeSlots = Array.from({ length: 15 }, (_, i) => ({
        id: `slot${i + 1}`,
        startTime: `2024-11-01T${10 + i}:00:00Z`,
        endTime: `2024-11-01T${11 + i}:00:00Z`,
        label: `Slot ${i + 1}`,
        maxGames: 1
      }));

      const distributed = distributeGamesWithConstraints(schedule, timeSlots, 60, 30);

      expect(distributed.matches).toHaveLength(schedule.matches.length);
      expect(distributed.matches.every(match => match.scheduledStart && match.scheduledEnd)).toBe(true);
    });
  });
}); 