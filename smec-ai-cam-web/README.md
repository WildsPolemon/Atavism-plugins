# SMEC AI CAM (Web, from scratch)

This project implements an AUTO CNC-first web workflow:

1. Upload drawing files (photo/PDF/DXF/STEP)
2. Fill minimal data (machine/material/stock/quantity)
3. Generate CNC program automatically
4. Monitor progress with full pipeline checkpoints
5. Review final FANUC G-code and download `.NC`

## Structure

- `backend`: Express + TypeScript API and AUTO CNC orchestration pipeline
- `frontend`: React + TypeScript dashboard with AUTO CNC as the primary action

## Run

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend expects backend at `http://localhost:4000` by default.
Set `VITE_API_BASE_URL` to override.

## Safety

The app supports automated analysis and program generation, but requires operator approval before running NC code on a real machine.
