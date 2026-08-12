declare module 'circular-natal-horoscope-js/dist/index' {
  export class Origin {
    constructor(opts: {
      year: number;
      month: number; // 0-indexed
      date: number;
      hour: number;
      minute: number;
      second?: number;
      latitude: number;
      longitude: number;
    });
  }

  export class Horoscope {
    constructor(opts: {
      origin: Origin;
      houseSystem: string;
      zodiac: string;
      aspectPoints: string[];
      aspectWithPoints: string[];
      aspectTypes: string[];
      customOrbs: Record<string, unknown>;
      language: string;
    });
    CelestialBodies: { all: any[] };
    CelestialPoints: { all: any[] };
    Ascendant: any;
    Midheaven: any;
    Houses: any[];
    Aspects: { all: any[] };
  }
}
