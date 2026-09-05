export interface MaterialProfile {
  id: string;
  aliases: string[];
  roughVc: number;
  finishVc: number;
  grooveVc: number;
  partVc: number;
  threadVc: number;
  roughFeed: number;
  finishFeed: number;
  grooveFeed: number;
  partFeed: number;
  threadPitchDefault: number;
}

export interface MachineProfile {
  id: string;
  spindleMaxRpm: number;
  spindleMinRpm: number;
  xTravelMm: number;
  zTravelMm: number;
  rapidMmPerMin: number;
  coolantRequired: boolean;
}

const materialProfiles: MaterialProfile[] = [
  {
    id: "steel-45",
    aliases: ["steel 45", "c45", "aisi 1045", "1045"],
    roughVc: 190,
    finishVc: 250,
    grooveVc: 150,
    partVc: 135,
    threadVc: 70,
    roughFeed: 0.28,
    finishFeed: 0.12,
    grooveFeed: 0.08,
    partFeed: 0.06,
    threadPitchDefault: 1.5
  },
  {
    id: "stainless-304",
    aliases: ["304", "aisi 304", "stainless 304"],
    roughVc: 120,
    finishVc: 170,
    grooveVc: 100,
    partVc: 85,
    threadVc: 45,
    roughFeed: 0.22,
    finishFeed: 0.1,
    grooveFeed: 0.06,
    partFeed: 0.05,
    threadPitchDefault: 1.5
  }
];

export const smecFanucMachineProfile: MachineProfile = {
  id: "smec-fanuc-lathe",
  spindleMaxRpm: 3500,
  spindleMinRpm: 80,
  xTravelMm: 320,
  zTravelMm: 750,
  rapidMmPerMin: 24000,
  coolantRequired: true
};

export function resolveMaterialProfile(materialInput: string): MaterialProfile {
  const normalized = materialInput.trim().toLowerCase();
  const match = materialProfiles.find((profile) =>
    profile.aliases.some((alias) => normalized.includes(alias))
  );
  return match ?? materialProfiles[0];
}
