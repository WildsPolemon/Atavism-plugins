export interface ToolRecord {
  id: string;
  station: string;
  label: string;
  operationTypes: string[];
  minDiameter: number;
  maxDiameter: number;
  maxDoc: number;
  noseRadius: number;
  available: boolean;
}

export const toolDatabase: ToolRecord[] = [
  {
    id: "T0101",
    station: "T0101",
    label: "CNMG 120408 Rough",
    operationTypes: ["facing", "rough_turning"],
    minDiameter: 20,
    maxDiameter: 200,
    maxDoc: 4,
    noseRadius: 0.8,
    available: true
  },
  {
    id: "T0202",
    station: "T0202",
    label: "VNMG 160404 Finish",
    operationTypes: ["finish_turning"],
    minDiameter: 8,
    maxDiameter: 160,
    maxDoc: 1,
    noseRadius: 0.4,
    available: true
  },
  {
    id: "T0303",
    station: "T0303",
    label: "2mm Grooving Tool",
    operationTypes: ["grooving", "parting"],
    minDiameter: 6,
    maxDiameter: 120,
    maxDoc: 2.5,
    noseRadius: 0.2,
    available: true
  },
  {
    id: "T0404",
    station: "T0404",
    label: "16ER Threading Insert",
    operationTypes: ["threading"],
    minDiameter: 12,
    maxDiameter: 100,
    maxDoc: 0.4,
    noseRadius: 0.15,
    available: true
  },
  {
    id: "T0505",
    station: "T0505",
    label: "Parting 3mm Blade",
    operationTypes: ["parting"],
    minDiameter: 10,
    maxDiameter: 80,
    maxDoc: 3.5,
    noseRadius: 0.2,
    available: true
  },
  {
    id: "T0606",
    station: "T0606",
    label: "Drill 10mm Carbide",
    operationTypes: ["drilling"],
    minDiameter: 0,
    maxDiameter: 0,
    maxDoc: 100,
    noseRadius: 0,
    available: true
  }
];

export function selectTool(
  operationType: string,
  targetDiameter: number
): ToolRecord | undefined {
  return toolDatabase.find(
    (tool) =>
      tool.available &&
      tool.operationTypes.includes(operationType) &&
      (operationType === "drilling" ||
        (targetDiameter >= tool.minDiameter && targetDiameter <= tool.maxDiameter))
  );
}
